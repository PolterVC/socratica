import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/marketing/Navbar";
import { Check } from "lucide-react";
import { useEffect } from "react";

const Pricing = () => {
  useEffect(() => {
    document.title = "Pricing - Socratica";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your classroom
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Up to 30 students</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>2 courses</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Basic analytics</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Socratic AI tutoring</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Material uploads (PDF)</span>
              </li>
            </ul>
            
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
          </Card>

          <Card className="p-8 space-y-6 border-primary relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most popular
              </span>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Unlimited students</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Unlimited courses</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Priority AI responses</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>All file types</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Export data & reports</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
            
            <Button asChild className="w-full" size="lg">
              <Link to="/auth">Start free trial</Link>
            </Button>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Need a custom plan for your institution?</p>
          <Button asChild variant="outline">
            <a href="mailto:eli.polterovich@mail.mcgill.ca">Contact sales</a>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-muted/30 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Socratica. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
