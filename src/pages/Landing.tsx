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
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">01</span>
                  </div>
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">02</span>
                  </div>
                  <div className="h-32 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">03</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
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
                    AI-safe assessments, oral exams, and project rotations to maintain academic integrity
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Classroom Engagement</CardTitle>
                  <CardDescription>
                    Auto-generate quizzes from your readings and keep students actively participating
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Faculty Enablement</CardTitle>
                  <CardDescription>
                    AI policy templates and implementation guides tailored to your discipline
                  </CardDescription>
                </CardHeader>
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
