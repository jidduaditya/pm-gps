import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type QuizQuestion = { id: string; topic: string; question_number: number; question_text: string; options: string[] };

const LETTERS = ["A", "B", "C", "D"] as const;
const STORAGE_KEY_PREFIX = "pmgps_quiz_answers_";

const QuizPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const storageKey = `${STORAGE_KEY_PREFIX}${quizId}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Load questions from localStorage (stored by RoadmapStartPage)
  const questions: QuizQuestion[] = (() => {
    try {
      const saved = localStorage.getItem(`pmgps_quiz_questions_${quizId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = answers[question.id] || "";
  const canProceed = currentAnswer.length > 0;

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  const setAnswer = useCallback(
    (letter: string) => {
      setAnswers((prev) => {
        if (prev[question.id] === letter) {
          const next = { ...prev };
          delete next[question.id];
          return next;
        }
        return { ...prev, [question.id]: letter };
      });
    },
    [question.id]
  );

  const handleNext = async () => {
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    setProcessingStep(1);

    try {
      const timer = setTimeout(() => setProcessingStep(2), 3000);
      const res = await apiFetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 2000));
      localStorage.removeItem(storageKey);
      navigate(`/roadmap/diagnosis/${quizId}`, { state: data });
    } catch {
      setSubmitting(false);
      setProcessingStep(0);
      toast({
        title: "Something went wrong submitting your answers. Your answers are saved — please try again.",
        variant: "destructive",
      });
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading questions…</p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="mx-auto flex flex-col items-center gap-6">
            {["Reviewing your answers...", "Building your diagnosis..."].map((label, i) => {
              const stepNum = i + 1;
              const active = processingStep === stepNum;
              const done = processingStep > stepNum;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      done
                        ? "border-success bg-success text-success-foreground"
                        : active
                        ? "border-primary bg-primary/10 text-primary animate-pulse-slow"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  <span className={cn("text-sm", done ? "text-success" : active ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-10 animate-fade-in">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />

        {/* Dot indicators */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentIndex;
            return (
              <div
                key={q.id}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all",
                  isCurrent
                    ? "border-2 border-primary bg-background"
                    : isAnswered
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>

        {/* Question */}
        <div className="mt-10">
          <p className="text-lg font-semibold text-foreground leading-relaxed">{question.question_text}</p>
        </div>

        {/* MCQ Options */}
        <div className="mt-8 space-y-3">
          {question.options.map((opt, i) => {
            const letter = LETTERS[i];
            const isSelected = currentAnswer === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setAnswer(letter)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 min-h-[56px] text-left transition-all duration-150 ease-in-out",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold transition-all duration-150",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className={cn("text-sm", isSelected ? "text-primary-foreground" : "text-foreground")}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleNext} disabled={!canProceed}>
            {isLast ? "Submit answers →" : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
