import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

async function fetchAdminSession() {
  const res = await fetch('/api/admin/auth/me', {
    credentials: 'include'
  });

  if (!res.ok) return null;

  const body = await res.json();
  return body.data as { sub: string; role: 'admin' };
}

interface Props {
  children: ReactNode;
}

export function RequireAdmin({ children }: Props) {
  const { data: admin, isLoading } = useQuery({
    queryKey: ['admin', 'session'],
    queryFn: fetchAdminSession,
    retry: false,
    staleTime: 60_000
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking access...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default RequireAdmin;