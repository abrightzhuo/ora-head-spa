import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Clock3,
  Coffee,
  LogIn,
  LogOut,
  PencilLine,
  X,
} from 'lucide-react'
import {
  supabase,
  type StaffProfile,
  type TimeBreak,
  type TimeEditRequest,
  type TimeEntry,
} from '../../lib/supabase'
import {
  easternInputValue,
  easternLocalDateTimeToIso,
  formatEasternDateTime,
} from '../../lib/dateTime'

type Props = {
  locale: 'zh' | 'en'
  currentProfile: StaffProfile
  staff: StaffProfile[]
}

function localInputValue(value: string | null) {
  return easternInputValue(value)
}

export function TimeClockPanel({
  locale,
  currentProfile,
  staff,
}: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [breaks, setBreaks] = useState<TimeBreak[]>([])
  const [requests, setRequests] = useState<TimeEditRequest[]>([])
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [managerEditing, setManagerEditing] = useState(false)
  const [requestedIn, setRequestedIn] = useState('')
  const [requestedOut, setRequestedOut] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const isManager =
    currentProfile.role === 'owner' || currentProfile.role === 'manager'

  const t =
    locale === 'zh'
      ? {
          title: '员工考勤',
          note: '打卡、休息、工时修改申请和经理审批。',
          clockIn: 'CLOCK IN',
          break: 'BREAK',
          endBreak: 'END BREAK',
          clockOut: 'CLOCK OUT',
          currentShift: '当前班次',
          recent: '最近工时',
          edit: '申请修改',
          directEdit: '经理直接修改',
          original: '原时间',
          requested: '申请时间',
          reason: '修改原因',
          submit: '发送请求',
          pending: '待经理审批',
          approvals: '工时修改审批',
          approve: '批准',
          reject: '拒绝',
          noEntries: '暂无工时记录。',
          noRequests: '暂无待审批申请。',
          success: '操作已完成。',
          failed: '操作失败，请重试。',
          open: '进行中',
          total: '总工时',
        }
      : {
          title: 'Time Clock',
          note: 'Clock in, take breaks, request time edits and review approvals.',
          clockIn: 'CLOCK IN',
          break: 'BREAK',
          endBreak: 'END BREAK',
          clockOut: 'CLOCK OUT',
          currentShift: 'Current shift',
          recent: 'Recent time entries',
          edit: 'Request edit',
          directEdit: 'Manager edit',
          original: 'Original time',
          requested: 'Requested time',
          reason: 'Reason',
          submit: 'Send request',
          pending: 'Pending Manager Approval',
          approvals: 'Time Edit Approvals',
          approve: 'Approve',
          reject: 'Reject',
          noEntries: 'No time entries yet.',
          noRequests: 'No pending requests.',
          success: 'Action completed.',
          failed: 'Unable to complete this action.',
          open: 'Open',
          total: 'Total hours',
        }

  const staffById = useMemo(
    () => new Map(staff.map((profile) => [profile.id, profile])),
    [staff],
  )

  const load = useCallback(async () => {
    if (!supabase) return
    const entryQuery = supabase
      .from('time_entries')
      .select('*')
      .order('clock_in', { ascending: false })
      .limit(isManager ? 100 : 30)
    const requestQuery = supabase
      .from('time_edit_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    const [entryResult, requestResult] = await Promise.all([
      entryQuery,
      requestQuery,
    ])

    const loadedEntries = (entryResult.data ?? []) as TimeEntry[]
    setEntries(loadedEntries)
    setRequests((requestResult.data ?? []) as TimeEditRequest[])

    if (loadedEntries.length) {
      const { data } = await supabase
        .from('time_breaks')
        .select('*')
        .in(
          'time_entry_id',
          loadedEntries.map((entry) => entry.id),
        )
        .order('started_at', { ascending: false })
      setBreaks((data ?? []) as TimeBreak[])
    } else {
      setBreaks([])
    }
  }, [isManager])

  useEffect(() => {
    void load()
  }, [load])

  const ownEntries = entries.filter(
    (entry) => entry.staff_id === currentProfile.id,
  )
  const activeEntry = ownEntries.find((entry) => !entry.clock_out)
  const activeBreak = activeEntry
    ? breaks.find(
        (item) =>
          item.time_entry_id === activeEntry.id && !item.ended_at,
      )
    : null

  const clockAction = async (
    action: 'clock_in' | 'start_break' | 'end_break' | 'clock_out',
  ) => {
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.rpc('clock_action', {
      action_name: action,
    })
    setMessage(error ? t.failed : t.success)
    if (!error) await load()
    setBusy(false)
  }

  const openEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setManagerEditing(isManager)
    setRequestedIn(localInputValue(entry.clock_in))
    setRequestedOut(localInputValue(entry.clock_out))
    setReason('')
  }

  const submitEdit = async () => {
    if (!supabase || !editingEntry || !requestedIn || reason.trim().length < 3) {
      setMessage(t.failed)
      return
    }
    setBusy(true)
    const requestedClockOut = requestedOut
      ? easternLocalDateTimeToIso(requestedOut)
      : null
    const { error } = managerEditing
      ? await supabase.rpc('manager_edit_time_entry', {
          entry_id: editingEntry.id,
          new_clock_in: easternLocalDateTimeToIso(requestedIn),
          new_clock_out: requestedClockOut,
          edit_reason: reason.trim(),
        })
      : await supabase.from('time_edit_requests').insert({
          time_entry_id: editingEntry.id,
          requested_by: currentProfile.id,
          original_clock_in: editingEntry.clock_in,
          original_clock_out: editingEntry.clock_out,
            requested_clock_in: easternLocalDateTimeToIso(requestedIn),
          requested_clock_out: requestedClockOut,
          reason: reason.trim(),
        })
    setMessage(error ? t.failed : managerEditing ? t.success : t.pending)
    if (!error) {
      setEditingEntry(null)
      await load()
    }
    setBusy(false)
  }

  const review = async (
    requestId: string,
    decision: 'approved' | 'rejected',
  ) => {
    if (!supabase) return
    setBusy(true)
    const { error } = await supabase.rpc('review_time_edit_request', {
      request_id: requestId,
      decision,
      manager_note: null,
    })
    setMessage(error ? t.failed : t.success)
    if (!error) await load()
    setBusy(false)
  }

  const workedMinutes = (entry: TimeEntry) => {
    const end = entry.clock_out ? new Date(entry.clock_out) : new Date()
    const breakMinutes = breaks
      .filter((item) => item.time_entry_id === entry.id)
      .reduce((sum, item) => {
        const breakEnd = item.ended_at ? new Date(item.ended_at) : new Date()
        return (
          sum +
          Math.max(
            0,
            (breakEnd.getTime() - new Date(item.started_at).getTime()) /
              60000,
          )
        )
      }, 0)
    return Math.max(
      0,
      (end.getTime() - new Date(entry.clock_in).getTime()) / 60000 -
        breakMinutes,
    )
  }

  const pendingRequests = requests.filter(
    (request) => request.status === 'pending',
  )
  const visibleEntries = isManager ? entries : ownEntries

  return (
    <section className="admin-panel time-clock-panel">
      <header>
        <div>
          <Clock3 size={21} />
          <div>
            <h2>{t.title}</h2>
            <p>{t.note}</p>
          </div>
        </div>
      </header>

      {message && <p className="time-clock-message">{message}</p>}

      <div className="time-clock-actions">
        {!activeEntry ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void clockAction('clock_in')}
          >
            <LogIn size={18} />
            {t.clockIn}
          </button>
        ) : (
          <>
            {!activeBreak ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void clockAction('start_break')}
              >
                <Coffee size={18} />
                {t.break}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void clockAction('end_break')}
              >
                <Coffee size={18} />
                {t.endBreak}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void clockAction('clock_out')}
            >
              <LogOut size={18} />
              {t.clockOut}
            </button>
          </>
        )}
      </div>

      {activeEntry && (
        <div className="current-shift">
          <span>{t.currentShift}</span>
          <strong>
              {formatEasternDateTime(
                activeEntry.clock_in,
              locale === 'zh' ? 'zh-CN' : 'en-US',
              { dateStyle: 'medium', timeStyle: 'short' },
              )}
          </strong>
          <em>{activeBreak ? t.break : t.open}</em>
        </div>
      )}

      <div className="time-clock-section">
        <h3>{t.recent}</h3>
        {visibleEntries.length === 0 ? (
          <p>{t.noEntries}</p>
        ) : (
          <div className="time-entry-list">
            {visibleEntries.map((entry) => (
              <article key={entry.id}>
                <div>
                  <strong>
                    {isManager
                      ? `${staffById.get(entry.staff_id)?.display_name ?? '—'} · `
                      : ''}
                      {formatEasternDateTime(
                        entry.clock_in,
                      locale === 'zh' ? 'zh-CN' : 'en-US',
                      { dateStyle: 'medium' },
                      )}
                  </strong>
                  <span>
                      {formatEasternDateTime(
                        entry.clock_in,
                      locale === 'zh' ? 'zh-CN' : 'en-US',
                      { timeStyle: 'short' },
                      )}
                    {' – '}
                    {entry.clock_out
                        ? formatEasternDateTime(
                            entry.clock_out,
                          locale === 'zh' ? 'zh-CN' : 'en-US',
                          { timeStyle: 'short' },
                          )
                      : t.open}
                  </span>
                </div>
                <strong>
                  {t.total}: {(workedMinutes(entry) / 60).toFixed(2)}
                </strong>
                <button type="button" onClick={() => openEdit(entry)}>
                  <PencilLine size={14} />
                  {isManager ? t.directEdit : t.edit}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingEntry && (
        <div className="time-edit-form">
          <h3>{managerEditing ? t.directEdit : t.edit}</h3>
          <div>
            <label>
              <span>Clock In</span>
              <input
                type="datetime-local"
                value={requestedIn}
                onChange={(event) => setRequestedIn(event.target.value)}
              />
            </label>
            <label>
              <span>Clock Out</span>
              <input
                type="datetime-local"
                value={requestedOut}
                onChange={(event) => setRequestedOut(event.target.value)}
              />
            </label>
          </div>
          <label>
            <span>{t.reason}</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div>
            <button type="button" onClick={() => setEditingEntry(null)}>
              <X size={14} />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitEdit()}
            >
              {t.submit}
            </button>
          </div>
        </div>
      )}

      {isManager && (
        <div className="time-clock-section">
          <h3>{t.approvals}</h3>
          {pendingRequests.length === 0 ? (
            <p>{t.noRequests}</p>
          ) : (
            <div className="time-request-list">
              {pendingRequests.map((request) => (
                <article key={request.id}>
                  <div>
                    <strong>
                      {staffById.get(request.requested_by)?.display_name ?? '—'}
                    </strong>
                    <span>{request.reason}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>{t.original}</dt>
                      <dd>
                          {formatEasternDateTime(
                            request.original_clock_in,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                            { dateStyle: 'medium', timeStyle: 'short' },
                          )}
                        {' – '}
                        {request.original_clock_out
                            ? formatEasternDateTime(
                                request.original_clock_out,
                                locale === 'zh' ? 'zh-CN' : 'en-US',
                                { dateStyle: 'medium', timeStyle: 'short' },
                              )
                          : t.open}
                      </dd>
                    </div>
                    <div>
                      <dt>{t.requested}</dt>
                      <dd>
                          {formatEasternDateTime(
                            request.requested_clock_in,
                            locale === 'zh' ? 'zh-CN' : 'en-US',
                            { dateStyle: 'medium', timeStyle: 'short' },
                          )}
                        {' – '}
                        {request.requested_clock_out
                            ? formatEasternDateTime(
                                request.requested_clock_out,
                                locale === 'zh' ? 'zh-CN' : 'en-US',
                                { dateStyle: 'medium', timeStyle: 'short' },
                              )
                          : t.open}
                      </dd>
                    </div>
                  </dl>
                  <div className="time-request-actions">
                    <button
                      type="button"
                      onClick={() => void review(request.id, 'rejected')}
                    >
                      <X size={14} />
                      {t.reject}
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(request.id, 'approved')}
                    >
                      <Check size={14} />
                      {t.approve}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
