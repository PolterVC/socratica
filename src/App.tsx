import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Marketing pages
import Landing from "@/pages/marketing/Landing";
import Pricing from "@/pages/marketing/Pricing";
import Privacy from "@/pages/marketing/Privacy";
import Terms from "@/pages/marketing/Terms";

// App pages
import TeacherDashboard from "@/pages/app/TeacherDashboard";
import StudentDashboard from "@/pages/app/StudentDashboard";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return authed ? children : <Navigate to="/auth" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* Auth */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected app routes */}
          <Route
            path="/app/teacher"
            element={
              <RequireAuth>
                <TeacherDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/app/student"
            element={
              <RequireAuth>
                <StudentDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/app/chat/:conversationId"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          
          {/* Legacy route redirects */}
          <Route path="/chat/:conversationId" element={<Navigate to="/app/chat/:conversationId" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
