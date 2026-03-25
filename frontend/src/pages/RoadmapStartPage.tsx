import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ListChecks, Brain } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const RoadmapStartPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleId = searchParams.get("role_id") || "";
  const roleName = searchParams.get("role_name") || "Product Manager";
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pm_role_id: roleId }),
      });
      if (!res.ok) throw new Error("Failed to start quiz");
      const data = await res.json();
      // Store questions + role for QuizPage and DiagnosisPage
      localStorage.setItem(`pmgps_quiz_questions_${data.quiz_id}`, JSON.stringify(data.questions));
      localStorage.setItem(`pmgps_quiz_role_${data.quiz_id}`, data.role_name || roleName);
      navigate(`/roadmap/quiz/${data.quiz_id}`);
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-16 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Let's see what you already know</h1>

        <Badge className="mt-4 text-sm px-3 py-1" variant="secondary">
          {roleName}
        </Badge>

        <p className="mt-6 text-muted-foreground leading-relaxed">
          Before building your roadmap, we'll ask you 10 questions about{" "}
          <span className="font-medium text-foreground">{roleName}</span>. This helps us build a
          plan around your actual knowledge — not just your CV.
        </p>

        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            What to expect
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              10 questions — takes about 8 minutes
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Mix of multiple choice and short scenarios
            </li>
            <li className="flex items-start gap-3 text-sm text-foreground">
              <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              No right or wrong frameworks — we evaluate your thinking
            </li>
          </ul>
        </div>

        <Button className="mt-10 w-full sm:w-auto" onClick={handleStart} disabled={loading}>
          {loading ? "Starting…" : "Start the quiz →"}
        </Button>
      </div>
    </div>
  );
};

export default RoadmapStartPage;
