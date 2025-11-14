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
      <Card>
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No materials available for this assignment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{material.title}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {material.kind}
                </p>
              </div>
            </div>
            {material.downloadUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={material.downloadUrl} download>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MaterialsList;
