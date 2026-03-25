import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCcw, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, getSessionId } from "@/lib/api";
import { Link } from "react-router-dom";

type RoleScore = {
  archetype_id: string;
  archetype_name: string;
  score: number;
  skills_delta: {
    matched_skills: string[];
    missing_must_have: string[];
    missing_good_to_have: string[];
    transferable_skills: string[];
  };
  company_suggestions: Array<{ company_name: string; label: string }>;
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
      <Link to={`/roadmap/start?role_id=${card.id}&role_name=${encodeURIComponent(card.role)}`}>
        Build My Roadmap <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </Button>
  </button>
);

const ResultsPage = () => {
  const navigate = useNavigate();
  const [roleScores, setRoleScores] = useState<RoleScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const sessionId = getSessionId();
        if (!sessionId) { setError(true); return; }
        const res = await apiFetch(`/api/results/${sessionId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.status === "processing") { setLoading(true); return; }
        if (data.status === "failed" || !data.result) { setError(true); return; }
        const scores: RoleScore[] = data.result.selected_roles || data.result.role_scores || [];
        setRoleScores(scores);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Categorise scores
  const excellent = roleScores.filter((r) => r.score >= 75);
  const needWork = roleScores.filter((r) => r.score >= 50 && r.score < 75);
  const longShot = roleScores.filter((r) => r.score < 50);

  const toCard = (r: RoleScore): RoleCard => ({
    id: r.archetype_id,
    role: r.archetype_name,
    score: r.score,
    rationale: "",
  });

  const allCards: RoleCard[] = [...excellent, ...needWork, ...longShot].map(toCard);
  const [selectedId, setSelectedId] = useState("");

  // Set initial selection once data loads
  useEffect(() => {
    if (allCards.length > 0 && !selectedId) setSelectedId(allCards[0].id);
  }, [roleScores]);

  const selected = allCards.find((c) => c.id === selectedId);
  const selectedRole = roleScores.find((r) => r.archetype_id === selectedId);
  const skills = selectedRole ? {
    have: selectedRole.skills_delta?.matched_skills || [],
    mustHave: selectedRole.skills_delta?.missing_must_have || [],
    goodToHave: selectedRole.skills_delta?.missing_good_to_have || [],
  } : null;
  const companies = (selectedRole?.company_suggestions || []).map((c) => ({
    name: c.company_name,
    ready: c.label === "apply_now",
  }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Analysing your profile…</p>
      </div>
    );
  }

  if (error || allCards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Could not load your results.</p>
          <Button variant="outline" onClick={() => navigate("/upload")}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Your results</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/coach')}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Practice with AI Coach
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download results
            </Button>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("pmgps_session_id"); navigate("/upload"); }}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Start over
            </Button>
          </div>
        </div>

        {/* Panel 1 — Role Matches */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Here's where you fit</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {renderColumn("Excellent Match", "🟢", excellent.map(toCard))}
            {renderColumn("Need Some Work", "🟡", needWork.map(toCard))}
            {renderColumn("Long Shot", "🔴", longShot.map(toCard))}
          </div>
        </section>

        {/* Panel 2 — Skills */}
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-foreground">Your skills for {selected?.role}</h2>

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
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-foreground">Companies hiring for {selected?.role}</h2>

          {companies.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">We're still building this list for your region. Check back soon.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {companies.map((c) => (
                <div key={c.name} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold text-card-foreground">{c.name}</p>
                    <Badge className={cn("mt-2", c.ready ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")} variant="outline">
                      {c.ready ? "Apply now" : "Apply after upskilling"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="pb-16" />
      </div>
    </div>
  );
};

export default ResultsPage;
