import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Gift,
  CreditCard,
  Building2,
  CalendarDays,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Home,
} from 'lucide-react';

type NavItem = {
  href: string;
  icon: typeof Calendar;
  label: string;
  badgeKey?: 'unreadMessages';
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operations',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/schedule', icon: Calendar, label: 'Schedule' },
      { href: '/admin/bookings', icon: ClipboardList, label: 'Bookings' },
      { href: '/admin/customers', icon: Users, label: 'Customers' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/gift-cards', icon: Gift, label: 'Gift Cards' },
      { href: '/admin/memberships', icon: CreditCard, label: 'Memberships' },
      { href: '/admin/partner-codes', icon: Building2, label: 'Partner Codes' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/events', icon: CalendarDays, label: 'Events' },
      { href: '/admin/blog', icon: FileText, label: 'Blog' },
      { href: '/admin/messages', icon: MessageSquare, label: 'Messages', badgeKey: 'unreadMessages' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const isActive = (href: string) =>
    pathname === href ||
    (href === '/admin' && pathname === '/admin/dashboard') ||
    (href !== '/admin' && pathname.startsWith(href));

  const badges: Record<string, number> = { unreadMessages };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-2 py-1.5 text-primary hover:opacity-80 transition-opacity"
        >
          <Home className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="font-semibold truncate">Back to Site</span>}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                          <NavLink to={item.href} end={item.href === '/admin'}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                        {badge > 0 && (
                          <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                            {badge > 99 ? '99+' : badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
