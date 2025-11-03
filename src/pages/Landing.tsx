import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
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
            
            <div className="mt-12 rounded-xl overflow-hidden shadow-2xl border max-w-4xl mx-auto">
              <div className="bg-card p-8">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center p-4">
                    <span className="text-sm font-medium text-primary text-center">Upload Syllabus</span>
                  </div>
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center p-4">
                    <span className="text-sm font-medium text-primary text-center">AI Analysis & Recommendations</span>
                  </div>
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center p-4">
                    <span className="text-sm font-medium text-primary text-center">Receive Action Plan</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  AI-powered curriculum restructuring dashboard
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* What We Do */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">What we do</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Curriculum Restructuring</CardTitle>
                  <CardDescription>
                    Keep learning outcomes, change assessment formats so AI use is controlled.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Convert AI vulnerable work into oral, in class, or artifact based tasks</li>
                    <li>• Map each week to an AI safe check for understanding</li>
                    <li>• Produce a short syllabus addendum for students</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Classroom Engagement</CardTitle>
                  <CardDescription>
                    Make every class session interactive using your own material.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Turn PDFs or slides into short quizzes in minutes</li>
                    <li>• Run live polls to check preparation</li>
                    <li>• Capture participation data for grading</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Faculty Enablement</CardTitle>
                  <CardDescription>
                    Give instructors practical guidance for the AI era.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• AI use policy templates by discipline</li>
                    <li>• Examples of assignment wording that reduces AI overuse</li>
                    <li>• Implementation notes for Canvas, Moodle, or Google Classroom</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Who It's For */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Who it's for</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {["Business", "Humanities", "Social Science", "Professional Programs", "Law & Policy"].map((tag) => (
                <div key={tag} className="px-6 py-3 bg-primary/10 text-primary rounded-full font-medium">
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Example Outcomes */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Example outcomes</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <p>Replace generic essays with oral or in-class defenses</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p>Add AI policy to syllabus with clear guidelines</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p>Add auto MC and short response checks to every class</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p>Rotate quiz banks and implement authentic assessments</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* About Us */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8">About us</h2>
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              We are a team of 5 McGill students dedicated to helping teachers catch up to AI. We built LiveQuiz to help Professors at McGill and the University of Montreal bring critical thinking back into education.
            </p>
            
            <h3 className="text-2xl font-bold text-center mb-8">Our team</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Megan Curadeau</CardTitle>
                  <CardDescription>CEO</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">A fierce marketer</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Helena Ristanovic Clifford</CardTitle>
                  <CardDescription>CTO</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Tech mogul bringing founder experience</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Christine Wu</CardTitle>
                  <CardDescription>COO</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Ex-founder and venture expert</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ashley Li</CardTitle>
                  <CardDescription>CMO</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Political thought leader turned entrepreneur</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Eli Polterovich</CardTitle>
                  <CardDescription>CRO</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Previously built ventures in Edtech</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Various Advisors & Experts</CardTitle>
                  <CardDescription>Collaboration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">In collaboration with the education faculty at McGill</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to adapt your course?</h2>
            <p className="text-lg mb-8 opacity-90">
              Start with our AI consulting tool or explore engagement features
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consulting">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Your Plan
                </Button>
              </Link>
              <Link to="/engagement">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Try Engagement Tools
                </Button>
              </Link>
            </div>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
