import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { ScrollToTop } from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import GiftCards from "./pages/GiftCards";
import Memberships from "./pages/Memberships";
import OurHub from "./pages/OurHub";
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
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/fitness-recovery" element={<FitnessRecovery />} />
            <Route path="/your-visit" element={<YourVisit />} />
            <Route path="/our-hub" element={<OurHub />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/membership-success" element={<MembershipSuccess />} />
            <Route path="/gift-card-success" element={<GiftCardSuccess />} />
            <Route path="/intro-offer-success" element={<IntroOfferSuccess />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/schedule" element={<ModernScheduleManagement />} />
            <Route path="/admin/bookings" element={<ModernBookingManagement />} />
            <Route path="/admin/customers" element={<ModernCustomerManagement />} />
            <Route path="/admin/gift-cards" element={<ModernGiftCardManagement />} />
            <Route path="/admin/memberships" element={<AdminMemberships />} />
            <Route path="/admin/reports" element={<ModernReports />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/partner-codes" element={<PartnerCodes />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
