import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, BookOpen, Copy, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  code: string;
  join_code: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  allow_direct_answers: boolean;
}

const CoursesTab = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Course form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // Assignment form state
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [allowDirectAnswers, setAllowDirectAnswers] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null); // fake upload file

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      if (coursesError) {
        console.error("Error loading courses:", coursesError);
        toast.error("Error loading courses");
      }

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error loading assignments:", assignmentsError);
      }

      setCourses(coursesData || []);
      setAssignments(assignmentsData || []);
    } catch (err) {
      console.error("Unexpected error in loadData:", err);
      toast.error("Failed to load data");
    }
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("courses")
      .insert({ title: courseTitle, code: courseCode, teacher_id: userId });

    if (error) {
      toast.error("Error creating course");
      console.error("Course creation error:", error);
    } else {
      toast.success("Course created successfully");
      setShowCourseDialog(false);
      setCourseTitle("");
      setCourseCode("");
      loadData();
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    // Fake upload: we just pretend we used this file
    if (assignmentFile) {
      console.log("Simulated assignment upload:", assignmentFile.name);
    }

    const { error } = await supabase.from("assignments").insert({
      course_id: selectedCourse,
      title: assignmentTitle,
      description: assignmentDescription || null,
      due_date: assignmentDueDate || null,
      allow_direct_answers: allowDirectAnswers,
    });

    if (error) {
      toast.error("Error creating assignment");
    } else {
      toast.success(
        assignmentFile
          ? "Assignment created"
          : "Assignment created successfully"
      );
      setShowAssignmentDialog(false);
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setAllowDirectAnswers(false);
      setAssignmentFile(null);
      setSelectedCourse(null);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Courses</h3>
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={createCourse} className="space-y-4">
              <div>
                <Label htmlFor="course-code">Course Code</Label>
                <Input
                  id="course-code"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="ECON 208"
                  required
                />
              </div>
              <div>
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Microeconomic Theory"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create Course
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses yet. Create your first course!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        courses.map((course) => {
          const courseAssignments = assignments.filter(
            (a) => a.course_id === course.id
          );

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {course.code} - {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        Join code: {course.join_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(course.join_code);
                          toast.success("Join code copied to clipboard");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Dialog
                    open={
                      showAssignmentDialog && selectedCourse === course.id
                    }
                    onOpenChange={(open) => {
                      setShowAssignmentDialog(open);
                      if (open) {
                        setSelectedCourse(course.id);
                      } else {
                        setSelectedCourse(null);
                        setAssignmentFile(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Assignment</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={createAssignment} className="space-y-4">
                        <div>
                          <Label htmlFor="assignment-title">
                            Assignment Title
                          </Label>
                          <Input
                            id="assignment-title"
                            value={assignmentTitle}
                            onChange={(e) =>
                              setAssignmentTitle(e.target.value)
                            }
                            placeholder="Problem Set 1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="assignment-description">
                            Description
                          </Label>
                          <Textarea
                            id="assignment-description"
                            value={assignmentDescription}
                            onChange={(e) =>
                              setAssignmentDescription(e.target.value)
                            }
                            placeholder="Optional description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="assignment-due-date">Due Date</Label>
                          <Input
                            id="assignment-due-date"
                            type="datetime-local"
                            value={assignmentDueDate}
                            onChange={(e) =>
                              setAssignmentDueDate(e.target.value)
                            }
                          />
                        </div>

                        {/* Fake file dropzone */}
                        <div>
                          <Label>Assignment File (optional)</Label>
                          <div
                            className={`mt-2 flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground cursor-pointer transition hover:border-primary hover:bg-muted/40 ${
                              assignmentFile ? "border-primary bg-muted/40" : ""
                            }`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                setAssignmentFile(file);
                              }
                            }}
                            onClick={() => {
                              const input =
                                document.getElementById(
                                  "assignment-file-input"
                                ) as HTMLInputElement | null;
                              input?.click();
                            }}
                          >
                            <UploadCloud className="h-5 w-5 mb-2" />
                            {assignmentFile ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium">
                                  {assignmentFile.name}
                                </span>
                                <span className="text-xs">
                                  File attached
                                </span>
                                <button
                                  type="button"
                                  className="mt-1 inline-flex items-center text-xs text-red-500 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignmentFile(null);
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove file
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium">
                                  Drag & drop a file here
                                </span>
                                <span className="text-xs">
                                  or click to browse files
                                </span>
                              </>
                            )}
                          </div>
                          <input
                            id="assignment-file-input"
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setAssignmentFile(file);
                            }}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="allow-direct-answers"
                            checked={allowDirectAnswers}
                            onCheckedChange={setAllowDirectAnswers}
                          />
                          <Label
                            htmlFor="allow-direct-answers"
                            className="font-normal"
                          >
                            Allow tutor to give direct answers
                          </Label>
                        </div>
                        <Button type="submit" className="w-full">
                          Create Assignment
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {courseAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No assignments yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {courseAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {assignment.description}
                              </p>
                            )}
                            {assignment.due_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Due:{" "}
                                {new Date(
                                  assignment.due_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {assignment.allow_direct_answers && (
                            <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                              Direct answers allowed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default CoursesTab;
