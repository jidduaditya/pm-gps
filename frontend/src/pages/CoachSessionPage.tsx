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
import { Mic, Send } from "lucide-react";
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

const MODE_LABELS: Record<string, string> = {
  case_study: "Case Study",
  product_decision: "Product Decision",
  feature_brief: "Feature Brief",
};

const CoachSessionPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [turnsRemaining, setTurnsRemaining] = useState(10);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [summary, setSummary] = useState<{ strength: string; gap: string; practice: string } | null>(null);
  const [title, setTitle] = useState("New session");
  const [mode, setMode] = useState("");
  const [role, setRole] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await apiFetch(`/api/coach/session/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setTitle(data.title || "New session");
        setMode(MODE_LABELS[data.mode] || data.mode);
        setRole(data.role);
        setTurnsRemaining(data.turns_remaining);
        setSessionEnded(data.status === "completed");
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch {
        // Session will show empty state
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, [sessionId]);

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
      const data = await res.json();

      const coachMsg: Message = {
        id: `c_${Date.now()}`,
        role: "coach",
        feedback: data.feedback,
      };
      setMessages((prev) => [...prev, coachMsg]);
      setTurnsRemaining(data.turns_remaining);
      if (data.turn_number === 1 && data.feedback) {
        // Title is auto-generated server-side on first turn
        setTitle(input.slice(0, 80) + (input.length > 80 ? "…" : ""));
      }
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
      const res = await apiFetch(`/api/coach/session/${sessionId}/end`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary({
        strength: data.strength,
        gap: data.gap,
        practice: data.practice,
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

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

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
          <Badge variant="secondary" className="text-[10px] shrink-0">{mode}</Badge>
          <Badge variant="secondary" className="text-[10px] shrink-0">{role}</Badge>
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
                disabled
                title="Voice input coming soon"
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
