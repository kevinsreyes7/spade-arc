import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { useSubscription } from '@/hooks/useSubscription'

interface AuthGuardProps {
  children: ReactNode
  requireSubscription?: boolean
}

export function AuthGuard({ children, requireSubscription = true }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile()
  const { hasAccess } = useSubscription()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-4xl text-accent tracking-widest mb-2">♠</div>
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />
  if (requireSubscription && !hasAccess) return <Navigate to="/paywall" replace />

  return <>{children}</>
}
