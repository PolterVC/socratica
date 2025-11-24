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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, CheckCircle2 } from "lucide-react";
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
  file_size: number | null;
  text_extracted: boolean;
  created_at: string;
  downloadUrl: string | null;
}

const MaterialsTab = ({ courseId, assignmentId }: MaterialsTabProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(1); // 1: choose file, 2: name+type, 3: uploading
  
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(assignmentId ? "assignment" : "questions_with_answers");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [courseId, assignmentId]);

  useEffect(() => {
    setKind(assignmentId ? "assignment" : "questions_with_answers");
  }, [assignmentId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ courseId });
      if (assignmentId) params.append("assignmentId", assignmentId);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/materials?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load materials");

      const materialsData = await response.json();
      setMaterials(materialsData.items || []);
    } catch (err) {
      console.error("Load materials error:", err);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25MB");
      return;
    }

    setFile(selectedFile);
    setUploadStep(2);
  };

  const handleUpload = async () => {
    if (!file || !title || !kind) {
      toast.error("Please fill in all fields");
      return;
    }

    setUploading(true);
    setUploadStep(3);
    setUploadProgress(0);

    try {
      // Step 1: Get signed upload URL and precreate DB row (20%)
      setUploadProgress(20);
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        "materials-upload",
        {
          body: {
            courseId,
            assignmentId: assignmentId || null,
            filename: file.name,
            title,
            kind,
            fileSize: file.size,
          },
        }
      );

      if (uploadError || !uploadData?.uploadUrl) {
        throw new Error(uploadData?.error || "Failed to create upload URL");
      }

      // Step 2: Upload file to storage (40%)
      setUploadProgress(40);
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
          "x-upsert": "true",
        },
      });

      if (!uploadResponse.ok) throw new Error("File upload failed");

      // Step 3: Extract text from PDF (60%)
      setUploadProgress(60);
      const { chunks } = await extractTextFromPDF(file);

      // Step 4: Save chunks (80%)
      setUploadProgress(80);
      const { error: textError } = await supabase.functions.invoke("materials-text", {
        body: {
          materialId: uploadData.materialId,
          chunks,
        },
      });

      setUploadProgress(100);

      if (textError) {
        console.error("Text extraction error:", textError);
        toast.warning("Upload complete, but text extraction failed");
      } else {
        toast.success("Material uploaded and processed successfully!");
      }
      
      // Reset form
      setTitle("");
      setKind(assignmentId ? "assignment" : "questions_with_answers");
      setFile(null);
      setUploadStep(1);
      setUploadProgress(0);
      
      // Reload materials
      loadMaterials();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload material");
      setUploadStep(2);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
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
          {uploadStep === 1 && (
            <div>
              <Label htmlFor="file">Choose PDF File (max 25MB)</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
          )}

          {uploadStep === 2 && file && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium truncate">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setUploadStep(1);
                  }}
                >
                  Change
                </Button>
              </div>

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
                    <SelectItem value="questions">Questions Only</SelectItem>
                    <SelectItem value="answers">Answers Only</SelectItem>
                    <SelectItem value="questions_with_answers">Questions + Answers</SelectItem>
                    <SelectItem value="slides">Slides</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpload} disabled={!title} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          )}

          {uploadStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium flex-1">{title}</span>
                <Badge variant="secondary">Processing</Badge>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress < 40 ? "Preparing upload..." :
                 uploadProgress < 60 ? "Uploading file..." :
                 uploadProgress < 80 ? "Extracting text..." :
                 uploadProgress < 100 ? "Saving content..." :
                 "Complete!"}
              </p>
            </div>
          )}
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
                        {material.kind.replace(/_/g, " ")} •{" "}
                        {material.file_size
                          ? `${(material.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : "Size unknown"} •{" "}
                        {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {material.text_extracted ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Processing</Badge>
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
