import {
  getAuthenticatedStaff,
  getAuthenticatedUser,
  getServerClient,
  json,
} from './_lib/supabase.js'

const maxTitleLength = 120
const maxBodyLength = 2000
const maxAnswerLength = 2000
const publicLimit = 50
const adminLimit = 200
const dailyQuestionLimit = 5
const staffRoles = ['owner', 'manager', 'front_desk', 'staff']
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function uuidOrNull(value) {
  const candidate = String(value ?? '').trim()
  return uuidPattern.test(candidate) ? candidate : null
}

function limitFromQuery(value, fallback, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function serializeTopic(topic, answers, { includePrivate = false } = {}) {
  return {
    id: topic.id,
    title: topic.title,
    body: topic.body,
    locale: topic.locale,
    authorName: topic.author_name,
    status: topic.status,
    createdAt: topic.created_at,
    answeredAt: topic.answered_at,
    publishedAt: topic.published_at,
    ...(includePrivate
      ? {
          authorEmail: topic.author_email,
          userId: topic.user_id,
          customerId: topic.customer_id,
        }
      : {}),
    answers: answers.map((answer) => ({
      id: answer.id,
      body: answer.body,
      authorName: answer.author_name || 'ORA',
      createdAt: answer.created_at,
    })),
  }
}

async function answersByTopic(client, topicIds) {
  if (topicIds.length === 0) return new Map()

  const { data, error } = await client
    .from('forum_answers')
    .select('*')
    .in('topic_id', topicIds)
    .order('created_at', { ascending: true })

  if (error) return new Map()

  const grouped = new Map()
  for (const answer of data ?? []) {
    const list = grouped.get(answer.topic_id) ?? []
    list.push(answer)
    grouped.set(answer.topic_id, list)
  }
  return grouped
}

async function loadTopics(client, { status, limit, includePrivate }) {
  let query = client.from('forum_topics').select('*')

  if (status) query = query.eq('status', status)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { error: 'load_failed' }

  const topics = data ?? []
  const answers = await answersByTopic(
    client,
    topics.map((topic) => topic.id),
  )

  return {
    topics: topics.map((topic) =>
      serializeTopic(topic, answers.get(topic.id) ?? [], { includePrivate }),
    ),
  }
}

async function handleGet(request, response) {
  const scope = String(request.query?.scope ?? '')

  if (scope === 'admin') {
    const auth = await getAuthenticatedStaff(request)
    if (auth.error) return json(response, auth.status, { error: auth.error })

    const status = String(request.query?.status ?? '').trim()
    const allowed = ['pending', 'published', 'hidden']
    const result = await loadTopics(auth.adminClient, {
      status: allowed.includes(status) ? status : null,
      limit: limitFromQuery(request.query?.limit, adminLimit, adminLimit),
      includePrivate: true,
    })
    if (result.error) return json(response, 500, { error: result.error })
    return json(response, 200, result)
  }

  const client = getServerClient()
  if (!client) return json(response, 500, { error: 'server_not_configured' })

  const result = await loadTopics(client, {
    status: 'published',
    limit: limitFromQuery(request.query?.limit, publicLimit, publicLimit),
    includePrivate: false,
  })
  if (result.error) return json(response, 500, { error: result.error })

  return json(response, 200, result)
}

async function staffProfileFor(client, userId) {
  const { data, error } = await client
    .from('staff_profiles')
    .select('id, display_name, role, active')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.active || !staffRoles.includes(data.role)) return null
  return data
}

