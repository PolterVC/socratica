import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LawPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Law & Policy Programs</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Preserve rigorous legal reasoning and policy analysis skills essential for practice.
            </p>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Outcomes</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Moot Court Exercises</h3>
                    <p className="text-muted-foreground mb-2">
                      Students argue cases in simulated court settings, responding to questions on the spot.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Tests legal reasoning • ✓ Oral advocacy skills • ✓ Professional preparation
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Live Case Analysis</h3>
                    <p className="text-muted-foreground mb-2">
                      Receive case materials at the start of class and provide written analysis within the session.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Timed environment • ✓ Tests case law knowledge • ✓ Exam preparation
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Policy Memo Defenses</h3>
                    <p className="text-muted-foreground mb-2">
                      Present policy recommendations and defend against counterarguments from instructor and peers.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Requires deep understanding • ✓ Argumentation skills • ✓ Real-world application
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

export default LawPolicy;
