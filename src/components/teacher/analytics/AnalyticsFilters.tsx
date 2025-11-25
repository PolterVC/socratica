import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
  code: string;
}

interface Assignment {
  id: string;
  title: string;
}

interface AnalyticsFiltersProps {
  courses: Course[];
  assignments: Assignment[];
  selectedCourse: string;
  selectedAssignment: string;
  onCourseChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
  onLoad: () => void;
  loading: boolean;
}

const AnalyticsFilters = ({
  courses,
  assignments,
  selectedCourse,
  selectedAssignment,
  onCourseChange,
  onAssignmentChange,
  onLoad,
  loading
}: AnalyticsFiltersProps) => {
  return (
    <div className="flex gap-3 items-center">
      <Select value={selectedCourse} onValueChange={onCourseChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Course" />
        </SelectTrigger>
        <SelectContent>
          {courses.map(course => (
            <SelectItem key={course.id} value={course.id}>
              {course.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAssignment} onValueChange={onAssignmentChange} disabled={!selectedCourse}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Assignment" />
        </SelectTrigger>
        <SelectContent>
          {assignments.map(assignment => (
            <SelectItem key={assignment.id} value={assignment.id}>
              {assignment.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onLoad} disabled={loading || !selectedAssignment}>
        {loading ? "Loading..." : "Load"}
      </Button>
    </div>
  );
};

export default AnalyticsFilters;
