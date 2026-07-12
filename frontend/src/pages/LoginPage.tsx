import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [navigate, user])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    navigate("/", { replace: true })
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    })

    setLoading(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
            <p className="text-sm text-slate-500 mt-2">
              Enter your account email and we'll send you a password reset link.
            </p>
          </div>

          {resetSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                ✅ Password reset link sent! Check your inbox at <strong>{resetEmail}</strong>.
              </div>
              <button
                onClick={() => { setShowForgotPassword(false); setResetSent(false); setError(null); }}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reset-email">
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setShowForgotPassword(false); setError(null); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to AssetFlow</h1>
          <p className="text-sm text-slate-500 mt-2">Use your workspace account to continue.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@assetflow.test"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(null); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          New user?{" "}
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
