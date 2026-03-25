import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, setSessionId, authHeaders } from "@/lib/api";

interface DocSectionProps {
  label: string;
  files: File[];
  setFiles: (files: File[]) => void;
  pastedText: string;
  setPastedText: (text: string) => void;
  processing: boolean;
}

const DocSection = ({ label, files, setFiles, pastedText, setPastedText, processing }: DocSectionProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter((f) => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is too large (max 10 MB)`); return false; }
      if (!/\.(pdf|docx|txt)$/i.test(f.name)) { toast.error(`${f.name} is not a supported format`); return false; }
      return true;
    });
    if (files.length + valid.length > 5) { toast.error("Max 5 files allowed"); return; }
    setFiles([...files, ...valid]);
  }, [files, setFiles]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Drop your CV here or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT — Max 10 MB</p>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ position: "relative", marginTop: 8 }}
          />
        </div>
        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground">
                <FileText className="h-3 w-3" />
                {f.name}
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
              </span>
            ))}
          </div>
        )}
        {processing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your document...
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Or paste it as text</label>
        <Textarea
          placeholder="Paste your CV content here"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value.slice(0, 10000))}
          rows={6}
        />
        <p className="text-right text-xs text-muted-foreground">{pastedText.length} / 10,000</p>
      </div>
    </div>
  );
};

const UploadPage = () => {
  const navigate = useNavigate();
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [cvText, setCvText] = useState("");
  const [clFiles, setClFiles] = useState<File[]>([]);
  const [clText, setClText] = useState("");
  const [uploading, setUploading] = useState(false);

  const hasCV = cvFiles.length > 0 || cvText.trim() !== "";

  const uploadDocuments = async (sessionId: string, files: File[], text: string) => {
    if (files.length > 0) {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      files.forEach((f) => formData.append("files", f));
      const res = await fetch(`/api/documents/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.error || `File upload failed (${res.status})`);
      }
    }
    if (text.trim()) {
      const res = await apiFetch("/api/documents/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, text: text.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || err?.error || `Text save failed (${res.status})`);
      }
    }
  };

  const handleContinue = async () => {
    setUploading(true);
    try {
      const sessionRes = await apiFetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => null);
        throw new Error(err?.error?.message || err?.error || `Failed to create session (${sessionRes.status})`);
      }
      const { session_id } = await sessionRes.json();
      setSessionId(session_id);

      await uploadDocuments(session_id, cvFiles, cvText);

      const hasCL = clFiles.length > 0 || clText.trim() !== "";
      if (hasCL) {
        await uploadDocuments(session_id, clFiles, clText);
      }

      navigate("/questionnaire");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-12 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Tell us about yourself</h1>
        <p className="mt-1 text-muted-foreground">Start by uploading your CV. Cover letters are optional but help.</p>

        <div className="mt-8 space-y-10">
          <DocSection
            label="CV / Resume *"
            files={cvFiles} setFiles={setCvFiles}
            pastedText={cvText} setPastedText={setCvText}
            processing={false}
          />

          <DocSection
            label="Cover letter (optional)"
            files={clFiles} setFiles={setClFiles}
            pastedText={clText} setPastedText={setClText}
            processing={false}
          />

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!hasCV || uploading}
            onClick={handleContinue}
          >
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Continue to questionnaire →"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
