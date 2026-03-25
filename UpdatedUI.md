# PM-GPS — Selected Pages Source Code

Generated: 2026-03-25 20:16 UTC

---

## `src/pages/ResultsPage.tsx`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCcw, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// Mock data
const mockResults = {
  excellent: [
    { id: "1", role: "Data Product Manager", score: 87, rationale: "Strong data background + 6 years in analytics products" },
    { id: "2", role: "Technical PM", score: 82, rationale: "Solid engineering experience with proven cross-functional collaboration" },
  ],
  needWork: [
    { id: "3", role: "AI PM", score: 64, rationale: "Good technical base but limited hands-on ML experience" },
  ],
  longShot: [
    { id: "4", role: "Growth PM", score: 38, rationale: "Limited marketing and experimentation experience" },
  ],
};

const mockSkills: Record<string, { have: string[]; mustHave: string[]; goodToHave: string[] }> = {
  "1": { have: ["SQL", "Data Analysis", "Stakeholder Management", "A/B Testing", "Roadmap Planning"], mustHave: ["Data Governance", "ML Model Evaluation"], goodToHave: ["dbt", "Looker"] },
  "2": { have: ["System Design", "API Design", "Agile", "Technical Specs"], mustHave: ["Cloud Architecture"], goodToHave: ["CI/CD", "Monitoring"] },
  "3": { have: ["Python", "Data Pipelines"], mustHave: ["ML Ops", "Model Training", "AI Ethics"], goodToHave: ["LLM Fine-tuning", "Prompt Engineering"] },
  "4": { have: ["Analytics"], mustHave: ["Growth Loops", "Funnel Optimization", "SEO/SEM", "Retention Strategies"], goodToHave: ["Paid Acquisition", "Viral Mechanics"] },
};

const mockCompanies: Record<string, Array<{ name: string; industry: string; size: string; ready: boolean; url: string }>> = {
  "1": [
    { name: "Razorpay", industry: "Fintech", size: "Large", ready: true, url: "#" },
    { name: "Swiggy", industry: "E-commerce", size: "Large", ready: true, url: "#" },
    { name: "Fractal Analytics", industry: "SaaS", size: "Mid-size", ready: false, url: "#" },
  ],
  "2": [
    { name: "Postman", industry: "SaaS", size: "Large", ready: true, url: "#" },
    { name: "Hasura", industry: "SaaS", size: "Mid-size", ready: true, url: "#" },
  ],
  "3": [
    { name: "Haptik", industry: "AI", size: "Mid-size", ready: false, url: "#" },
  ],
  "4": [],
};

type RoleCard = { id: string; role: string; score: number; rationale: string };

const ScoreCard = ({ card, selected, onClick }: { card: RoleCard; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full rounded-lg border p-4 text-left transition-all",
      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
    )}
  >
    <p className="text-sm font-semibold text-card-foreground">{card.role}</p>
    <p className="mt-1 text-2xl font-bold text-primary">{card.score}%</p>
    <p className="mt-1 text-xs text-muted-foreground">{card.rationale}</p>
    <Button
      variant="outline"
      size="sm"
      className="mt-3 w-full border-primary/40 text-primary hover:bg-primary/5"
      onClick={(e) => { e.stopPropagation(); }}
      asChild
    >
      <Link to={`/roadmap/start?role_id=${card.id}`}>
        Build My Roadmap <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </Button>
  </button>
);

