import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, TrendingUp, Users, BarChart3, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Course {
  id: string;
  title: string;
  code: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
}

interface AnalyticsData {
  confusionRate: number;
  studentsNeedingHelpCount: number;
  topConfusedQuestion: number | null;
  topConfusedTopic: string | null;
  groundedRate: number;
  totalMessages: number;
  confusedMessages: number;
  confusedByQuestion: Array<{ question: number; count: number; total: number }>;
  topicsByImpact: Array<{ topic: string; count: number; confusedCount: number; impactPercent: number }>;
  studentsNeedingHelp: Array<{ id: string; name: string; confusedMessages: number; lastStuckOn: string }>;
  recentMessages: Array<any>;
}

const AnalyticsTab = ({ userId }: { userId: string }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadAssignments();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });

    setCourses(data || []);
  };

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', selectedCourse)
      .order('created_at', { ascending: false });

    setAssignments(data || []);
  };

  const loadAnalytics = async () => {
    if (!selectedCourse || !selectedAssignment) {
      toast.error("Please select both a course and assignment");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { courseId: selectedCourse, assignmentId: selectedAssignment }
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Select course and assignment to view insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} – {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAssignment} onValueChange={setSelectedAssignment} disabled={!selectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select an assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(assignment => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={loadAnalytics} disabled={loading || !selectedAssignment}>
              {loading ? "Loading..." : "Load Analytics"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analytics && analytics.totalMessages > 0 && (
        <>
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Confusion Rate</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.confusionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.confusedMessages} of {analytics.totalMessages} messages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  <span>Need Follow-up</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.studentsNeedingHelpCount}</div>
                <p className="text-xs text-muted-foreground mt-1">students struggling</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span>Top Question</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.topConfusedQuestion ? `Q${analytics.topConfusedQuestion}` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">most confusion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Top Topic</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate" title={analytics.topConfusedTopic || "N/A"}>
                  {analytics.topConfusedTopic || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">to reteach</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Grounded Rate</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.groundedRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">responses grounded</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confusion by Question</CardTitle>
                <CardDescription>Which questions generate the most confusion</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.confusedByQuestion.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.confusedByQuestion.map((item) => {
                      const percentage = Math.round((item.count / item.total) * 100);
                      return (
                        <div key={item.question} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Question {item.question}</span>
                            <span className="text-muted-foreground">
                              {item.count} confused ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No confusion data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Topics by Impact</CardTitle>
                <CardDescription>Concepts causing the most confusion</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topicsByImpact.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topicsByImpact.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate flex-1" title={item.topic}>
                            {item.topic}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {item.confusedCount} confused ({item.impactPercent}%)
                          </span>
                        </div>
                        <Progress value={item.impactPercent} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No topic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Students Needing Help</CardTitle>
              <CardDescription>Students who expressed confusion multiple times</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.studentsNeedingHelp.length > 0 ? (
                <div className="space-y-2">
                  {analytics.studentsNeedingHelp.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last stuck on: {student.lastStuckOn}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{student.confusedMessages}</p>
                          <p className="text-xs text-muted-foreground">confused msgs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No students needing help</p>
              )}
            </CardContent>
          </Card>

          {analytics.recentMessages.length > 0 && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Student Questions</CardTitle>
                  <CardDescription>Last 50 questions from students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.recentMessages.map((msg) => (
                      <div key={msg.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{msg.studentName}</span>
                          <div className="flex gap-2">
                            {msg.questionNumber && (
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                Q{msg.questionNumber}
                              </span>
                            )}
                            {msg.topicTag && (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                                {msg.topicTag}
                              </span>
                            )}
                            {msg.confusionFlag && (
                              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                Confused
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{msg.text}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {analytics && analytics.totalMessages === 0 && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No student activity yet for this assignment
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
