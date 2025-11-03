import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Course<span className="text-primary">AI</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Solutions
            </Link>
            <Link 
              to="/consulting" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/consulting") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Consulting
            </Link>
            <Link 
              to="/engagement" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/engagement") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Engagement Tools
            </Link>
          </div>
          
          <Link to="/consulting">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
