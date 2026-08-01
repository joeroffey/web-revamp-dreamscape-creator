import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  bookings: 'Bookings',
  customers: 'Customers',
  'gift-cards': 'Gift Cards',
  memberships: 'Memberships',
  'partner-codes': 'Partner Codes',
  events: 'Events',
  blog: 'Blog',
  messages: 'Messages',
  reports: 'Reports',
  settings: 'Settings',
};

export function AdminBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1 flex-wrap">
        {parts.map((part, i) => {
          const href = '/' + parts.slice(0, i + 1).join('/');
          const label = labels[part] || part;
          const last = i === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
              {last ? (
                <span className="text-foreground font-medium">{label}</span>
              ) : (
                <Link to={href} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
