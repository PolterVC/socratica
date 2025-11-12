import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

const COLORS = ['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#2563EB', '#7C3AED', '#DB2777'];

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
  messagesByQuestion: Array<{ question: number; count: number }>;
  messagesByTopic: Array<{ topic: string; count: number }>;
  recentMessages: Array<any>;
  confusedMessages: number;
  totalMessages: number;
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
      <Card>
        <CardHeader>
          <CardTitle>Select Course and Assignment</CardTitle>
          <CardDescription>Choose what you want to analyze</CardDescription>
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
                    {course.code} - {course.title}
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

      {analytics && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.totalMessages}</CardTitle>
                <CardDescription>Total Messages</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.confusedMessages}</CardTitle>
                <CardDescription>Confused Students</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {analytics.messagesByTopic.length > 0 ? analytics.messagesByTopic[0].topic : "N/A"}
                </CardTitle>
                <CardDescription>Top Confusion Topic</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages by Question Number</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.messagesByQuestion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.messagesByQuestion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="question" label={{ value: 'Question #', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Messages', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.messagesByTopic.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.messagesByTopic}
                        dataKey="count"
                        nameKey="topic"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => entry.topic}
                      >
                        {analytics.messagesByTopic.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Student Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentMessages.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentMessages.slice(0, 10).map((msg) => (
                    <div key={msg.id} className="p-3 border rounded-lg">
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
                      <p className="text-sm text-muted-foreground">{msg.text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;