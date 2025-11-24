import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { extractTextFromPDF } from "@/utils/pdfExtractor";
import { FileText, Upload, CheckCircle, Clock, Download, Trash2, FileQuestion, FileCheck } from "lucide-react";

type MaterialItem = {
  id: string;
  title: string;
  kind: string;
  file_size: number | null;
  text_extracted: boolean;
  created_at: string;
  downloadUrl: string | null;
  assignment_id: string | null;
  course_id: string;
};

export default function MaterialsTab({ courseId, assignmentId, isTeacher }: { courseId: string; assignmentId?: string | null; isTeacher?: boolean; }) {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(assignmentId ? "assignment" : "slides");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);

  async function list() {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token || "";
      const params = new URLSearchParams({ courseId });
      if (assignmentId) params.append("assignmentId", assignmentId);
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      console.error(e);
      toast.error("Could not load materials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    list(); 
    setKind(assignmentId ? "assignment" : "slides");
  }, [courseId, assignmentId]);

  function onPick(f?: File) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return toast.error("Only PDF files are allowed");
    if (f.size > 25 * 1024 * 1024) return toast.error("Max 25 MB");
    setFile(f);
    setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  async function upload() {
    if (!isTeacher || !file || !title) return;
    setBusy(true); setPct(0);
    try {
      setPct(20);
      const { data: start, error } = await supabase.functions.invoke("materials-upload", {
        body: { courseId, assignmentId: assignmentId ?? null, filename: file.name, title, kind, fileSize: file.size }
      });
      if (error) {
        console.error("Edge function error:", error);
        toast.error(error.message || "Could not start upload");
        setBusy(false);
        return;
      }
      if (!start?.uploadUrl || !start?.materialId) {
        console.error("Invalid response from materials-upload:", start);
        toast.error(start?.error || "Could not create upload URL");
        setBusy(false);
        return;
      }

      setPct(40);
      try {
        await putWithProgress(start.uploadUrl, file, setPct);
      } catch (uploadErr) {
        console.error("File upload error:", uploadErr);
        toast.error("Failed to upload file to storage");
        setBusy(false);
        return;
      }

      setPct(60);
      toast.info("Extracting text");
      try {
        const { chunks } = await extractTextFromPDF(file);
        
        setPct(80);
        const { error: textErr } = await supabase.functions.invoke("materials-text", { body: { materialId: start.materialId, chunks } });
        
        if (textErr) {
          console.error("Text extraction error:", textErr);
          toast.error("Upload done, but text extraction failed");
        } else {
          toast.success("Upload complete");
        }
      } catch (extractErr) {
        console.error("PDF extraction error:", extractErr);
        toast.error("Upload done, but couldn't extract text from PDF");
      }

      setPct(100);
      setFile(null); setTitle(""); setPct(0);
      await list();
    } catch (e) {
      console.error("Upload error:", e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token || "";
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?id=${encodeURIComponent(id)}`, { 
      method: "DELETE", 
      headers: { Authorization: token ? `Bearer ${token}` : "" } 
    });
    if (res.ok) { toast.success("Deleted"); list(); } 
    else { toast.error("Could not delete"); }
  }

  return (
    <div className="space-y-6">
      {isTeacher && (
        <Card>
          <CardHeader><CardTitle>Upload PDF</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>File</Label>
                <Input type="file" accept="application/pdf" onChange={(e) => onPick(e.target.files?.[0] || undefined)} disabled={busy} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Slides week 3 or Assignment 2" disabled={busy} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={kind} onValueChange={setKind} disabled={busy}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="questions">Assignment Questions</SelectItem>
                    <SelectItem value="answers">Answer Key / Solutions</SelectItem>
                    <SelectItem value="questions_with_answers">Combined Questions &amp; Answers</SelectItem>
                    <SelectItem value="slides">Reference / Slides</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={upload} disabled={busy || !file || !title}>
                <Upload className="w-4 h-4 mr-2" />Upload
              </Button>
              {busy && (
                <div className="flex items-center gap-2 flex-1">
                  <Progress value={pct} className="flex-1 max-w-xs" />
                  <span className="text-sm text-muted-foreground">{pct}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No materials yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((m) => {
                const isQuestions = m.kind === "questions" || m.kind === "questions_with_answers";
                const isAnswers = m.kind === "answers" || m.kind === "questions_with_answers";
                const Icon = isQuestions ? FileQuestion : isAnswers ? FileCheck : FileText;
                
                return (
                <div key={m.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isQuestions ? "text-blue-600" : isAnswers ? "text-green-600" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {m.title}
                        {isQuestions && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-normal">Questions</span>}
                        {isAnswers && m.kind === "answers" && <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-normal">Answers</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.kind === "questions" ? "Assignment Questions" : m.kind === "answers" ? "Answer Key / Solutions" : m.kind === "questions_with_answers" ? "Combined Questions & Answers" : m.kind === "slides" ? "Reference / Slides" : m.kind.replace(/_/g, " ")} • {m.file_size ? `${(m.file_size / (1024 * 1024)).toFixed(1)} MB` : "Size unknown"} • {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {m.text_extracted ? (
                      <span className="ml-2 inline-flex items-center text-green-600 text-xs shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" /> Ready
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center text-amber-600 text-xs shrink-0">
                        <Clock className="w-3 h-3 mr-1" /> Processing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.downloadUrl && (
                      <a href={m.downloadUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />Download
                        </Button>
                      </a>
                    )}
                    {isTeacher && (
                      <Button variant="destructive" size="sm" onClick={() => remove(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function putWithProgress(url: string, file: File, onPct: (n: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => { 
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onPct(Math.min(progress, 95)); // Cap at 95% for upload portion
      }
    };
    xhr.onload = () => { 
      if (xhr.status >= 200 && xhr.status < 300) resolve(); 
      else reject(new Error(`Upload failed ${xhr.status}`)); 
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(file);
  });
}
