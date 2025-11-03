import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Business = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Business Programs</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Adapt business courses to maintain rigor in the AI era with practical, verifiable assessments.
            </p>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Outcomes</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Case Analysis Presentations</h3>
                    <p className="text-muted-foreground mb-2">
                      Replace written case studies with in-class presentations where students defend their analysis verbally.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ AI-resistant • ✓ Tests critical thinking • ✓ Builds communication skills
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Live Financial Modeling</h3>
                    <p className="text-muted-foreground mb-2">
                      Conduct spreadsheet exercises during class time with real-time problem sets.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Hands-on verification • ✓ Immediate feedback • ✓ Practical skills
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Ethical Dilemma Debates</h3>
                    <p className="text-muted-foreground mb-2">
                      Weekly debates on business ethics requiring real-time argumentation and evidence citation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Requires preparation • ✓ Tests reasoning • ✓ Impossible to outsource to AI
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

export default Business;
