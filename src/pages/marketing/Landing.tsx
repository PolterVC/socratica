import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/marketing/Navbar";
import { CheckCircle, Users, TrendingUp, BookOpen, MessageSquare, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Socratica - Guided AI for students, clear insights for teachers";
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            setRole(data?.role ?? null);
          });
      }
    });
  }, []);

  const dashboardPath = role === "teacher" ? "/app/teacher" : "/app/student";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Guided AI for students,<br />
            <span className="text-primary">clear insights for teachers</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Socratica gives students a tutor that will not do the homework, and it shows teachers what to reteach tomorrow.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to={user ? dashboardPath : "/auth"}>
                {user ? "Continue to app" : "Get started free"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-12 border-y">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">10K+</div>
            <div className="text-sm text-muted-foreground">Students helped</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-border"></div>
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm text-muted-foreground">Teachers using</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-border"></div>
          <div>
            <div className="text-3xl font-bold text-primary">95%</div>
            <div className="text-sm text-muted-foreground">Satisfaction rate</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How Socratica works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Upload materials</h3>
            <p className="text-muted-foreground">
              Teachers upload course content, readings, and assignment guidelines to set the context.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Students learn</h3>
            <p className="text-muted-foreground">
              AI guides students through problems without giving answers, teaching critical thinking.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Track progress</h3>
            <p className="text-muted-foreground">
              Teachers see analytics on confusion points and learning gaps to adjust instruction.
            </p>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Built for modern education</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="space-y-3">
              <MessageSquare className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Socratic tutoring</h3>
              <p className="text-muted-foreground">
                AI asks guiding questions instead of providing direct answers, building deeper understanding.
              </p>
            </div>
            
            <div className="space-y-3">
              <BookOpen className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Material-aware AI</h3>
              <p className="text-muted-foreground">
                Tutor references course materials and assignment guidelines to stay on topic.
              </p>
            </div>
            
            <div className="space-y-3">
              <BarChart3 className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Learning analytics</h3>
              <p className="text-muted-foreground">
                Real-time insights show where students struggle and what concepts need reinforcement.
              </p>
            </div>
            
            <div className="space-y-3">
              <Users className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Course management</h3>
              <p className="text-muted-foreground">
                Simple enrollment with join codes and organized assignment tracking.
              </p>
            </div>
            
            <div className="space-y-3">
              <TrendingUp className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Progress tracking</h3>
              <p className="text-muted-foreground">
                Monitor student engagement and identify who needs additional support.
              </p>
            </div>
            
            <div className="space-y-3">
              <CheckCircle className="w-10 h-10 text-primary" />
              <h3 className="text-xl font-semibold">Academic integrity</h3>
              <p className="text-muted-foreground">
                Designed to prevent cheating while providing genuine learning support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-12 text-center space-y-6 max-w-3xl mx-auto bg-primary/5 border-primary/20">
          <h2 className="text-3xl font-bold">Ready to transform your classroom?</h2>
          <p className="text-lg text-muted-foreground">
            Join hundreds of educators using Socratica to enhance student learning and gain valuable insights.
          </p>
          <Button asChild size="lg">
            <Link to={user ? dashboardPath : "/auth"}>
              {user ? "Go to dashboard" : "Start free trial"}
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Socratica</h3>
              <p className="text-sm text-muted-foreground">
                Guided AI for students, clear insights for teachers.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Connect</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>support@socratica.app</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Socratica. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
