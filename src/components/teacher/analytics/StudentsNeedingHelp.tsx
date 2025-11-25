import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Student {
  student_id: string;
  student_name: string;
  question: number | null;
  topic: string | null;
  last_ts: string;
  conversation_id: string;
  last_message: string;
}

interface StudentsNeedingHelpProps {
  students: Student[];
}

const StudentsNeedingHelp = ({ students }: StudentsNeedingHelpProps) => {
  const navigate = useNavigate();

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students to follow up</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground text-sm">
            No students need follow up
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Students to follow up</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.map((student) => (
            <div 
              key={student.conversation_id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {student.student_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{student.student_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {student.last_message}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {student.question && (
                  <Badge variant="outline" className="text-xs">
                    Q{student.question}
                  </Badge>
                )}
                {student.topic && (
                  <Badge variant="secondary" className="text-xs max-w-[100px] truncate">
                    {student.topic}
                  </Badge>
                )}
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(student.last_ts), { addSuffix: true })}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-xs"
                  onClick={() => navigate(`/chat/${student.conversation_id}`)}
                >
                  Open chat
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentsNeedingHelp;
