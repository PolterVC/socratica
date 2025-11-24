import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/marketing/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, X, Check } from "lucide-react";
import mcgillLogo from "@/assets/mcgill-logo.png";
import udemLogo from "@/assets/udem-logo.png";
import concordiaLogo from "@/assets/concordia-logo.png";
import AnalyticsDonut from "@/components/marketing/AnalyticsDonut";
import MiniBars from "@/components/marketing/MiniBars";
import GuardrailsMock from "@/components/marketing/GuardrailsMock";
const Landing = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    document.title = "Socratica - Guided AI for students, clear insights for teachers";
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).single().then(({
          data
        }) => {
          setRole(data?.role ?? null);
        });
      }
    });
  }, []);
  const dashboardPath = role === "teacher" ? "/app/teacher" : "/app/student";
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
            Guided AI for students.<br />
            Clear insights for teachers.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The AI tutor that teaches critical thinking instead of doing the homework.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-base font-medium">
              <Link to={user ? dashboardPath : "/auth"}>
                {user ? "Continue to app" : "Get started"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium border-2">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <h3 className="text-center text-lg font-medium text-muted-foreground pt-12 pb-8">
        Profs from these schools can&apos;t wait to test Socratica
      </h3>

      {/* University Logos */}
      <section className="border-y bg-card overflow-hidden">
        <div className="container mx-auto px-6 py-12">
          <div className="relative">
            <div className="flex animate-[scroll_30s_linear_infinite] gap-16 md:gap-24">
              <img src={mcgillLogo} alt="McGill University" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              <img src={udemLogo} alt="Université de Montréal" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              <img src={concordiaLogo} alt="Concordia University" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              {/* Duplicate for seamless loop */}
              <img src={mcgillLogo} alt="McGill University" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              <img src={udemLogo} alt="Université de Montréal" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
              <img src={concordiaLogo} alt="Concordia University" className="h-20 object-contain opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Built for modern education
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to maintain rigor while supporting student learning
            </p>
          </div>

          
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-16 text-center">
            How Socratica works
          </h2>
          
          <div className="space-y-12">
            <div className="flex gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="w-0.5 h-full bg-border mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-foreground mb-3">Teachers upload materials</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Upload course content, readings, syllabi, and assignment guidelines. The AI uses these to understand your course context and expectations.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="w-0.5 h-full bg-border mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-foreground mb-3">Students learn through dialogue</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  When students ask questions, the AI guides them with Socratic questioning. It never provides direct answers, building critical thinking skills instead.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-3">Teachers see what to reteach</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  View analytics showing where students struggled, which concepts need reinforcement, and who needs additional support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-foreground text-background py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight">
              Ready to transform your classroom?
            </h2>
            <p className="text-xl text-background/80 leading-relaxed">
              Join hundreds of educators using Socratica to enhance student learning and gain valuable insights.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
              <Link to={user ? dashboardPath : "/auth"}>
                {user ? "Go to dashboard" : "Get started free"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-bold text-foreground">Socratica</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Guided AI for students, clear insights for teachers.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-3 text-sm">
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-3 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Connect</h4>
              <div className="space-y-3 text-sm">
                <a href="mailto:eli.polterovich@mail.mcgill.ca" className="block text-muted-foreground hover:text-foreground transition-colors">
                  eli.polterovich@mail.mcgill.ca
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Socratica. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;