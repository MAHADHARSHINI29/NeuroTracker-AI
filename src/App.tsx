import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import HeadacheTracker from "./pages/HeadacheTracker";
import PredictionResults from "./pages/PredictionResults";
import Analytics from "./pages/Analytics";
import DoctorReport from "./pages/DoctorReport";
import DoctorFinder from "./pages/DoctorFinder";
import Settings from "./pages/Settings";
import HealthGuide from "./pages/Research";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracker" element={<HeadacheTracker />} />
          <Route path="/prediction/:entryId" element={<PredictionResults />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/report" element={<DoctorReport />} />
          <Route path="/doctor-finder" element={<DoctorFinder />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/health-guide" element={<HealthGuide />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
