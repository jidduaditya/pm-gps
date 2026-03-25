import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, BarChart3, Building2 } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Know your fit",
    description: "We map your background to 11 PM archetypes and tell you how closely you match each.",
  },
  {
    icon: BarChart3,
    title: "See your skill gaps",
    description: "For every matched role, you get a clear list of skills you have and skills you need.",
  },
  {
    icon: Building2,
    title: "Find companies hiring",
    description: "We surface companies that hire for your exact PM profile — and flag which ones you can apply to now.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-navy">
        <div className="container flex h-14 items-center">
          <span className="text-lg font-semibold tracking-tight text-navy-foreground">PM-GPS</span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl animate-fade-in">
          Find your PM role. Not a generic one — <span className="text-primary">yours.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in">
          Upload your CV, answer 10 questions, and get a personalised map of which PM roles fit your background — and what it takes to get there.
        </p>
        <Button
          size="lg"
          className="mt-10 animate-fade-in"
          onClick={() => navigate("/login")}
        >
          Get started — it's free
        </Button>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary py-20">
        <div className="container grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card p-6">
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-base font-semibold text-card-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-semibold text-foreground">PM-GPS</span>
          <span className="text-xs text-muted-foreground">Made for Indian tech professionals</span>
          <button className="text-xs text-muted-foreground underline hover:text-foreground">Privacy policy</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
