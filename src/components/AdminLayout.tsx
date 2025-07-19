
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/components/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNavigation } from './AdminNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { session } = useAuth();
  const { isAdmin, loading } = useAdmin();

  console.log('AdminLayout - session:', !!session, 'isAdmin:', isAdmin, 'loading:', loading);

  if (!session) {
    console.log('AdminLayout - No session, redirecting to auth');
    return <Navigate to="/auth" />;
  }

  if (loading) {
    console.log('AdminLayout - Loading admin status');
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('AdminLayout - User is not admin, redirecting to home');
    return <Navigate to="/" />;
  }

  console.log('AdminLayout - Rendering admin layout with navigation');
  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
};
