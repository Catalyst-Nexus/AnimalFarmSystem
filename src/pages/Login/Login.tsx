import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { AlertCircle, Scan } from 'lucide-react'
import { FaceLogin } from '@/components/FaceRecognition'
import Particles from '@/components/Particles'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showFaceLogin, setShowFaceLogin] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setIsLoading(false)
      return
    }

    const success = await login(email, password)
    setIsLoading(false)

    if (success) {
      navigate('/dashboard')
    } else {
      // Error is already set in the store, just display a default message
      setError('Invalid email or password. Please try again.')
    }
  }

  return (
    <div className="relative flex items-center justify-end min-h-screen overflow-hidden pr-20 bg-gradient-to-br from-sky-400 via-teal-300 to-green-500">
      {/* Particles Background */}
      <div className="absolute inset-0">
        <Particles
          particleColors={["#8BC34A", "#FFC107", "#FF9800", "#795548", "#4CAF50", "#FFEB3B"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🐄</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Animal Farm
          </h1>
          <p className="text-gray-500 text-base">
            Farm Management System
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2.5">
            <label
              className="text-base font-semibold text-gray-700 pl-1"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              className={cn(
                'w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base',
                'bg-white text-gray-800 placeholder:text-gray-400',
                'transition-all duration-300',
                'focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100',
                'hover:border-gray-300',
                'disabled:bg-gray-50 disabled:cursor-not-allowed'
              )}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label
              className="text-base font-semibold text-gray-700 pl-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className={cn(
                'w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base',
                'bg-white text-gray-800 placeholder:text-gray-400',
                'transition-all duration-300',
                'focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100',
                'hover:border-gray-300',
                'disabled:bg-gray-50 disabled:cursor-not-allowed'
              )}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-5 py-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 text-base text-red-700 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            className={cn(
              'w-full py-4 mt-3 rounded-xl text-lg font-bold',
              'bg-gradient-to-r from-green-600 to-green-700 text-white',
              'shadow-lg shadow-green-500/30',
              'transition-all duration-300',
              'hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-md',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md',
              'focus:outline-none focus:ring-4 focus:ring-green-200'
            )}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-3">
            <div className="flex-grow border-t-2 border-gray-200" />
            <span className="px-4 text-sm font-medium text-gray-500 bg-white">Or continue with</span>
            <div className="flex-grow border-t-2 border-gray-200" />
          </div>

          {/* Face Login Button */}
          <button
            type="button"
            onClick={() => setShowFaceLogin(true)}
            disabled={isLoading}
            className={cn(
              'w-full py-4 rounded-xl text-base font-bold',
              'bg-white border-2 border-green-600 text-green-700',
              'transition-all duration-300',
              'hover:bg-green-50 hover:border-green-700 hover:-translate-y-0.5 hover:shadow-lg',
              'active:translate-y-0',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
              'flex items-center justify-center gap-3',
              'focus:outline-none focus:ring-4 focus:ring-green-200'
            )}
          >
            <Scan className="w-5 h-5" />
            Face Recognition
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-base text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-green-700 hover:text-green-800 hover:underline transition-colors"
            >
              Request Access
            </Link>
          </p>
        </div>
      </div>

      {/* Face Login Modal */}
      <FaceLogin
        isOpen={showFaceLogin}
        onClose={() => setShowFaceLogin(false)}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  )
}

export default Login
