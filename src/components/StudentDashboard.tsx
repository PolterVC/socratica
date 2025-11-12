import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare } from "lucide-react";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    setCourses(coursesData || []);
    setAssignments(assignmentsData || []);
    setLoading(false);
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
      navigate(`/chat/${existingConv.id}`);
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
      } else {
        navigate(`/chat/${newConv.id}`);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Student Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Select an assignment to start chatting with Socratica
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses available yet. Check back later!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        courses.map(course => {
          const courseAssignments = assignments.filter(a => a.course_id === course.id);
          
          return (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.code} - {course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {courseAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet</p>
                ) : (
                  <div className="grid gap-3">
                    {courseAssignments.map(assignment => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.description}
                            </p>
                          )}
                          {assignment.due_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => startChat(assignment.id, course.id)}
                          className="ml-4"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Start Chat
                        </Button>
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

export default StudentDashboard;