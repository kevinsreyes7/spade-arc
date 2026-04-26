import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { Welcome } from '@/pages/onboarding/Welcome'
import { OnboardingFlow } from '@/pages/onboarding/OnboardingFlow'
import { Login } from '@/pages/Login'
import { Home } from '@/pages/Home'
import { SchedulePage } from '@/pages/SchedulePage'
import { Progress } from '@/pages/Progress'
import { Community } from '@/pages/Community'
import { Profile } from '@/pages/Profile'
import { Workout } from '@/pages/Workout'
import { Paywall } from '@/pages/Paywall'
import { useAuthContext } from '@/context/AuthContext'

function AppRoutes() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-5xl text-accent tracking-widest mb-4">♠</div>
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/paywall" element={<Paywall />} />

      {/* Protected */}
      <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
      <Route path="/schedule" element={<AuthGuard><SchedulePage /></AuthGuard>} />
      <Route path="/progress" element={<AuthGuard><Progress /></AuthGuard>} />
      <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
      <Route path="/workout/:dayId" element={<AuthGuard><Workout /></AuthGuard>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
