const MiniBars = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <div className="flex-1 bg-muted-foreground/30 rounded-t" style={{ height: '50%' }} />
      <div className="flex-1 bg-primary/70 rounded-t" style={{ height: '75%' }} />
      <div className="flex-1 bg-primary rounded-t" style={{ height: '90%' }} />
    </div>
  );
};

export default MiniBars;
