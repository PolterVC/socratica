import { X, Check } from "lucide-react";

const GuardrailsMock = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <X className="w-3 h-3 text-destructive" />
        </div>
        <div className="flex-1 bg-destructive/5 rounded px-2 py-1 border border-destructive/20">
          <p className="text-xs text-muted-foreground">Give me the answer</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-600" />
        </div>
        <div className="flex-1 bg-green-500/5 rounded px-2 py-1 border border-green-500/20">
          <p className="text-xs text-muted-foreground">Let's outline steps</p>
        </div>
      </div>
    </div>
  );
};

export default GuardrailsMock;
