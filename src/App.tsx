import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { Welcome } from '@/pages/onboarding/Welcome'
import { OnboardingFlow } from '@/pages/onboarding/OnboardingFlow'
import { Login } from '@/pages/Login'
import { Home } from '@/pages/Home'
import { TrainPage } from '@/pages/TrainPage'
import { Progress } from '@/pages/Progress'
import { Community } from '@/pages/Community'
import { Profile } from '@/pages/Profile'
import { Workout } from '@/pages/Workout'
import { SpeedDay } from '@/pages/SpeedDay'
import { JumpRope } from '@/pages/JumpRope'
import { Swimming } from '@/pages/Swimming'
import { Paywall } from '@/pages/Paywall'
import { Nutrition } from '@/pages/Nutrition'
import { Library } from '@/pages/Library'
import { ArticleReader } from '@/pages/ArticleReader'
import { Restore } from '@/pages/Restore'
import { EODR } from '@/pages/EODR'
import { Journal } from '@/pages/Journal'
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

      {/* Protected — main tabs */}
      <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
      <Route path="/train" element={<AuthGuard><TrainPage /></AuthGuard>} />
      <Route path="/progress" element={<AuthGuard><Progress /></AuthGuard>} />
      <Route path="/nutrition" element={<AuthGuard><Nutrition /></AuthGuard>} />
      <Route path="/library" element={<AuthGuard><Library /></AuthGuard>} />
      <Route path="/library/:id" element={<AuthGuard><ArticleReader /></AuthGuard>} />

      {/* Protected — session screens */}
      <Route path="/workout/:dayId" element={<AuthGuard><Workout /></AuthGuard>} />
      <Route path="/speed-day" element={<AuthGuard><SpeedDay /></AuthGuard>} />
      <Route path="/jump-rope" element={<AuthGuard><JumpRope /></AuthGuard>} />
      <Route path="/swimming" element={<AuthGuard><Swimming /></AuthGuard>} />

      {/* Protected — secondary pages */}
      <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
      <Route path="/restore" element={<AuthGuard><Restore /></AuthGuard>} />
      <Route path="/eodr" element={<AuthGuard><EODR /></AuthGuard>} />
      <Route path="/journal" element={<AuthGuard><Journal /></AuthGuard>} />

      {/* Legacy redirect */}
      <Route path="/schedule" element={<Navigate to="/train" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
