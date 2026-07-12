import type { ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"

import type { UserRole } from "@/lib/database.types"
import { useAuthStore } from "@/stores/authStore"

type ProtectedRouteProps = {
  children?: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
