import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Edit, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizData {
  title: string;
  joinCode: string;
  questions: Question[];
}

const Engagement = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.match(/\.(pdf|pptx)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or PPTX file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { fileName: file.name, fileType: file.type }
      });

      if (error) throw error;

      setQuizData(data);
      toast({
        title: "Quiz generated!",
        description: "Edit questions if needed, then start your live session.",
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleQuestionEdit = (index: number, field: string, value: any) => {
    if (!quizData) return;
    
    const newQuestions = [...quizData.questions];
    if (field === 'question') {
      newQuestions[index].question = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.replace('option', ''));
      newQuestions[index].options[optionIndex] = value;
    } else if (field === 'correctAnswer') {
      newQuestions[index].correctAnswer = value;
    }
    
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const startLiveSession = () => {
    if (!quizData || quizData.questions.length === 0) {
      toast({
        title: "No questions",
        description: "Add at least one question before starting.",
        variant: "destructive",
      });
      return;
    }
    setShowLiveModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Engagement Tools</h1>
            <p className="text-muted-foreground">
              Generate interactive quizzes from your course materials
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Doc-to-Quiz</CardTitle>
                <CardDescription>
                  Upload a PDF or PPTX file to automatically generate quiz questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary font-medium">Click to upload</span> or drag and drop
                    <p className="text-sm text-muted-foreground mt-1">PDF or PPTX (max 20MB)</p>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.pptx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>

                {uploading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Generating questions...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questions Section */}
            {quizData && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{quizData.title}</CardTitle>
                    <CardDescription>{quizData.questions.length} questions</CardDescription>
                  </div>
                  <Button onClick={startLiveSession} size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Live Session
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {quizData.questions.map((q, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {editingQuestion === index ? (
                            <Textarea
                              value={q.question}
                              onChange={(e) => handleQuestionEdit(index, 'question', e.target.value)}
                              className="font-medium"
                              rows={2}
                            />
                          ) : (
                            <p className="font-medium">{index + 1}. {q.question}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingQuestion(editingQuestion === index ? null : index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 pl-4">
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              type="radio"
                              name={`question-${index}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => handleQuestionEdit(index, 'correctAnswer', optIndex)}
                              className="w-4 h-4"
                              disabled={editingQuestion !== index}
                            />
                            {editingQuestion === index ? (
                              <Input
                                value={option}
                                onChange={(e) => handleQuestionEdit(index, `option${optIndex}`, e.target.value)}
                                className="flex-1"
                              />
                            ) : (
                              <span className={q.correctAnswer === optIndex ? "text-primary font-medium" : ""}>
                                {option}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Live Session Modal */}
      <Dialog open={showLiveModal} onOpenChange={setShowLiveModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Live Quiz Session</DialogTitle>
            <DialogDescription>Students can join using the code below</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-primary/10 p-8 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Join Code</p>
              <p className="text-5xl font-bold text-primary tracking-wider">{quizData?.joinCode}</p>
            </div>

            {quizData?.questions[0] && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-center">{quizData.questions[0].question}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {quizData.questions[0].options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="lg"
                      className="h-20 text-lg font-medium hover:bg-primary hover:text-primary-foreground"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              This is a preview. In a live session, responses would be collected in real-time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Engagement;
