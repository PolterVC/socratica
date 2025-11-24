import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/marketing/Navbar";
import { Check } from "lucide-react";
import { useEffect } from "react";

const Mission = () => {
  useEffect(() => {
    document.title = "Non-Profit Mission - Socratica";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">Built as a non-profit</h1>
          <p className="text-xl text-muted-foreground">
            Our mission is to make quality education accessible to everyone
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Socratica is built as a non-profit organization dedicated to improving educational outcomes 
              for students and teachers worldwide. We believe that every student deserves access to 
              personalized tutoring that helps them think critically, and every teacher deserves 
              clear insights into their students' learning needs.
            </p>
          </Card>

          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Why Non-Profit?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Education should be driven by learning outcomes, not profit margins. By operating as a 
              non-profit, we can focus entirely on creating the best possible tools for students and 
              educators, reinvesting all resources back into improving the platform and expanding access 
              to underserved communities.
            </p>
          </Card>

          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Our Commitment</h2>
            <ul className="space-y-4 text-lg text-muted-foreground">
              <li className="flex gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Always free for individual teachers and small classrooms</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Transparent pricing with no hidden costs</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Special support for under-resourced schools</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <span>Open research and continuous improvement</span>
              </li>
            </ul>
          </Card>

          <div className="text-center pt-8">
            <Button onClick={scrollToTop} size="lg">
              Get Started
            </Button>
          </div>
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

export default Mission;
