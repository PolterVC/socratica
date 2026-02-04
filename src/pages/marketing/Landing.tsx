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
import analyticsScreenshot from "@/assets/analytics-screenshot.png";
import chatScreenshot from "@/assets/chat-screenshot.png";
import AnalyticsDonut from "@/components/marketing/AnalyticsDonut";
import MiniBars from "@/components/marketing/MiniBars";
import GuardrailsMock from "@/components/marketing/GuardrailsMock";
const Landing = () => {
  useEffect(() => {
    document.title = "Socratica - Advanced Analytics for Google Classroom";
  }, []);

  return <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">K-12 • Currently testing in higher education</Badge>
          <h1 className="font-serif text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
            See why students struggle,<br />
            not just what they got wrong.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Socratica is the advanced analytics platform for Google Classroom that reveals the thinking behind every answer.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-base font-medium">
              <a href="mailto:eli.polterovich@mail.mcgill.ca">Request early access</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium border-2">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <h3 className="text-center text-lg font-medium text-muted-foreground pt-12 pb-8">
        Currently piloting with educators from
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
              Transform invisible learning gaps into actionable insights
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              By providing an AI tutor that assists students with your coursework, Socratica captures real-time data on their thought processes to generate detailed Understanding Scores for every concept.
            </p>
          </div>

          <div className="max-w-7xl mx-auto space-y-32">
            {/* Analytics Dashboard */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-4">
                <h3 className="font-serif text-3xl font-bold text-foreground">
                  Understanding Scores, not just grades
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Go far beyond the gradebook. See detailed comprehension metrics for every concept, identify which students truly understand the material versus those who got lucky, and pinpoint exactly where confusion begins.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden border border-border shadow-lg bg-background transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                <img src={analyticsScreenshot} alt="Analytics dashboard showing Understanding Scores and comprehension metrics" className="w-full h-auto" />
              </div>
            </div>

            {/* Chat Interface */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 rounded-lg overflow-hidden border border-border shadow-lg bg-background transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                <img src={chatScreenshot} alt="Student chat interface with AI tutor capturing thought process" className="w-full h-auto" />
              </div>
              <div className="order-1 md:order-2 space-y-4">
                <h3 className="font-serif text-3xl font-bold text-foreground">
                  Capture the thinking, not just the answer
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  The AI tutor guides students through Socratic questioning while capturing their reasoning process. Every interaction becomes a data point, revealing how students approach problems and where their understanding breaks down.
                </p>
              </div>
            </div>
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
              Get a data-driven view of your class's comprehension
            </h2>
            <p className="text-xl text-background/80 leading-relaxed">
              Join K-12 educators getting early access to Socratica. Currently piloting in higher education.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
              <a href="mailto:eli.polterovich@mail.mcgill.ca">Request early access</a>
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
                Advanced analytics for Google Classroom.
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