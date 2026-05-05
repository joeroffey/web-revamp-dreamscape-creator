import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/components/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminBreadcrumbs } from './admin/AdminBreadcrumbs';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { session, signOut } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (!session) {
    return <Navigate to="/auth" />;
  }

  if (loading) {
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

  if (!isAdmin && !loading) {
    return <Navigate to="/" />;
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-2 border-b bg-card/60 backdrop-blur sticky top-0 z-40 px-3 md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <AdminBreadcrumbs />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="sm:hidden mb-4">
              <AdminBreadcrumbs />
            </div>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
