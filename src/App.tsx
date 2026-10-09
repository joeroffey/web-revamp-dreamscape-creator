import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, hydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./components/AuthContext";
import { ScrollToTop } from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import GiftCards from "./pages/GiftCards";
import Memberships from "./pages/Memberships";
import OurHub from "./pages/OurHub";
import RedLightTherapy from "./pages/RedLightTherapy";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BookingSuccess from "./pages/BookingSuccess";
import MembershipSuccess from "./pages/MembershipSuccess";
import GiftCardSuccess from "./pages/GiftCardSuccess";
import IntroOfferSuccess from "./pages/IntroOfferSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CookiePolicy from "./pages/CookiePolicy";
import FitnessRecovery from "./pages/FitnessRecovery";
import YourVisit from "./pages/YourVisit";
import NotFound from "./pages/NotFound";
import RedeemGiftCard from "./pages/RedeemGiftCard";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import ModernBookingManagement from "./components/admin/ModernBookingManagement";
import ModernCustomerManagement from "./components/admin/ModernCustomerManagement";
import ModernGiftCardManagement from "./components/admin/ModernGiftCardManagement";
import AdminMemberships from "./pages/admin/Memberships";
import ModernReports from "./pages/admin/ModernReports";
import AdminSettings from "./pages/admin/Settings";
import ModernScheduleManagement from "./components/admin/ModernScheduleManagement";
import AdminBlog from "./pages/admin/Blog";
import PartnerCodes from "./pages/admin/PartnerCodes";
import AdminEvents from "./pages/admin/Events";
import ModernMessageManagement from "./components/admin/ModernMessageManagement";
import ConditionalEmails from "./pages/admin/ConditionalEmails";
declare global {
  interface Window {
    __RH_QUERY_STATE__?: unknown;
  }
}

const queryClient = new QueryClient();

// Pages pre-rendered at build time embed the data they were rendered with
// (blog posts, events) so the browser shows the same content instantly and
// then refreshes it in the background.
if (typeof window !== "undefined" && window.__RH_QUERY_STATE__) {
  try {
    hydrate(queryClient, window.__RH_QUERY_STATE__ as Parameters<typeof hydrate>[1]);
  } catch {
    // Ignore malformed state — the pages simply fetch their data as normal.
  }
}

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/events" element={<Events />} />
    <Route path="/blog" element={<Blog />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/booking" element={<Booking />} />
    <Route path="/gift-cards" element={<GiftCards />} />
    <Route path="/memberships" element={<Memberships />} />
    <Route path="/fitness-recovery" element={<FitnessRecovery />} />
    <Route path="/your-visit" element={<YourVisit />} />
    <Route path="/our-hub" element={<OurHub />} />
    <Route path="/red-light-therapy" element={<RedLightTherapy />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/booking-success" element={<BookingSuccess />} />
    <Route path="/membership-success" element={<MembershipSuccess />} />
    <Route path="/gift-card-success" element={<GiftCardSuccess />} />
    <Route path="/intro-offer-success" element={<IntroOfferSuccess />} />
    <Route path="/redeem-gift-card" element={<RedeemGiftCard />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-conditions" element={<TermsConditions />} />
    <Route path="/cookie-policy" element={<CookiePolicy />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
    <Route path="/admin/schedule" element={<ModernScheduleManagement />} />
    <Route path="/admin/bookings" element={<ModernBookingManagement />} />
    <Route path="/admin/customers" element={<ModernCustomerManagement />} />
    <Route path="/admin/gift-cards" element={<ModernGiftCardManagement />} />
    <Route path="/admin/memberships" element={<AdminMemberships />} />
    <Route path="/admin/reports" element={<ModernReports />} />
    <Route path="/admin/blog" element={<AdminBlog />} />
    <Route path="/admin/partner-codes" element={<PartnerCodes />} />
    <Route path="/admin/events" element={<AdminEvents />} />
    <Route path="/admin/messages" element={<ModernMessageManagement />} />
    <Route path="/admin/conditional-emails" element={<ConditionalEmails />} />
    <Route path="/admin/settings" element={<AdminSettings />} />
    <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

interface AppProvidersProps {
  client: QueryClient;
  helmetContext?: Record<string, unknown>;
  children: ReactNode;
}

/** Shared by the browser app (below) and the build-time pre-renderer (entry-server.tsx). */
export const AppProviders = ({ client, helmetContext, children }: AppProvidersProps) => (
  <HelmetProvider context={helmetContext}>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

const App = () => (
  <AppProviders client={queryClient}>
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>
);

export default App;