const ResultsPage = () => {
  const navigate = useNavigate();
  const allCards = [...mockResults.excellent, ...mockResults.needWork, ...mockResults.longShot];
  const [selectedId, setSelectedId] = useState(allCards[0]?.id || "");
  const selected = allCards.find((c) => c.id === selectedId)!;
  const skills = mockSkills[selectedId];
  const companies = mockCompanies[selectedId] || [];
  const hasAllMustHave = skills?.mustHave.length === 0;

  const renderColumn = (title: string, emoji: string, cards: RoleCard[]) => {
    if (cards.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{emoji} {title}</h3>
        {cards.map((c) => (
          <ScoreCard key={c.id} card={c} selected={selectedId === c.id} onClick={() => setSelectedId(c.id)} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Your results</h1>
          <Link to="/coach" className="text-sm text-primary hover:underline">Go to Thinking Coach</Link>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download results
            </Button>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("session_id"); navigate("/upload"); }}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Start over
            </Button>
          </div>
        </div>

        {/* Panel 1 — Role Matches */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Here's where you fit</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {renderColumn("Excellent Match", "🟢", mockResults.excellent)}
            {renderColumn("Need Some Work", "🟡", mockResults.needWork)}
            {renderColumn("Long Shot", "🔴", mockResults.longShot)}
          </div>
        </section>

        {/* Panel 2 — Skills */}
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-foreground">Your skills for {selected.role}</h2>

          {hasAllMustHave && (
            <div className="mt-3 rounded-md border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">
              You already have all the must-have skills for this role.
            </div>
          )}

          <div className="mt-4 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">You already have</h3>
              <div className="flex flex-wrap gap-2">
                {skills?.have.map((s) => (
                  <Badge key={s} variant="outline" className="border-success/40 bg-success/10 text-success">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Skills to build</h3>
              {skills?.mustHave.length > 0 && (
                <div className="mb-3">
                  <span className="mb-1.5 block text-xs text-muted-foreground">Must-have</span>
                  <div className="flex flex-wrap gap-2">
                    {skills.mustHave.map((s) => (
                      <Badge key={s} variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                        {s} <span className="ml-1 text-[10px] opacity-70">required</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {skills?.goodToHave.length > 0 && (
                <div>
                  <span className="mb-1.5 block text-xs text-muted-foreground">Good-to-have</span>
                  <div className="flex flex-wrap gap-2">
                    {skills.goodToHave.map((s) => (
                      <Badge key={s} variant="outline" className="border-border text-muted-foreground">
                        {s} <span className="ml-1 text-[10px] opacity-70">optional</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Panel 3 — Companies */}
        <section className="mt-14 pb-16">
          <h2 className="text-lg font-semibold text-foreground">Companies hiring for {selected.role}</h2>

          {companies.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">We're still building this list for your region. Check back soon.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {companies.map((c) => (
                <div key={c.name} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold text-card-foreground">{c.name}</p>
                    <div className="mt-1.5 flex gap-2">
                      <Badge variant="secondary" className="text-xs">{c.industry}</Badge>
                      <Badge variant="secondary" className="text-xs">{c.size}</Badge>
                    </div>
                    <Badge className={cn("mt-2", c.ready ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")} variant="outline">
                      {c.ready ? "Apply now" : "Apply after upskilling"}
                    </Badge>
                  </div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View careers <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ResultsPage;
```

---

## `src/pages/RoadmapStartPage.tsx`

```tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ListChecks, Brain } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const PM_ROLES: Record<string, string> = {
  "1": "Data Product Manager",
  "2": "Technical PM",
  "3": "AI PM",
  "4": "Growth PM",
  "5": "ML PM",
  "6": "DevOps PM",
  "7": "Platform PM",
  "8": "Product Marketing Manager",
  "9": "Digital PM",
  "10": "Enterprise/B2B PM",
  "11": "Consumer/B2C PM",
};

const RoadmapStartPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleId = searchParams.get("role_id") || "";
  const roleName = PM_ROLES[roleId] || "Product Manager";
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
```

---

## `src/pages/QuizPage.tsx`

```tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockQuestions = [
  { id: "q1", text: "What is the primary goal of a product roadmap?", options: ["List all features to build", "Communicate strategic direction and priorities", "Track engineering velocity", "Assign tasks to team members"] },
  { id: "q2", text: "Your CEO wants to launch a feature next week that you believe needs more user research. What is your best first step?", options: ["Agree and start building immediately", "Refuse and escalate to the board", "Present data on user research gaps and propose a compromise timeline", "Delegate the decision to your engineering lead"] },
  { id: "q3", text: "Which metric best measures product-market fit for a B2B SaaS product?", options: ["Monthly Active Users", "Net Revenue Retention", "Page views", "Number of features shipped"] },
  { id: "q4", text: "When prioritising features with limited engineering resources, which approach is most effective?", options: ["Build whatever the loudest stakeholder requests", "Use an impact vs effort framework to rank opportunities", "Ship the easiest features first to show progress", "Wait until more resources are available"] },
  { id: "q5", text: "What is a common anti-pattern when writing user stories?", options: ["Including acceptance criteria", "Writing from the user's perspective", "Describing implementation details instead of outcomes", "Keeping stories small and testable"] },
  { id: "q6", text: "A recently launched feature has a 2% adoption rate after one month. What should you do first?", options: ["Remove the feature immediately", "Analyse user behaviour data to understand why adoption is low", "Double the marketing budget for the feature", "Rebuild the feature from scratch with new technology"] },
  { id: "q7", text: "When conducting A/B tests, what determines the minimum sample size?", options: ["Number of engineers available", "Minimum detectable effect and statistical significance level", "How long the CEO is willing to wait", "The number of features being tested"] },
  { id: "q8", text: "How should you define success for a new onboarding flow?", options: ["By counting total signups", "By measuring activation rate and time-to-value", "By the number of onboarding screens", "By surveying the design team"] },
  { id: "q9", text: "What is the main benefit of using a jobs-to-be-done framework?", options: ["It replaces the need for user interviews", "It focuses on the underlying need rather than the solution", "It simplifies engineering estimates", "It eliminates the need for competitive analysis"] },
  { id: "q10", text: "Your data team tells you the key metric you've been optimising is a vanity metric. What do you do?", options: ["Ignore them and continue optimising", "Work with the data team to identify a metric tied to real business outcomes", "Switch to tracking revenue only", "Stop measuring metrics altogether"] },
];

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

  const questions = mockQuestions;
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
      navigate(`/roadmap/diagnosis/${quizId}`, { state: { roadmapId: data.roadmap_id } });
    } catch {
      setSubmitting(false);
      setProcessingStep(0);
      toast({
        title: "Something went wrong submitting your answers. Your answers are saved — please try again.",
        variant: "destructive",
      });
    }
  };

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
          <p className="text-lg font-semibold text-foreground leading-relaxed">{question.text}</p>
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
```

---

## `src/pages/DiagnosisPage.tsx`

```tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock quiz questions with correct answers for review
const mockQuizQuestions = [
  { id: "q1", text: "What is the primary goal of a product roadmap?", options: ["List all features to build", "Communicate strategic direction and priorities", "Track engineering velocity", "Assign tasks to team members"], correct: "B", explanation: "A product roadmap communicates strategic direction and priorities, aligning the team around what matters most." },
  { id: "q2", text: "Your CEO wants to launch a feature next week that you believe needs more user research. What is your best first step?", options: ["Agree and start building immediately", "Refuse and escalate to the board", "Present data on user research gaps and propose a compromise timeline", "Delegate the decision to your engineering lead"], correct: "C", explanation: "Presenting data-backed concerns with a compromise shows leadership while respecting the urgency." },
  { id: "q3", text: "Which metric best measures product-market fit for a B2B SaaS product?", options: ["Monthly Active Users", "Net Revenue Retention", "Page views", "Number of features shipped"], correct: "B", explanation: "Net Revenue Retention captures whether existing customers find enough value to stay and expand — the clearest signal of product-market fit in B2B SaaS." },
  { id: "q4", text: "When prioritising features with limited engineering resources, which approach is most effective?", options: ["Build whatever the loudest stakeholder requests", "Use an impact vs effort framework to rank opportunities", "Ship the easiest features first to show progress", "Wait until more resources are available"], correct: "B", explanation: "An impact vs effort framework helps you make trade-offs transparently and maximise value delivered per unit of effort." },
  { id: "q5", text: "What is a common anti-pattern when writing user stories?", options: ["Including acceptance criteria", "Writing from the user's perspective", "Describing implementation details instead of outcomes", "Keeping stories small and testable"], correct: "C", explanation: "User stories should describe outcomes and user value, not prescribe technical implementation." },
  { id: "q6", text: "A recently launched feature has a 2% adoption rate after one month. What should you do first?", options: ["Remove the feature immediately", "Analyse user behaviour data to understand why adoption is low", "Double the marketing budget for the feature", "Rebuild the feature from scratch with new technology"], correct: "B", explanation: "Before taking action, you need to understand the root cause — is it discoverability, usability, or lack of need?" },
  { id: "q7", text: "When conducting A/B tests, what determines the minimum sample size?", options: ["Number of engineers available", "Minimum detectable effect and statistical significance level", "How long the CEO is willing to wait", "The number of features being tested"], correct: "B", explanation: "Sample size is determined by the minimum detectable effect size and the desired statistical significance level." },
  { id: "q8", text: "How should you define success for a new onboarding flow?", options: ["By counting total signups", "By measuring activation rate and time-to-value", "By the number of onboarding screens", "By surveying the design team"], correct: "B", explanation: "Activation rate and time-to-value directly measure whether users are reaching their 'aha moment' efficiently." },
  { id: "q9", text: "What is the main benefit of using a jobs-to-be-done framework?", options: ["It replaces the need for user interviews", "It focuses on the underlying need rather than the solution", "It simplifies engineering estimates", "It eliminates the need for competitive analysis"], correct: "B", explanation: "JTBD shifts focus from features to the underlying problem users are trying to solve." },
  { id: "q10", text: "Your data team tells you the key metric you've been optimising is a vanity metric. What do you do?", options: ["Ignore them and continue optimising", "Work with the data team to identify a metric tied to real business outcomes", "Switch to tracking revenue only", "Stop measuring metrics altogether"], correct: "B", explanation: "Collaborating with the data team to find a meaningful metric shows intellectual honesty and data maturity." },
];

const LETTERS = ["A", "B", "C", "D"] as const;

// Mock data
const mockDiagnosis = {
  role_name: "Data Product Manager",
  roadmap_id: "rm_001",
  topic_scores: [
    { topic: "Metrics & KPIs", score: 82 },
    { topic: "Data Pipelines", score: 71 },
    { topic: "Stakeholder Management", score: 65 },
    { topic: "Experimentation", score: 48 },
    { topic: "Data Governance", score: 35 },
  ],
  strengths: [
    { topic: "Metrics & KPIs", explanation: "You demonstrated strong intuition for choosing the right success metrics and connecting them to business outcomes." },
    { topic: "Data Pipelines", explanation: "You clearly understand how data flows through systems and can reason about trade-offs in pipeline design." },
  ],
  weaknesses: [
    { topic: "Experimentation", specific_gap: "Your approach to A/B testing lacked consideration for sample size and statistical significance." },
    { topic: "Data Governance", specific_gap: "You didn't address data privacy, access controls, or compliance considerations in your answers." },
  ],
};

const DiagnosisPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const [data] = useState(mockDiagnosis);
  const [answersExpanded, setAnswersExpanded] = useState(false);

  // Load saved answers from localStorage
  const [userAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`pmgps_quiz_answers_${quizId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (data.roadmap_id) {
      localStorage.setItem("pmgps_roadmap_id", data.roadmap_id);
    }
  }, [data.roadmap_id]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 animate-fade-in">
        {/* Strengths */}
        <section className="rounded-lg border border-success/20 bg-success/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Your strengths for {data.role_name}
          </h2>
          {data.strengths.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Complete more stages of your roadmap and retake the quiz to unlock strengths.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.strengths.map((s) => (
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
            {data.topic_scores.map((t) => (
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

        {/* Your answers - expandable */}
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
              {mockQuizQuestions.map((q, qIndex) => {
                const userAnswer = userAnswers[q.id] || "";
                const isCorrect = userAnswer === q.correct;
                const correctIndex = LETTERS.indexOf(q.correct as typeof LETTERS[number]);

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
                            const isUserChoice = letter === userAnswer;
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
                        {!isCorrect && (
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

        {/* Weaknesses */}
        <section className="mt-8 rounded-lg border border-warning/20 bg-warning/5 p-6">
          <h2 className="text-lg font-semibold text-foreground">Areas to build</h2>
          <div className="mt-4 space-y-3">
            {data.weaknesses.map((w) => (
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

        <Button className="mt-10 w-full sm:w-auto" onClick={() => navigate(`/roadmap/${data.roadmap_id}`)}>
          See my personalised roadmap →
        </Button>
      </div>
    </div>
  );
};

export default DiagnosisPage;
```

---

## `src/pages/RoadmapPage.tsx`

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Check, ExternalLink, Pencil, HelpCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const TYPE_COLORS: Record<string, string> = {
  Article: "bg-primary/10 text-primary border-primary/30",
  Book: "bg-warning/10 text-warning border-warning/30",
  Framework: "bg-success/10 text-success border-success/30",
  Course: "bg-destructive/10 text-destructive border-destructive/30",
  Video: "bg-muted text-muted-foreground border-border",
};

const mockRoadmap = {
  role_name: "Data Product Manager",
  role_id: "1",
  stages: [
    {
      stage_number: 1,
      name: "Build your metrics foundation",
      duration: "2–3 weeks",
      status: "not_started" as StageStatus,
      goal: "Learn to define, measure, and communicate the right product metrics for data products.",
      resources: [
        { title: "Lean Analytics", type: "Book", url: "#" },
        { title: "How to Choose the Right Metrics", type: "Article", url: "#" },
        { title: "HEART Framework", type: "Framework", url: "#" },
        { title: "Metrics That Matter (Reforge)", type: "Course", url: "#" },
      ],
      practice: "Pick a data product you use daily. Define 3 success metrics and explain why each matters.",
      checkpoint: "Can you explain the difference between a vanity metric and an actionable metric using a real example?",
    },
    {
      stage_number: 2,
      name: "Master experimentation",
      duration: "2–3 weeks",
      status: "not_started" as StageStatus,
      goal: "Understand how to design, run, and interpret A/B tests for data-heavy products.",
      resources: [
        { title: "Trustworthy Online Controlled Experiments", type: "Book", url: "#" },
        { title: "Intro to A/B Testing (Udacity)", type: "Course", url: "#" },
        { title: "Statistical Significance Explained", type: "Article", url: "#" },
      ],
      practice: "Design an A/B test for a feature in a product you use. Define hypothesis, variants, sample size, and success criteria.",
      checkpoint: "How would you decide whether to ship a feature that shows a 2% lift but with p-value of 0.08?",
    },
    {
      stage_number: 3,
      name: "Learn data governance basics",
      duration: "1–2 weeks",
      status: "not_started" as StageStatus,
      goal: "Understand data privacy, access controls, and compliance as a product manager.",
      resources: [
        { title: "GDPR for Product Managers", type: "Article", url: "#" },
        { title: "Data Governance Fundamentals", type: "Video", url: "#" },
        { title: "India's DPDP Act Overview", type: "Article", url: "#" },
      ],
      practice: "Audit a feature you own. List all data it collects and whether each piece is necessary.",
      checkpoint: "If a user requests data deletion, what systems and processes need to be involved?",
    },
  ],
};

type StageStatus = "not_started" | "in_progress" | "complete";

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const [stages, setStages] = useState(mockRoadmap.stages);
  const [openStages, setOpenStages] = useState<Set<number>>(new Set([1]));
  const [marking, setMarking] = useState<number | null>(null);

  const completedCount = stages.filter((s) => s.status === "complete").length;
  const hasCompletedAny = completedCount > 0;

  const toggleStage = (num: number) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const markComplete = async (stageNumber: number) => {
    setMarking(stageNumber);
    try {
      const res = await apiFetch(`/api/roadmap/${roadmapId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_number: stageNumber }),
      });
      if (!res.ok) throw new Error();

      setStages((prev) =>
        prev.map((s) =>
          s.stage_number === stageNumber ? { ...s, status: "complete" as StageStatus } : s
        )
      );

      // Collapse completed, expand next
      setOpenStages((prev) => {
        const next = new Set(prev);
        next.delete(stageNumber);
        const nextStage = stages.find((s) => s.stage_number === stageNumber + 1);
        if (nextStage) next.add(nextStage.stage_number);
        return next;
      });
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setMarking(null);
    }
  };

  const statusLabel = (status: StageStatus) => {
    if (status === "complete") return "Complete";
    if (status === "in_progress") return "In progress";
    return "Not started";
  };

  const statusClasses = (status: StageStatus) => {
    if (status === "complete") return "border-success/30 bg-success/10 text-success";
    if (status === "in_progress") return "border-primary/30 bg-primary/10 text-primary";
    return "border-border text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Your {mockRoadmap.role_name} Roadmap</h1>
        <p className="mt-1 text-muted-foreground">Sequenced by your biggest gaps first.</p>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {completedCount} of {stages.length} stages complete
          </span>
          <Progress value={(completedCount / stages.length) * 100} className="h-2 flex-1" />
        </div>

        {/* Retake banner */}
        {hasCompletedAny && (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-foreground">
              Ready to retest your knowledge? Retake the quiz to update your roadmap.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/roadmap/start?role_id=${mockRoadmap.role_id}`)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retake quiz
            </Button>
          </div>
        )}

        {/* Stages */}
        <div className="mt-8 space-y-4">
          {stages.map((stage, idx) => {
            const isOpen = openStages.has(stage.stage_number);
            const isComplete = stage.status === "complete";
            const isLastStage = idx === stages.length - 1;

            return (
              <Collapsible
                key={stage.stage_number}
                open={isOpen}
                onOpenChange={() => toggleStage(stage.stage_number)}
              >
                <div
                  className={cn(
                    "rounded-lg border transition-all",
                    isComplete ? "border-success/20 bg-success/5 opacity-80" : "border-border bg-card"
                  )}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                          isComplete
                            ? "border-success bg-success text-success-foreground"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {isComplete ? <Check className="h-3.5 w-3.5" /> : stage.stage_number}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          Stage {stage.stage_number} — {stage.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{stage.duration}</span>
                          <Badge variant="outline" className={cn("text-[10px]", statusClasses(stage.status))}>
                            {statusLabel(stage.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">
                      {/* Goal */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goal</h4>
                        <p className="mt-1 text-sm text-foreground">{stage.goal}</p>
                      </div>

                      {/* Resources */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resources</h4>
                        <ul className="mt-2 space-y-2">
                          {stage.resources.map((r) => (
                            <li key={r.title} className="flex items-center justify-between rounded-md border border-border p-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[10px]", TYPE_COLORS[r.type] || "")}>
                                  {r.type}
                                </Badge>
                                <span className="text-sm text-foreground">{r.title}</span>
                              </div>
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                Open <ExternalLink className="h-3 w-3" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Practice */}
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Pencil className="h-4 w-4 text-primary" /> Try this
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{stage.practice}</p>
                      </div>

                      {/* Checkpoint */}
                      <div className="rounded-md border border-warning/20 bg-warning/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <HelpCircle className="h-4 w-4 text-warning" /> Ask yourself
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{stage.checkpoint}</p>
                      </div>

                      {/* Mark complete */}
                      {!isComplete && (
                        <Button
                          variant="outline"
                          className="w-full border-success/40 text-success hover:bg-success/10"
                          onClick={() => markComplete(stage.stage_number)}
                          disabled={marking === stage.stage_number}
                        >
                          {marking === stage.stage_number ? "Saving…" : "Mark Stage Complete ✓"}
                        </Button>
                      )}

                      {/* Coach CTA on last stage */}
                      {isLastStage && (
                        <Button variant="outline" className="w-full" onClick={() => navigate("/coach")}>
                          Test your thinking with the Coach →
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
```

---

## `src/pages/CoachHomePage.tsx`

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, GitBranch, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const PM_ROLES = [
  "Technical PM", "Growth PM", "AI PM", "ML PM", "DevOps PM",
  "Data PM", "Platform PM", "Product Marketing Manager",
  "Digital PM", "Enterprise/B2B PM", "Consumer/B2C PM",
];

const MODES = [
  { id: "case_study", label: "Case Study", description: "Working through a product case study and want feedback on your approach.", icon: BookOpen },
  { id: "product_decision", label: "Product Decision", description: "Have a real or hypothetical product decision to think through.", icon: GitBranch },
  { id: "feature_brief", label: "Feature Brief / PRD", description: "Written a feature brief and want feedback on the thinking behind it.", icon: FileText },
];

type PastSession = {
  id: string;
  title: string;
  mode: string;
  role: string;
  date: string;
  main_gap: string;
};

const mockHistory: PastSession[] = [
  { id: "cs_001", title: "Pricing strategy for freemium conversion", mode: "Product Decision", role: "Growth PM", date: "2024-03-18", main_gap: "Didn't consider willingness-to-pay segmentation" },
  { id: "cs_002", title: "Onboarding redesign case study", mode: "Case Study", role: "Data PM", date: "2024-03-15", main_gap: "Missing success metrics for the new flow" },
];

const CoachHomePage = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(PM_ROLES[0]);
  const [inputMethod, setInputMethod] = useState<"type" | "voice">("type");
  const [loading, setLoading] = useState(false);
  const [history] = useState<PastSession[]>(mockHistory);

  const handleStart = async () => {
    if (!selectedMode) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/coach/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pm_role_id: selectedRole, mode: selectedMode, input_method: inputMethod }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem("pmgps_active_coach_session", data.session_id);
      navigate(`/coach/session/${data.session_id}`);
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 animate-fade-in">
        {/* Start new session */}
        <h1 className="text-2xl font-bold text-foreground">Think out loud. Get specific feedback.</h1>
        <p className="mt-2 text-muted-foreground">
          Walk me through your thinking on a product problem. I'll tell you exactly what was strong and what broke down.
        </p>

        {/* Mode cards */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const active = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-all",
                  active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-semibold text-card-foreground">{mode.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{mode.description}</p>
              </button>
            );
          })}
        </div>

        {/* Role selector */}
        <div className="mt-6">
          <label className="text-sm font-medium text-foreground">Coaching me as a…</label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="mt-1.5 w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input method toggle */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setInputMethod("type")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              inputMethod === "type" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Type
          </button>
          <button
            onClick={() => setInputMethod("voice")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              inputMethod === "voice" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Voice
          </button>
        </div>

        <Button className="mt-6" onClick={handleStart} disabled={!selectedMode || loading}>
          {loading ? "Starting…" : "Start session →"}
        </Button>

        {/* Past sessions */}
        {history.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-semibold text-foreground">Previous sessions</h2>
            <div className="mt-4 space-y-3">
              {history.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/coach/session/${s.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-card-foreground truncate">{s.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{s.mode}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{s.role}</Badge>
                      <span className="text-[10px] text-muted-foreground">{s.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{s.main_gap}</p>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CoachHomePage;
```

---

## `src/pages/CoachSessionPage.tsx`

```tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type CoachFeedback = {
  did_well: Array<{ point: string; reference: string }>;
  broke_down: Array<{ point: string; why_it_matters: string; reference: string }>;
  next_time: string[];
};

type Message = {
  id: string;
  role: "user" | "coach";
  content?: string;
  feedback?: CoachFeedback;
};

// Mock session metadata
const mockMeta = {
  title: "Pricing strategy for freemium conversion",
  mode: "Product Decision",
  role: "Growth PM",
  total_turns: 5,
  ended: false,
};

const CoachSessionPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [turnsRemaining, setTurnsRemaining] = useState(mockMeta.total_turns);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(mockMeta.ended);
  const [summary, setSummary] = useState<{ strength: string; gap: string; practice: string } | null>(null);
  const [title, setTitle] = useState(mockMeta.title);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const inputMethod = "type"; // simplified; could be from session meta

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const canSend = input.length >= 50;

  const handleSend = async () => {
    if (!canSend) return;
    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await apiFetch(`/api/coach/session/${sessionId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      if (!res.ok) throw new Error();

      // Mock coach response
      const coachMsg: Message = {
        id: `c_${Date.now()}`,
        role: "coach",
        feedback: {
          did_well: [
            { point: "You identified the core trade-off between monetisation and growth.", reference: input.slice(0, 60) + "…" },
          ],
          broke_down: [
            { point: "Didn't segment users by willingness to pay.", why_it_matters: "Different user segments respond differently to pricing changes.", reference: input.slice(0, 40) + "…" },
          ],
          next_time: ["Consider running a Van Westendorp pricing sensitivity analysis before deciding on price points."],
        },
      };
      setMessages((prev) => [...prev, coachMsg]);
      setTurnsRemaining((t) => Math.max(0, t - 1));
    } catch {
      toast({ title: "Could not get a response. Please try again.", variant: "destructive" });
      // Add retry inline
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, role: "coach", content: "__error__" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    setEnding(true);
    try {
      await apiFetch(`/api/coach/session/${sessionId}/end`, { method: "POST" });
      setSummary({
        strength: "You consistently connect product decisions back to user outcomes.",
        gap: "You tend to skip quantitative validation — adding data to your reasoning would strengthen it.",
        practice: "Before your next session, try writing a one-page brief for a pricing decision with both qualitative and quantitative inputs.",
      });
      setSessionEnded(true);
      localStorage.removeItem("pmgps_active_coach_session");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setEnding(false);
      setShowEndDialog(false);
    }
  };

  // Session summary view
  if (sessionEnded && summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container max-w-lg py-10 animate-fade-in text-center">
          <h1 className="text-2xl font-bold text-foreground">Session complete</h1>
          <div className="mt-8 space-y-4 text-left">
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <p className="text-xs font-semibold text-success uppercase tracking-wide">Your main strength</p>
              <p className="mt-1 text-sm text-foreground">{summary.strength}</p>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
              <p className="text-xs font-semibold text-warning uppercase tracking-wide">Your main gap</p>
              <p className="mt-1 text-sm text-foreground">{summary.gap}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Practice before your next session</p>
              <p className="mt-1 text-sm text-foreground">{summary.practice}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => {
              const rmId = localStorage.getItem("pmgps_roadmap_id");
              navigate(rmId ? `/roadmap/${rmId}` : "/results");
            }}>
              Back to my roadmap →
            </Button>
            <Button onClick={() => navigate("/coach")}>Start a new session →</Button>
          </div>
        </div>
      </div>
    );
  }

  // Read-only past session banner
  const isReadOnly = sessionEnded && !summary;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-foreground outline-none truncate max-w-[200px] sm:max-w-none"
            readOnly={isReadOnly}
          />
          <Badge variant="secondary" className="text-[10px] shrink-0">{mockMeta.mode}</Badge>
          <Badge variant="secondary" className="text-[10px] shrink-0">{mockMeta.role}</Badge>
        </div>
        {!sessionEnded && (
          <Button variant="outline" size="sm" onClick={() => setShowEndDialog(true)}>
            End Session
          </Button>
        )}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="border-b border-border bg-muted px-4 py-2 text-sm text-muted-foreground flex items-center justify-between">
          <span>This session has ended.</span>
          <Button variant="link" size="sm" onClick={() => navigate("/coach")} className="text-primary">
            Start a new session →
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-4 py-6">
          {messages.length === 0 && !isReadOnly && (
            <p className="text-center text-sm text-muted-foreground py-16">
              Share your thinking to get started. Describe your approach, reasoning, and trade-offs.
            </p>
          )}
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-navy px-4 py-3 text-sm text-navy-foreground">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Error retry
            if (msg.content === "__error__") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    Could not get a response.{" "}
                    <button onClick={handleSend} className="underline font-medium">Retry</button>
                  </div>
                </div>
              );
            }

            // Coach feedback
            const fb = msg.feedback;
            if (!fb) return null;

            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-border bg-card p-4 space-y-4">
                  {/* Did well */}
                  {fb.did_well.length > 0 && (
                    <div className="border-l-2 border-success pl-3">
                      <p className="text-xs font-semibold text-success mb-1">What you did well</p>
                      {fb.did_well.map((d, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-sm text-foreground">• {d.point}</p>
                          <p className="text-xs text-muted-foreground italic mt-0.5">"{d.reference}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Broke down */}
                  {fb.broke_down.length > 0 && (
                    <div className="border-l-2 border-warning pl-3">
                      <p className="text-xs font-semibold text-warning mb-1">Where your thinking broke down</p>
                      {fb.broke_down.map((b, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-sm text-foreground">• {b.point}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.why_it_matters}</p>
                          <p className="text-xs text-muted-foreground italic mt-0.5">"{b.reference}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next time */}
                  {fb.next_time.length > 0 && (
                    <div className="border-l-2 border-primary pl-3">
                      <p className="text-xs font-semibold text-primary mb-1">What to do next time</p>
                      {fb.next_time.map((n, i) => (
                        <p key={i} className="text-sm text-foreground">• {n}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Sending indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="h-4 w-4 rounded-full bg-primary animate-pulse-slow" />
              </div>
            </div>
          )}

          {/* Turns remaining */}
          {messages.length > 0 && !sessionEnded && (
            <p className="text-center text-xs text-muted-foreground">
              {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} remaining in this session
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      {!sessionEnded && (
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="mx-auto max-w-2xl flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Walk me through your thinking. Tell me what you'd do, why, and how you'd measure success. Don't worry about frameworks — just reason out loud."
              className="min-h-[80px] flex-1 resize-none"
              disabled={sending}
            />
            <div className="flex flex-col gap-2">
              <Button size="icon" onClick={handleSend} disabled={!canSend || sending}>
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className={cn(isRecording && "bg-destructive/10 border-destructive text-destructive")}
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onMouseLeave={() => setIsRecording(false)}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className={cn("mt-1 text-xs text-center", input.length < 50 ? "text-muted-foreground" : "text-success")}>
            {input.length} / 50 minimum characters
          </p>
        </div>
      )}

      {/* End session confirmation dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this session?</DialogTitle>
            <DialogDescription>
              You won't be able to continue this conversation. You'll receive a summary of your session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>Cancel</Button>
            <Button onClick={handleEndSession} disabled={ending}>
              {ending ? "Ending…" : "End session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachSessionPage;
```

