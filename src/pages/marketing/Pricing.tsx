import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/marketing/Navbar";
import { Check } from "lucide-react";
import { useEffect } from "react";

const Pricing = () => {
  useEffect(() => {
    document.title = "Pricing - Socratica";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individual teachers getting started",
      features: [
        "Up to 2 courses",
        "Up to 30 students total",
        "Basic analytics",
        "Socratic tutoring",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For teachers managing multiple courses",
      features: [
        "Unlimited courses",
        "Up to 150 students",
        "Advanced analytics",
        "Priority support",
        "Custom materials",
        "Export data",
      ],
      popular: true,
    },
    {
      name: "Institution",
      price: "Custom",
      description: "For schools and universities",
      features: [
        "Unlimited courses",
        "Unlimited students",
        "Advanced analytics",
        "Dedicated support",
        "API access",
        "Single sign-on",
        "Custom integrations",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that works best for your teaching needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 space-y-6 relative ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.name === "Institution" ? "Contact Sales" : "Get Started"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16 space-y-4">
          <p className="text-muted-foreground">
            All plans include our core Socratic tutoring and student analytics
          </p>
          <p className="text-sm text-muted-foreground">
            Non-profit pricing available for qualifying institutions
          </p>
        </div>
      </section>

      <footer className="border-t bg-muted/30 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Socratica. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
