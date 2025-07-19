
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/components/AuthContext';
import { 
  Menu,
  LayoutDashboard, 
  Users, 
  Gift, 
  Calendar, 
  CreditCard,
  Settings,
  LogOut,
  Home,
  X
} from 'lucide-react';

export const MobileAdminNav = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const closeSheet = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Admin Panel</h2>
            <Button variant="ghost" size="sm" onClick={closeSheet}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 py-4">
            <Link 
              to="/" 
              className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent mx-2 rounded-lg transition-colors"
              onClick={closeSheet}
            >
              <Home className="h-5 w-5" />
              <span>Back to Site</span>
            </Link>
            
            <div className="mt-4 space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname === '/admin/dashboard');
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    onClick={closeSheet}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
