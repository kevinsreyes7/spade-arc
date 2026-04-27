import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Profile } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './AuthContext'

interface ProfileContextValue {
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
  update: (updates: Partial<Profile>) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: async () => {},
  update: async () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Immediately flip loading=true the moment user becomes non-null so AuthGuard
  // never sees the (user exists, profile=null, loading=false) race-condition window
  // that previously caused logged-in users to be bounced to /onboarding on refresh.
  useEffect(() => {
    if (user) {
      setLoading(true)
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const p = data as Profile | null
    if (p && (p.current_week == null || p.current_week < 1)) {
      p.current_week = 1
    }
    setProfile(p)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const update = async (updates: Partial<Profile>) => {
    if (!user) return
    const { data } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (data) setProfile(data as Profile)
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: fetchProfile, update }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
