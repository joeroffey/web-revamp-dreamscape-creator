
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Gift, 
  Calendar, 
  CreditCard,
  Settings,
  LogOut,
  Home
} from 'lucide-react';

export const AdminNavigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  console.log('AdminNavigation - Current location:', location.pathname);

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/customers', icon: Users, label: 'Customers' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/gift-cards', icon: Gift, label: 'Gift Cards' },
    { href: '/admin/memberships', icon: CreditCard, label: 'Memberships' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    console.log('AdminNavigation - Signing out');
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-card border-b-2 border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
              <Home className="h-6 w-6" />
              <span className="font-semibold">Back to Site</span>
            </Link>
            
            {/* Mobile and Desktop Navigation */}
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname === '/admin/dashboard');
                
                console.log(`AdminNavigation - Item ${item.label}: href=${item.href}, current=${location.pathname}, isActive=${isActive}`);
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="flex items-center space-x-2 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
