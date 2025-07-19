import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import GiftCards from "./pages/GiftCards";
import Memberships from "./pages/Memberships";
import OurHub from "./pages/OurHub";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BookingSuccess from "./pages/BookingSuccess";
import GiftCardSuccess from "./pages/GiftCardSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import FitnessRecovery from "./pages/FitnessRecovery";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminCustomers from "./pages/admin/Customers";
import AdminGiftCards from "./pages/admin/GiftCards";
import AdminMemberships from "./pages/admin/Memberships";
import AdminSettings from "./pages/admin/Settings";
import AdminSchedule from "./pages/admin/Schedule";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/fitness-recovery" element={<FitnessRecovery />} />
            <Route path="/our-hub" element={<OurHub />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/gift-card-success" element={<GiftCardSuccess />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/gift-cards" element={<AdminGiftCards />} />
            <Route path="/admin/memberships" element={<AdminMemberships />} />
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
