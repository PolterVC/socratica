import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Download, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type MaterialItem = {
  id: string;
  title: string;
  kind: string;
  file_size: number | null;
  text_extracted: boolean;
  created_at: string;
  downloadUrl: string | null;
};

export default function MaterialsList({ courseId, assignmentId }: { courseId: string; assignmentId?: string | null }) {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
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
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { load(); }, [courseId, assignmentId]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading materials…</div>;
  if (!items.length) return <div className="text-sm text-muted-foreground">No materials available</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">Course Materials</h3>
      {items.map((m) => (
        <Card key={m.id} className="px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-4 h-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {m.kind.replace(/_/g, " ")} • {m.file_size ? `${(m.file_size / (1024 * 1024)).toFixed(1)} MB` : "Unknown size"}
                </div>
              </div>
              {m.text_extracted ? (
                <span className="inline-flex items-center text-green-600 text-xs shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center text-amber-600 text-xs shrink-0">
                  <Clock className="w-3 h-3 mr-1" /> Processing
                </span>
              )}
            </div>
            {m.downloadUrl && (
              <a href={m.downloadUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" className="shrink-0">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
