import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CaseStudies = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6 text-center">Case Studies</h1>
            <p className="text-xl text-muted-foreground mb-16 text-center max-w-3xl mx-auto">
              Real examples of how LiveQuiz has helped educators adapt their courses for the AI era.
            </p>
            
            <div className="space-y-16">
              <div className="border-b pb-12">
                <h2 className="text-2xl font-bold mb-4">Business Strategy Course Transformation</h2>
                <p className="text-sm text-primary mb-4">McGill University - Fall 2024</p>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Challenge:</strong> A core business strategy course faced declining engagement as students relied on AI for case study analysis.
                  </p>
                  <p>
                    <strong className="text-foreground">Solution:</strong> Converted written case analyses to in-class oral presentations with live Q&A. Added weekly LiveQuiz sessions to test real-time strategic thinking.
                  </p>
                  <p>
                    <strong className="text-foreground">Results:</strong> 87% increase in active participation, 40% improvement in critical thinking scores, and overwhelmingly positive student feedback.
                  </p>
                </div>
              </div>

              <div className="border-b pb-12">
                <h2 className="text-2xl font-bold mb-4">Philosophy Ethics Seminar Redesign</h2>
                <p className="text-sm text-primary mb-4">University of Montreal - Winter 2024</p>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Challenge:</strong> Students were generating AI-written essays that lacked genuine philosophical reasoning.
                  </p>
                  <p>
                    <strong className="text-foreground">Solution:</strong> Shifted to Socratic dialogue format with recorded oral defenses. Used LiveQuiz for weekly concept checks before discussions.
                  </p>
                  <p>
                    <strong className="text-foreground">Results:</strong> Deeper student engagement with philosophical texts, more authentic reasoning, and improved retention of core concepts.
                  </p>
                </div>
              </div>

              <div className="border-b pb-12">
                <h2 className="text-2xl font-bold mb-4">Political Science Research Methods</h2>
                <p className="text-sm text-primary mb-4">McGill University - Fall 2024</p>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Challenge:</strong> Research proposals were becoming too similar as students used AI for methodology sections.
                  </p>
                  <p>
                    <strong className="text-foreground">Solution:</strong> Introduced artifact-based assessments where students built physical research design models. Added peer review sessions with LiveQuiz-facilitated voting.
                  </p>
                  <p>
                    <strong className="text-foreground">Results:</strong> More diverse and creative research approaches, stronger peer learning, and better preparation for actual research work.
                  </p>
                </div>
              </div>

              <div className="pb-12">
                <h2 className="text-2xl font-bold mb-4">Law School Contract Analysis</h2>
                <p className="text-sm text-primary mb-4">Multiple Institutions - 2024</p>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Challenge:</strong> Traditional take-home contract analysis assignments were easily completable with AI assistance.
                  </p>
                  <p>
                    <strong className="text-foreground">Solution:</strong> Moved to timed in-class analysis with access to materials but no AI. Used LiveQuiz for pre-class preparation verification.
                  </p>
                  <p>
                    <strong className="text-foreground">Results:</strong> Students developed genuine analytical skills, better prepared for bar exams, and more confident in their legal reasoning abilities.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center border-t pt-12">
              <h2 className="text-2xl font-bold mb-4">Want similar results in your course?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Let's discuss how LiveQuiz can help you maintain academic rigor while embracing the opportunities AI presents.
              </p>
              <Link to="/consulting">
                <Button size="lg">Start Your Consultation</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CaseStudies;
