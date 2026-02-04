import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="font-serif text-3xl font-extrabold text-foreground tracking-tight">Socratica</span>
        </Link>
        
        <div className="flex items-center">
          <Button asChild size="sm">
            <a href="mailto:eli.polterovich@mail.mcgill.ca">Request early access</a>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
