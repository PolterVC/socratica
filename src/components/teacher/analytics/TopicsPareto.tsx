import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TopicsParetoProps {
  data: Array<{ topic: string; confused: number }>;
  onTopicClick?: (topic: string) => void;
}

const TopicsPareto = ({ data, onTopicClick }: TopicsParetoProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topics by impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No topic data
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    name: d.topic.length > 20 ? d.topic.substring(0, 20) + '...' : d.topic,
    value: d.confused,
    fullTopic: d.topic
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Topics by impact</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const topic = data.activePayload[0].payload.fullTopic;
                onTopicClick?.(topic);
              }
            }}
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--analytics-warning))"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TopicsPareto;
