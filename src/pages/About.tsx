import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold mb-6 text-center">About LiveQuiz</h1>
            <p className="text-xl text-muted-foreground mb-16 text-center max-w-3xl mx-auto">
              We are a team of 5 McGill students dedicated to helping teachers catch up to AI. We built LiveQuiz to help Professors at McGill and the University of Montreal bring critical thinking back into education.
            </p>
            
            <div className="mb-20">
              <h2 className="text-3xl font-bold mb-12 text-center">Our Team</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                <div>
                  <h3 className="text-xl font-bold">Megan Curadeau</h3>
                  <p className="text-sm text-primary mb-2">CEO</p>
                  <p className="text-muted-foreground">A fierce marketer with a passion for educational innovation and strategic growth.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Helena Ristanovic Clifford</h3>
                  <p className="text-sm text-primary mb-2">CTO</p>
                  <p className="text-muted-foreground">Tech mogul bringing founder experience and technical excellence to the platform.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Christine Wu</h3>
                  <p className="text-sm text-primary mb-2">COO</p>
                  <p className="text-muted-foreground">Ex-founder and venture expert ensuring operational excellence.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Ashley Li</h3>
                  <p className="text-sm text-primary mb-2">CMO</p>
                  <p className="text-muted-foreground">Political thought leader turned entrepreneur, driving our mission forward.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Eli Polterovich</h3>
                  <p className="text-sm text-primary mb-2">CRO</p>
                  <p className="text-muted-foreground">Previously built ventures in Edtech, bringing deep industry knowledge.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">Various Advisors & Experts</h3>
                  <p className="text-muted-foreground">In collaboration with the education faculty at McGill University.</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                In the age of AI, we believe education must evolve while maintaining its core purpose: developing critical thinking, genuine understanding, and authentic skills.
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                LiveQuiz provides educators with practical tools and strategies to maintain academic rigor while embracing the opportunities AI presents for enhanced learning experiences.
              </p>
              
              <div className="text-center">
                <Link to="/consulting">
                  <Button size="lg">Work With Us</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