async function askQuestion({ adminClient, user, email, body, response }) {
  const title = text(body?.title, maxTitleLength)
  const content = text(body?.body, maxBodyLength)

  if (title.length < 3 || content.length < 10) {
    return json(response, 400, { error: 'invalid_input' })
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await adminClient
    .from('forum_topics')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if ((count ?? 0) >= dailyQuestionLimit) {
    return json(response, 429, { error: 'too_many_questions' })
  }

  const { data: customer } = await adminClient
    .from('customers')
    .select('id, name')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const fallbackName = String(user.user_metadata?.full_name ?? '').trim()
  const authorName =
    text(customer?.name || fallbackName || email.split('@')[0], 80) || 'Guest'

  const { data, error } = await adminClient
    .from('forum_topics')
    .insert({
      user_id: user.id,
      customer_id: customer?.id ?? null,
      author_name: authorName,
      author_email: email,
      locale: text(body?.locale, 10) || 'en',
      title,
      body: content,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error || !data) {
    return json(response, 500, { error: 'submit_failed' })
  }

  return json(response, 201, { topic: serializeTopic(data, [], { includePrivate: true }) })
}

async function updateStatus(adminClient, topicId, status) {
  const now = new Date().toISOString()
  const patch = { status, updated_at: now }
  if (status === 'published') patch.published_at = now

  const { data, error } = await adminClient
    .from('forum_topics')
    .update(patch)
    .eq('id', topicId)
    .select('*')
    .maybeSingle()

  if (error) return { error: 'update_failed' }
  if (!data) return { error: 'topic_not_found' }
  return { topic: data }
}

async function handleStaffAction({ request, response, adminClient, staff, action }) {
  if (action === 'answer') {
    const topicId = uuidOrNull(request.body?.topicId)
    const content = text(request.body?.body, maxAnswerLength)
    if (!topicId || content.length < 2) {
      return json(response, 400, { error: 'invalid_input' })
    }

    const { data: topic } = await adminClient
      .from('forum_topics')
      .select('id')
      .eq('id', topicId)
      .maybeSingle()
    if (!topic) return json(response, 404, { error: 'topic_not_found' })

    const now = new Date().toISOString()
    const { data, error } = await adminClient
      .from('forum_answers')
      .insert({
        topic_id: topicId,
        staff_id: staff.id,
        author_name: staff.display_name || 'ORA',
        body: content,
      })
      .select('*')
      .single()

    if (error || !data) {
      return json(response, 500, { error: 'save_failed' })
    }

    await adminClient
      .from('forum_topics')
      .update({ answered_at: now, updated_at: now })
      .eq('id', topicId)

    return json(response, 200, {
      answer: {
        id: data.id,
        body: data.body,
        authorName: data.author_name,
        createdAt: data.created_at,
      },
    })
  }

  if (action === 'publish' || action === 'hide') {
    const topicId = uuidOrNull(request.body?.topicId)
    if (!topicId) return json(response, 400, { error: 'invalid_topic' })

    const result = await updateStatus(
      adminClient,
      topicId,
      action === 'publish' ? 'published' : 'hidden',
    )
    if (result.error) {
      return json(response, result.error === 'topic_not_found' ? 404 : 500, {
        error: result.error,
      })
    }
    return json(response, 200, { topic: result.topic })
  }

  return json(response, 400, { error: 'unknown_action' })
}

async function handlePost(request, response) {
  const auth = await getAuthenticatedUser(request)
  if (auth.error) return json(response, auth.status, { error: auth.error })

  const { adminClient, user, email } = auth
  const staff = await staffProfileFor(adminClient, user.id)
  const action = String(request.body?.action ?? 'ask')

  if (staff && action !== 'ask') {
    return handleStaffAction({ request, response, adminClient, staff, action })
  }

  if (action !== 'ask') {
    return json(response, 403, { error: 'forbidden' })
  }

  return askQuestion({ adminClient, user, email, body: request.body, response })
}

async function handleDelete(request, response) {
  const auth = await getAuthenticatedStaff(request)
  if (auth.error) return json(response, auth.status, { error: auth.error })

  const topicId = uuidOrNull(request.query?.id)
  if (!topicId) return json(response, 400, { error: 'invalid_topic' })

  const { error } = await auth.adminClient
    .from('forum_topics')
    .delete()
    .eq('id', topicId)

  if (error) return json(response, 500, { error: 'delete_failed' })
  return json(response, 200, { ok: true })
}

export default async function handler(request, response) {
  if (request.method === 'GET') return handleGet(request, response)
  if (request.method === 'POST') return handlePost(request, response)
  if (request.method === 'DELETE') return handleDelete(request, response)

  response.setHeader('Allow', 'GET, POST, DELETE')
  return json(response, 405, { error: 'method_not_allowed' })
}
