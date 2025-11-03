import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Consulting from "./pages/Consulting";
import Engagement from "./pages/Engagement";
import Business from "./pages/Business";
import Humanities from "./pages/Humanities";
import SocialScience from "./pages/SocialScience";
import ProfessionalPrograms from "./pages/ProfessionalPrograms";
import LawPolicy from "./pages/LawPolicy";
import About from "./pages/About";
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
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/engagement" element={<Engagement />} />
          <Route path="/business" element={<Business />} />
          <Route path="/humanities" element={<Humanities />} />
          <Route path="/social-science" element={<SocialScience />} />
          <Route path="/professional-programs" element={<ProfessionalPrograms />} />
          <Route path="/law-policy" element={<LawPolicy />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
