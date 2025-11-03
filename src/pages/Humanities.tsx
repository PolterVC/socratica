import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Humanities = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6">Humanities Programs</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Protect critical analysis and original thinking in literature, philosophy, and history courses.
            </p>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Example Outcomes</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Close Reading Seminars</h3>
                    <p className="text-muted-foreground mb-2">
                      In-class text analysis sessions where students annotate passages and discuss interpretations live.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Immediate verification • ✓ Deep engagement • ✓ Collaborative learning
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Timed Essay Responses</h3>
                    <p className="text-muted-foreground mb-2">
                      Short, focused writing exercises completed in class on provided texts or prompts.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Controlled environment • ✓ Tests comprehension • ✓ Develops writing fluency
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <h3 className="text-xl font-semibold mb-2">Oral Thesis Defense</h3>
                    <p className="text-muted-foreground mb-2">
                      Students present their argument and answer challenging questions about their interpretation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ Tests understanding • ✓ Builds confidence • ✓ AI cannot replicate
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

export default Humanities;
