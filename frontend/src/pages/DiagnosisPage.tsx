import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const LETTERS = ["A", "B", "C", "D"] as const;

const DiagnosisPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();

  // Quiz results passed via state from QuizPage
  const quizResults = location.state as {
    quiz_id: string;
    score: number;
    total: number;
    topic_scores: Array<{ topic: string; score: number }>;
    strengths: Array<{ topic: string; explanation: string }>;
    weaknesses: Array<{ topic: string; specific_gap: string }>;
    questions_review?: Array<{
      id: string;
      text: string;
      options: string[];
      correct: string;
      user_answer: string;
      explanation: string;
    }>;
  } | null;

  const roleName = localStorage.getItem(`pmgps_quiz_role_${quizId}`) || "Product Manager";

  const [generating, setGenerating] = useState(false);
  const [answersExpanded, setAnswersExpanded] = useState(false);

  const topicScores = quizResults?.topic_scores || [];
  const strengths = quizResults?.strengths || [];
  const weaknesses = quizResults?.weaknesses || [];
  const questionsReview = quizResults?.questions_review || [];

  const scoreColor = (score: number) => {
    if (score >= 70) return "bg-success/20 text-success";
    if (score >= 40) return "bg-warning/20 text-warning";
    return "bg-destructive/20 text-destructive";
  };

  const barColor = (score: number) => {
    if (score >= 70) return "bg-success";
    if (score >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_session_id: quizId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem("pmgps_roadmap_id", data.roadmap_id);
      navigate(`/roadmap/${data.roadmap_id}`);
    } catch {
      toast({ title: "Failed to generate roadmap. Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!quizResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No quiz results found.</p>
          <Button variant="outline" onClick={() => navigate("/results")}>
            Back to results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 animate-fade-in">
        {/* Score summary */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Your {roleName} diagnosis</h1>
          <p className="mt-2 text-muted-foreground">
            You scored {quizResults.score} out of {quizResults.total} questions correctly.
          </p>
        </div>

        {/* Strengths */}
        <section className="rounded-lg border border-success/20 bg-success/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Your strengths for {roleName}
          </h2>
          {strengths.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Complete more stages of your roadmap and retake the quiz to unlock strengths.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {strengths.map((s) => (
                <div key={s.topic} className="rounded-md border border-success/20 bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{s.topic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Topic scores */}
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Topic scores
          </h3>
          <div className="space-y-3">
            {topicScores.map((t) => (
              <div key={t.topic} className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm text-foreground">{t.topic}</span>
                <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor(t.score))}
                    style={{ width: `${t.score}%` }}
                  />
                </div>
                <span className={cn("text-xs font-semibold rounded px-2 py-0.5", scoreColor(t.score))}>
                  {t.score}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Answer review - expandable */}
        {questionsReview.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setAnswersExpanded((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
            >
              <span className="text-sm font-semibold text-foreground">
                {answersExpanded ? "Hide answers" : "Review your answers"}
              </span>
              {answersExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {answersExpanded && (
              <div className="mt-3 space-y-4 animate-fade-in">
                {questionsReview.map((q, qIndex) => {
                  const isCorrect = q.user_answer === q.correct;

                  return (
                    <div key={q.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{q.text}</p>
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, i) => {
                              const letter = LETTERS[i];
                              const isUserChoice = letter === q.user_answer;
                              const isCorrectOption = letter === q.correct;

                              return (
                                <div
                                  key={letter}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg border p-3 text-sm",
                                    isUserChoice && isCorrect
                                      ? "border-success/40 bg-success/10"
                                      : isUserChoice && !isCorrect
                                      ? "border-destructive/40 bg-destructive/10"
                                      : isCorrectOption && !isCorrect
                                      ? "border-success/40 bg-success/5"
                                      : "border-border bg-background"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                                      isUserChoice && isCorrect
                                        ? "bg-success text-success-foreground"
                                        : isUserChoice && !isCorrect
                                        ? "bg-destructive text-destructive-foreground"
                                        : isCorrectOption && !isCorrect
                                        ? "bg-success/20 text-success"
                                        : "bg-secondary text-muted-foreground"
                                    )}
                                  >
                                    {letter}
                                  </span>
                                  <span className={cn(
                                    "flex-1",
                                    isUserChoice || (isCorrectOption && !isCorrect)
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  )}>
                                    {opt}
                                  </span>
                                  {isUserChoice && isCorrect && (
                                    <Check className="h-4 w-4 text-success" />
                                  )}
                                  {isUserChoice && !isCorrect && (
                                    <X className="h-4 w-4 text-destructive" />
                                  )}
                                  {isCorrectOption && !isCorrect && !isUserChoice && (
                                    <Check className="h-4 w-4 text-success" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {!isCorrect && q.explanation && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              <span className="font-semibold text-success">Correct: {q.correct}.</span>{" "}
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Weaknesses */}
        <section className="mt-8 rounded-lg border border-warning/20 bg-warning/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">Areas to build</h2>
          <div className="mt-4 space-y-3">
            {weaknesses.map((w) => (
              <div key={w.topic} className="rounded-md border border-warning/20 bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{w.topic}</p>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    This is in your roadmap
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{w.specific_gap}</p>
              </div>
            ))}
          </div>
        </section>

        <Button
          className="mt-10 w-full sm:w-auto"
          onClick={handleGenerateRoadmap}
          disabled={generating}
        >
          {generating ? "Generating your roadmap…" : "See my personalised roadmap →"}
        </Button>
      </div>
    </div>
  );
};

export default DiagnosisPage;
