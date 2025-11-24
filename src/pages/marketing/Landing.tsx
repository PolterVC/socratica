import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/marketing/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Shield, X, Check } from "lucide-react";
import mcgillLogo from "@/assets/mcgill-logo.png";
import udemLogo from "@/assets/udem-logo.png";
import concordiaLogo from "@/assets/concordia-logo.png";
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

      {/* Problem/Solution Split */}
      <section className="container mx-auto px-6 py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              The academic integrity problem
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Students can now ask AI to solve their homework in seconds. Traditional education is failing to adapt.
              </p>
              <p>
                Socratica refuses to give direct answers. Instead, it asks guiding questions that build genuine understanding and critical thinking skills.
              </p>
              <p className="font-medium text-foreground">
                The result: Students learn. Teachers regain confidence in assessment.
              </p>
            </div>
          </div>
          
          <Card className="p-8 bg-secondary/50 border-border/50">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">S</span>
                </div>
                <div className="flex-1 bg-primary/10 rounded-lg px-4 py-3">
                  <p className="text-sm text-foreground">
                    "What's the answer to problem 3?"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">AI</span>
                </div>
                <div className="flex-1 bg-card rounded-lg px-4 py-3 border">
                  <p className="text-sm text-foreground leading-relaxed">
                    "I can't give you the answer directly. Let's think through this together. What information does the problem give you?"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">S</span>
                </div>
                <div className="flex-1 bg-primary/10 rounded-lg px-4 py-3">
                  <p className="text-sm text-foreground">
                    "It gives me the mass and velocity..."
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Bento Grid Features */}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Large Feature Card */}
            <Card className="md:col-span-2 p-8 bg-card border-border/50 hover:border-border transition-colors">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Socratic tutoring</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    AI guides students through problems with targeted questions, never giving direct answers. Builds genuine understanding.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 space-y-3 border border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-foreground">"What principles apply here?"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-foreground">"What did we learn about this concept?"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <p className="text-sm text-foreground">"Can you break this into smaller steps?"</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Material-Aware */}
            <Card className="p-8 bg-card border-border/50 hover:border-border transition-colors">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Material-aware AI</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    References course materials and assignment guidelines to stay on topic and relevant.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <div className="w-4 h-5 border-2 border-muted-foreground/30 rounded-sm"></div>
                    </div>
                    <div className="text-xs font-medium text-foreground">Chapter_5.pdf</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-border rounded w-full"></div>
                    <div className="h-1.5 bg-border rounded w-5/6"></div>
                    <div className="h-1.5 bg-primary/30 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Teacher Analytics */}
            <Card className="p-8 bg-card border-border/50 hover:border-border transition-colors">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Teacher analytics</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    See exactly where students struggle. Adjust instruction before the next class.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 border border-border/30 relative group mt-2 py-[60px]">
                  <div className="flex items-center justify-center h-24 mb-4">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="20" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="20" strokeDasharray="125 251" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary) / 0.6)" strokeWidth="20" strokeDasharray="75 251" strokeDashoffset="-125" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="20" strokeDasharray="51 251" strokeDashoffset="-200" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Topic confusion breakdown</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-background/95 rounded-lg p-4 flex flex-col justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <p className="text-xs text-foreground">Equilibrium - 45%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary/60"></div>
                      <p className="text-xs text-foreground">Supply curves - 30%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted"></div>
                      <p className="text-xs text-foreground">Other topics - 25%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Explainable Insights */}
            <Card className="p-8 bg-card border-border/50 hover:border-border transition-colors">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Explainable insights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every chart has a Why button that shows the examples and sources behind an alert, so instructors can trust what they are seeing.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 border border-border/30 relative group">
                  <div className="flex items-end gap-2 h-24 mb-4">
                    <div className="flex-1 bg-muted rounded-t" style={{
                    height: '50%'
                  }}></div>
                    <div className="flex-1 bg-primary/70 rounded-t" style={{
                    height: '75%'
                  }}></div>
                    <div className="flex-1 bg-primary rounded-t" style={{
                    height: '90%'
                  }}></div>
                  </div>
                  <Badge className="absolute top-4 right-4 text-xs">Why</Badge>
                  <p className="text-xs text-muted-foreground text-center">Question confusion trends</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-background/95 rounded-lg p-4 flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground italic">"I'm confused about the equilibrium..."</p>
                    <p className="text-xs text-muted-foreground italic">"Why does the curve shift left?"</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">Slides Week 3</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Academic Integrity - Guardrails */}
            <Card className="p-8 bg-card border-border/50 hover:border-border transition-colors">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Academic integrity</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Built-in guardrails that block direct answers while allowing guided learning.
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 border border-border/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 bg-destructive/5 rounded px-3 py-2 border border-destructive/20">
                      <p className="text-xs text-muted-foreground">"Can you just give me the answer"</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">No direct answers</Badge>
                      <Badge variant="secondary" className="text-xs">Citations required</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 bg-green-500/5 rounded px-3 py-2 border border-green-500/20">
                      <p className="text-xs text-muted-foreground">"Let's outline steps, then you try step 1"</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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