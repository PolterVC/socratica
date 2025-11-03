import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ProfessionalPrograms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Professional Programs</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Maintain professional competency standards in nursing, education, engineering, and other applied fields.
            </p>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Outcomes</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Simulated Scenarios</h3>
                    <p className="text-muted-foreground mb-2">
                      Role-play exercises requiring real-time professional judgment and communication skills.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Mirrors practice • ✓ Tests decision-making • ✓ Safe learning environment
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Portfolio Defenses</h3>
                    <p className="text-muted-foreground mb-2">
                      Students present their work artifacts and explain their process, choices, and learning.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Authentic assessment • ✓ Reflective practice • ✓ Professional standards
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Peer Teaching Sessions</h3>
                    <p className="text-muted-foreground mb-2">
                      Students teach concepts to classmates, demonstrating mastery through explanation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Deep understanding required • ✓ Communication skills • ✓ Cannot be AI-generated
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <Link to="/consulting">
                  <Button size="lg">Get Your Custom Plan</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfessionalPrograms;
