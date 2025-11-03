import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const Landing = () => {
  return <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Help your course survive the AI era.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Upload your syllabus, tell us how you teach, get a concrete plan to keep rigor and engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consulting">
                <Button size="lg" className="text-lg px-8">
                  Start AI Consulting
                </Button>
              </Link>
              <Link to="/engagement">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Try the Quiz Tool
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-8 text-center">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary mb-2">1</div>
                  <p className="text-sm font-medium">Upload Syllabus</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary mb-2">2</div>
                  <p className="text-sm font-medium">AI Analysis & Recommendations</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary mb-2">3</div>
                  <p className="text-sm font-medium">Receive Action Plan</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* What We Do */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16">What we do</h2>
            <div className="grid md:grid-cols-3 gap-16">
              <div>
                <h3 className="text-xl font-bold mb-3">Curriculum Restructuring</h3>
                <p className="text-muted-foreground mb-4">
                  Keep learning outcomes, change assessment formats so AI use is controlled.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Convert AI vulnerable work into oral, in class, or artifact based tasks</li>
                  <li>• Map each week to an AI safe check for understanding</li>
                  <li>• Produce a short syllabus addendum for students</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-3">Classroom Engagement</h3>
                <p className="text-muted-foreground mb-4">
                  Make every class session interactive using your own material.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Turn PDFs or slides into short quizzes in minutes</li>
                  <li>• Run live polls to check preparation</li>
                  <li>• Capture participation data for grading</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-3">Faculty Enablement</h3>
                <p className="text-muted-foreground mb-4">
                  Give instructors practical guidance for the AI era.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• AI use policy templates by discipline</li>
                  <li>• Examples of assignment wording that reduces AI overuse</li>
                  <li>• Implementation notes for Canvas, Moodle, or Google Classroom</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Who It's For */}
        <section className="py-20 px-4 border-t">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Who it's for</h2>
            <div className="flex flex-wrap gap-6 justify-center text-lg">
              <Link to="/business" className="text-muted-foreground hover:text-primary transition-colors">
                Business
              </Link>
              <Link to="/humanities" className="text-muted-foreground hover:text-primary transition-colors">
                Humanities
              </Link>
              <Link to="/social-science" className="text-muted-foreground hover:text-primary transition-colors">
                Social Science
              </Link>
              <Link to="/professional-programs" className="text-muted-foreground hover:text-primary transition-colors">
                Professional Programs
              </Link>
              <Link to="/law-policy" className="text-muted-foreground hover:text-primary transition-colors">
                Law & Policy
              </Link>
            </div>
          </div>
        </section>
        
        {/* About Us Preview */}
        <section className="py-20 px-4 border-t">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6">About us</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              We are a team of 5 McGill students dedicated to helping teachers catch up to AI. We built LiveQuiz to help Professors at McGill and the University of Montreal bring critical thinking back into education.
            </p>
            <Link to="/about">
              <Button variant="outline" size="lg">Learn More About Our Team</Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-semibold text-lg">
              LiveQuiz
            </div>
            <div className="flex gap-6">
              <Link to="/consulting" className="text-sm text-muted-foreground hover:text-primary">
                Consulting
              </Link>
              <Link to="/engagement" className="text-sm text-muted-foreground hover:text-primary">
                Engagement
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;