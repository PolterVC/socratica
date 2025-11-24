import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  code: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
}

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Fetch enrolled courses
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('course_id, courses(*)')
      .eq('student_id', user.id);

    const enrolledCourses = enrollmentsData?.map(e => e.courses).filter(Boolean) || [];
    const enrolledCourseIds = enrolledCourses.map(c => c.id);

    setCourses(enrolledCourses as Course[]);

    // Fetch assignments only from enrolled courses
    if (enrolledCourseIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', enrolledCourseIds)
        .order('created_at', { ascending: false });

      setAssignments(assignmentsData || []);
    } else {
      setAssignments([]);
    }

    setLoading(false);
  };

  const joinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;

    // Match DB format: trim, uppercase
    const normalizedCode = joinCode.trim().toUpperCase();

    // Call edge function so RLS does not block us
    const { data, error } = await supabase.functions.invoke('join-course', {
      body: { joinCode: normalizedCode },
    });

    if (error || !data || data.error) {
      console.error('Join error:', error || data?.error);
      toast.error('Invalid join code');
      return;
    }

    toast.success(`Successfully joined ${data.course.code}!`);
    setJoinCode("");
    // Reload enrolled courses and assignments
    await loadData();
  };

  const startChat = async (assignmentId: string, courseId: string) => {
    // Check if there's an existing conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', user.id)
      .eq('assignment_id', assignmentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingConv) {
      navigate(`/app/chat/${existingConv.id}`);
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          student_id: user.id,
          course_id: courseId,
          assignment_id: assignmentId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        toast.error('Error starting chat. Make sure you are enrolled in this course.');
      } else {
        navigate(`/app/chat/${newConv.id}`);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your Courses</h2>
          <p className="text-muted-foreground mt-1">
            Select an assignment to start a conversation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Join a Course</CardTitle>
          <CardDescription>Enter the code from your teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={joinCourse} className="flex gap-3">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter join code"
              className="flex-1"
            />
            <Button type="submit" size="default">Join</Button>
          </form>
        </CardContent>
      </Card>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No courses yet. Join a course using the code above.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {courses.map(course => {
            const courseAssignments = assignments.filter(a => a.course_id === course.id);
            
            return (
              <Card key={course.id}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{course.code} – {course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {courseAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No assignments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {courseAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                            {assignment.due_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Due {new Date(assignment.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => startChat(assignment.id, course.id)}
                            className="shrink-0"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-1.5" />
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;