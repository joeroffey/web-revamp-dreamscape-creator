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

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/customers', icon: Users, label: 'Customers' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/gift-cards', icon: Gift, label: 'Gift Cards' },
    { href: '/admin/memberships', icon: CreditCard, label: 'Memberships' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-primary">
              <Home className="h-6 w-6" />
              <span className="font-semibold">Back to Site</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};