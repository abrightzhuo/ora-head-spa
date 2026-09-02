import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Membership } from '../lib/supabase'

export type AuthMode = 'sign-in' | 'sign-up'
export type AuthDefaults = {
  email?: string
  name?: string
  phone?: string
}

export type CustomerAuthValue = {
  session: Session | null
  user: User | null
  membership: Membership | null
  membershipLoading: boolean
  loading: boolean
  refreshMembership: () => Promise<void>
  openAuth: (mode?: AuthMode, defaults?: AuthDefaults) => void
  closeAuth: () => void
  signOut: () => Promise<void>
}

export const CustomerAuthContext =
  createContext<CustomerAuthValue | null>(null)

export function useCustomerAuth() {
  const value = useContext(CustomerAuthContext)
  if (!value) {
    throw new Error('CustomerAuthProvider is required')
  }
  return value
}
