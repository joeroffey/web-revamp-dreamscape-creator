import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* TEMPORARY: all routes return 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
