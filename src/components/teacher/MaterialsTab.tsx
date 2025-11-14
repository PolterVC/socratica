import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromPDF } from "@/utils/pdfExtractor";

interface MaterialsTabProps {
  courseId: string;
  assignmentId?: string;
}

interface Material {
  id: string;
  title: string;
  kind: string;
  text_extracted: boolean;
  created_at: string;
  downloadUrl: string | null;
}

const MaterialsTab = ({ courseId, assignmentId }: MaterialsTabProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("reading");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [courseId, assignmentId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ courseId });
      if (assignmentId) params.append("assignmentId", assignmentId);

      const { data, error } = await supabase.functions.invoke("materials", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) throw error;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load materials");

      const materialsData = await response.json();
      setMaterials(materialsData);
    } catch (err) {
      console.error("Load materials error:", err);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !kind) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        "materials-upload",
        {
          body: {
            courseId,
            assignmentId: assignmentId || null,
            filename: file.name,
          },
        }
      );

      if (uploadError) throw uploadError;

      // Step 2: Upload file to storage
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
          "x-upsert": "true",
        },
      });

      if (!uploadResponse.ok) throw new Error("File upload failed");

      // Step 3: Create material record
      const { data: materialData, error: materialError } = await supabase.functions.invoke(
        "materials",
        {
          method: "POST",
          body: {
            courseId,
            assignmentId: assignmentId || null,
            title,
            kind,
            storagePath: uploadData.storagePath,
          },
        }
      );

      if (materialError) throw materialError;

      // Step 4: Extract text from PDF
      toast.info("Extracting text from PDF...");
      const { chunks } = await extractTextFromPDF(file);

      // Step 5: Save chunks
      const { error: textError } = await supabase.functions.invoke("materials-text", {
        body: {
          materialId: materialData.id,
          chunks,
        },
      });

      if (textError) throw textError;

      toast.success("Material uploaded and processed successfully!");
      
      // Reset form
      setTitle("");
      setKind("reading");
      setFile(null);
      
      // Reload materials
      loadMaterials();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error } = await supabase.functions.invoke("materials", {
        method: "DELETE",
      });

      if (error) throw error;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?id=${materialId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete material");

      toast.success("Material deleted");
      loadMaterials();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete material");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 5 Reading"
              />
            </div>

            <div>
              <Label htmlFor="kind">Type</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="slides">Slides</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">PDF File (max 25MB)</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : materials.length === 0 ? (
            <p className="text-muted-foreground">No materials uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{material.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {material.kind} •{" "}
                        {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {material.text_extracted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    {material.downloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={material.downloadUrl} download>
                          Download
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsTab;
