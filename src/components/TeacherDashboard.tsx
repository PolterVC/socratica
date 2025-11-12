import { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoursesTab from "./teacher/CoursesTab";
import AnalyticsTab from "./teacher/AnalyticsTab";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Manage courses and view student analytics
        </p>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">Courses & Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="mt-6">
          <CoursesTab userId={user.id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;