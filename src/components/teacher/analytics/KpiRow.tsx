import { Card, CardContent } from "@/components/ui/card";

interface KpiRowProps {
  confusedPct: number;
  studentsNeedingHelp: number;
  topQuestion: number | null;
  topTopic: string | null;
  groundedRate: number;
}

const KpiRow = ({
  confusedPct,
  studentsNeedingHelp,
  topQuestion,
  topTopic,
  groundedRate
}: KpiRowProps) => {
  return (
    <div className="grid grid-cols-5 gap-3">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-3xl font-bold text-[hsl(var(--analytics-confused))]">
            {confusedPct}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Confused %
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-3xl font-bold">
            {studentsNeedingHelp}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Students needing help
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-3xl font-bold text-[hsl(var(--analytics-info))]">
            {topQuestion !== null ? `Q${topQuestion}` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Top question
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold truncate" title={topTopic || 'N/A'}>
            {topTopic || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Top topic
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-3xl font-bold text-[hsl(var(--analytics-success))]">
            {groundedRate}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Grounded rate
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiRow;
