import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnalyticsFilters from "./analytics/AnalyticsFilters";
import KpiRow from "./analytics/KpiRow";
import ConfusionByQuestion from "./analytics/ConfusionByQuestion";
import TopicsPareto from "./analytics/TopicsPareto";
import StudentsNeedingHelp from "./analytics/StudentsNeedingHelp";

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
  kpis: {
    confused_pct: number;
    students_needing_help: number;
    top_question: number | null;
    top_topic: string | null;
    grounded_rate: number;
  };
  by_question: Array<{ question: number; confused: number }>;
  topics: Array<{ topic: string; confused: number }>;
  students: Array<{
    student_id: string;
    student_name: string;
    question: number | null;
    topic: string | null;
    last_ts: string;
    conversation_id: string;
    last_message: string;
  }>;
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
      setSelectedAssignment("");
      setAnalytics(null);
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
        body: { 
          courseId: selectedCourse, 
          assignmentId: selectedAssignment 
        }
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (error: any) {
      console.error('Analytics error:', error);
      toast.error(error.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.code || '';
  const selectedAssignmentName = assignments.find(a => a.id === selectedAssignment)?.title || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Analytics</h2>
        {selectedCourseName && selectedAssignmentName && (
          <p className="text-sm text-muted-foreground">
            {selectedCourseName} • {selectedAssignmentName}
          </p>
        )}
      </div>

      <AnalyticsFilters
        courses={courses}
        assignments={assignments}
        selectedCourse={selectedCourse}
        selectedAssignment={selectedAssignment}
        onCourseChange={setSelectedCourse}
        onAssignmentChange={setSelectedAssignment}
        onLoad={loadAnalytics}
        loading={loading}
      />

      {analytics && (
        <>
          <KpiRow
            confusedPct={analytics.kpis.confused_pct}
            studentsNeedingHelp={analytics.kpis.students_needing_help}
            topQuestion={analytics.kpis.top_question}
            topTopic={analytics.kpis.top_topic}
            groundedRate={analytics.kpis.grounded_rate}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <ConfusionByQuestion data={analytics.by_question} />
            <TopicsPareto data={analytics.topics} />
          </div>

          <StudentsNeedingHelp students={analytics.students} />
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
