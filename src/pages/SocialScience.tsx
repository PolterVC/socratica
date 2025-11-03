import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SocialScience = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Social Science Programs</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Ensure research methodology and data interpretation skills are genuinely learned and assessed.
            </p>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Outcomes</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Live Data Analysis</h3>
                    <p className="text-muted-foreground mb-2">
                      In-class exercises with datasets provided on the spot, requiring immediate statistical interpretation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Real-time verification • ✓ Tests methodology knowledge • ✓ Practical application
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Research Design Presentations</h3>
                    <p className="text-muted-foreground mb-2">
                      Students present and defend their methodology choices, responding to peer critiques.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Interactive assessment • ✓ Critical thinking • ✓ Peer learning
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Field Observation Reports</h3>
                    <p className="text-muted-foreground mb-2">
                      Short, structured observations of real-world social phenomena with in-class discussion.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Original data • ✓ Applied theory • ✓ Authentic learning
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

export default SocialScience;
