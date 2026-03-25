import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChipSelect from "@/components/ChipSelect";
import SegmentedControl from "@/components/SegmentedControl";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getSessionId } from "@/lib/api";

const PM_ARCHETYPES = [
  "Technical PM", "Growth PM", "AI PM", "ML PM", "DevOps PM", "Data PM",
  "Platform PM", "Product Marketing Manager", "Digital PM", "Enterprise/B2B PM", "Consumer/B2C PM",
];

const QuestionnairePage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error("No session found. Please upload your documents first.");
      navigate("/upload", { replace: true });
      return;
    }

    const prefill = async () => {
      try {
        const res = await apiFetch(`/api/profile/prefill/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "not_ready") return;
        if (data.current_role) setRole(data.current_role);
        if (data.total_years_experience != null) {
          const yrs = data.total_years_experience;
          if (yrs <= 2) setExperience("0–2");
          else if (yrs <= 5) setExperience("3–5");
          else if (yrs <= 10) setExperience("6–10");
          else setExperience("10+");
        }
        if (data.company_types) setCompanyTypes(data.company_types);
        if (data.industries) setIndustries(data.industries);
      } catch {
        // Prefill is best-effort — continue without it
      }
    };
    prefill();
  }, [navigate]);

  // Page 1
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // Page 2
  const [writesCode, setWritesCode] = useState("");
  const [techComfort, setTechComfort] = useState(0);
  const [aiExposure, setAiExposure] = useState("");
  const [roadmapExp, setRoadmapExp] = useState("");

  // Page 3
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [companyStage, setCompanyStage] = useState<string[]>([]);
  const [geography, setGeography] = useState("");
  const [openToDomain, setOpenToDomain] = useState("");

  const canProceed = page === 0 ? role.trim() !== "" && experience !== "" : true;

  const handleNext = async () => {
    if (page < 2) {
      setPage(page + 1);
      return;
    }

    const sessionId = getSessionId();
    if (!sessionId) { navigate("/upload", { replace: true }); return; }

    setSubmitting(true);
    try {
      const responses = {
        current_role: role,
        experience,
        company_types: companyTypes,
        industries,
        writes_code: writesCode,
        tech_comfort: techComfort,
        ai_exposure: aiExposure,
        roadmap_experience: roadmapExp,
        target_archetypes: archetypes,
        preferred_company_stage: companyStage,
        geography,
        open_to_domain_change: openToDomain,
      };

      const qRes = await apiFetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, responses }),
      });
      if (!qRes.ok) throw new Error("Failed to submit questionnaire");

      const pRes = await apiFetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!pRes.ok) throw new Error("Failed to start processing");

      navigate("/processing");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-12 animate-fade-in">
        {/* Progress */}
        <div className="mb-10 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i <= page ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < 2 && <div className={cn("h-0.5 w-12 transition-colors", i < page ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
          <span className="ml-3 text-sm text-muted-foreground">Page {page + 1} of 3</span>
        </div>

        {page === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Your background</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current role *</label>
              <Input placeholder="e.g. Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total years of experience *</label>
              <SegmentedControl options={["0–2", "3–5", "6–10", "10+"]} value={experience} onChange={setExperience} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Types of companies worked at</label>
              <ChipSelect options={["Startup", "Mid-size", "Large", "Enterprise"]} selected={companyTypes} onChange={setCompanyTypes} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industries worked in</label>
              <ChipSelect options={["Fintech", "Healthtech", "SaaS", "E-commerce", "Edtech", "Logistics", "Other"]} selected={industries} onChange={setIndustries} />
            </div>
          </div>
        )}

        {page === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Your skills and exposure</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Do you write code in your current role?</label>
              <SegmentedControl options={["Yes", "Sometimes", "No"]} value={writesCode} onChange={setWritesCode} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">How comfortable are you reading technical specs?</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Not at all</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTechComfort(n)}
                      className={cn(
                        "h-10 w-10 rounded-md border text-sm font-medium transition-colors",
                        techComfort === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">Very comfortable</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Have you worked with AI/ML tools or features professionally?</label>
              <SegmentedControl options={["None", "Basic familiarity", "Used in work", "Built AI features"]} value={aiExposure} onChange={setAiExposure} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Have you managed or contributed to a product roadmap?</label>
              <SegmentedControl options={["Yes", "No", "Partially"]} value={roadmapExp} onChange={setRoadmapExp} />
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Your preferences</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Which PM archetypes interest you most?</label>
              <ChipSelect options={PM_ARCHETYPES} selected={archetypes} onChange={setArchetypes} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What company stage do you prefer?</label>
              <ChipSelect options={["Seed", "Series A", "Series B", "Growth", "Public"]} selected={companyStage} onChange={setCompanyStage} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What geography are you targeting?</label>
              <Select value={geography} onValueChange={setGeography}>
                <SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>
                <SelectContent>
                  {["Pan-India", "Bengaluru", "Mumbai", "Delhi NCR", "Pune", "Hyderabad", "Remote", "Other"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Are you open to roles outside your current domain?</label>
              <SegmentedControl options={["Yes", "Open to it", "Prefer to stay in domain"]} value={openToDomain} onChange={setOpenToDomain} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex justify-between">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 0}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : page === 2 ? "See my results →" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionnairePage;
