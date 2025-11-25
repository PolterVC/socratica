import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ConfusionByQuestionProps {
  data: Array<{ question: number; confused: number }>;
  onQuestionClick?: (question: number) => void;
}

const ConfusionByQuestion = ({ data, onQuestionClick }: ConfusionByQuestionProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confusion by question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No confusion data
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    name: `Q${d.question}`,
    value: d.confused,
    question: d.question
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confusion by question</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const question = data.activePayload[0].payload.question;
                onQuestionClick?.(question);
              }
            }}
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={40} />
            <Tooltip />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--analytics-confused))"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ConfusionByQuestion;
