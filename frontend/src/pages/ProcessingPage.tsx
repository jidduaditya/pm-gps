import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Loader2, FileSearch, Brain, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { io } from "socket.io-client";
import { getSessionId } from "@/lib/api";

const steps = [
  { label: "Reading your documents", icon: FileSearch },
  { label: "Analysing your profile", icon: Brain },
  { label: "Matching PM roles", icon: MapPin },
];

const subtexts = [
  "Reviewing 11 PM archetypes against your background...",
  "Identifying your strongest transferable skills...",
  "Finding companies hiring for your profile...",
];

const ProcessingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [subtextIndex, setSubtextIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // Session guard
  useEffect(() => {
    if (!getSessionId()) {
      navigate("/upload", { replace: true });
    }
  }, [navigate]);

  // Socket.io: listen for real backend events
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const socket = io({ path: "/socket.io" });

    socket.on("connect", () => {
      socket.emit("join_session", { session_id: sessionId });
    });

    socket.on("results_ready", ({ session_id }: { session_id: string }) => {
      if (session_id === sessionId) {
        setCurrentStep(3);
        setTimeout(() => navigate("/results"), 800);
      }
    });

    socket.on("processing_failed", ({ session_id }: { session_id: string }) => {
      if (session_id === sessionId) {
        setFailed(true);
      }
    });

    return () => { socket.disconnect(); };
  }, [navigate]);

  // Time-based step animation for UX engagement (steps 0→1→2 only)
  useEffect(() => {
    if (currentStep >= 3) return;
    const timers = [
      setTimeout(() => setCurrentStep((s) => Math.max(s, 1)), 5000),
      setTimeout(() => setCurrentStep((s) => Math.max(s, 2)), 15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Rotate subtext
  useEffect(() => {
    const interval = setInterval(() => setSubtextIndex((i) => (i + 1) % subtexts.length), 4000);
    return () => clearInterval(interval);
  }, []);

  // Timeout safety (2 minutes)
  useEffect(() => {
    const t = setTimeout(() => { if (currentStep < 3) setFailed(true); }, 120000);
    return () => clearTimeout(t);
  }, [currentStep]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <span className="mb-12 text-xl font-semibold text-foreground">PM-GPS</span>

      {failed ? (
        <div className="text-center animate-fade-in">
          <p className="text-foreground font-medium">Something went wrong. Please go back and try again.</p>
          <Button className="mt-4" onClick={() => navigate("/upload")}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {steps.map((step, i) => {
              const isActive = currentStep === i;
              const isDone = currentStep > i;
              return (
                <div key={step.label} className="flex items-center gap-4 animate-fade-in">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                    isDone ? "bg-success text-success-foreground" :
                    isActive ? "bg-primary text-primary-foreground animate-pulse-slow" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {isDone ? <Check className="h-5 w-5" /> :
                     isActive ? <Loader2 className="h-5 w-5 animate-spin" /> :
                     <step.icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isDone ? "text-success" : isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-sm text-muted-foreground transition-opacity animate-fade-in" key={subtextIndex}>
            {subtexts[subtextIndex]}
          </p>
        </>
      )}
    </div>
  );
};

export default ProcessingPage;
