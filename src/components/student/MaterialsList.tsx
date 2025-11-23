import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface MaterialsListProps {
  courseId: string;
  assignmentId: string;
}

interface Material {
  id: string;
  title: string;
  kind: string;
  downloadUrl: string | null;
}

const MaterialsList = ({ courseId, assignmentId }: MaterialsListProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [courseId, assignmentId]);

  const loadMaterials = async () => {
    try {
      const params = new URLSearchParams({ courseId, assignmentId });
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?${params}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load materials");

      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      console.error("Load materials error:", err);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading materials...
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No materials available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Course Materials</h3>
      <div className="space-y-1.5">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{material.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {material.kind}
                </p>
              </div>
            </div>
            {material.downloadUrl && (
              <Button size="sm" variant="ghost" asChild className="shrink-0 h-8 px-2">
                <a href={material.downloadUrl} download>
                  <Download className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialsList;
