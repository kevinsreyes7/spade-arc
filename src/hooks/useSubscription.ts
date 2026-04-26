import { useProfile } from '@/context/ProfileContext'

export function useSubscription() {
  const { profile } = useProfile()

  const status = profile?.subscription_status ?? 'trial'
  const trialStart = profile?.trial_start ? new Date(profile.trial_start) : null

  const trialDaysLeft = (() => {
    if (!trialStart) return 7
    const elapsed = Math.floor((Date.now() - trialStart.getTime()) / 86400000)
    return Math.max(0, 7 - elapsed)
  })()

  const isTrialExpired = status === 'trial' && trialDaysLeft <= 0
  const isActive = status === 'active'
  const isCancelled = status === 'cancelled' || status === 'expired'
  const hasAccess = isActive || (status === 'trial' && !isTrialExpired)

  return { status, trialDaysLeft, isTrialExpired, isActive, isCancelled, hasAccess }
}
