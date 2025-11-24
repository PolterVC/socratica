import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        const dashboardPath = roleData?.role === "teacher" ? "/app/teacher" : "/app/student";
        navigate(dashboardPath);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        const dashboardPath = roleData?.role === "teacher" ? "/app/teacher" : "/app/student";
        navigate(dashboardPath);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        // Insert role for new user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role });

        if (roleError) {
          console.error('Error setting role:', roleError);
          toast.error('Account created but role assignment failed. Please contact support.');
        } else {
          toast.success('Account created successfully!');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent group">
          <Link to="/" className="flex items-center gap-2.5 text-foreground/50 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-lg border border-border/20 shadow-2xl bg-white">
        <CardHeader className="text-center space-y-3 pb-8 pt-10">
          <CardTitle className="text-4xl font-serif font-bold tracking-tight text-foreground">Socratica</CardTitle>
          <CardDescription className="text-base text-foreground/60">
            Socratic tutoring with AI guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 h-11">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-[15px]"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-[15px]"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-8">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-foreground/80">
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white border-border/20 text-[15px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signin-password" className="text-sm font-medium text-foreground/80">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-white border-border/20 text-[15px]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-[15px] font-semibold mt-8" 
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 bg-white border-border/20 text-[15px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white border-border/20 text-[15px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-white border-border/20 text-[15px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/80">I am a</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value: "student" | "teacher") => setRole(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/20 hover:bg-muted/20 transition-colors cursor-pointer">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="font-normal cursor-pointer flex-1 text-[15px]">
                        Student
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/20 hover:bg-muted/20 transition-colors cursor-pointer">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="font-normal cursor-pointer flex-1 text-[15px]">
                        Teacher
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-[15px] font-semibold mt-8" 
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;