const AnalyticsDonut = ({ className = "" }: { className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="none" 
        stroke="hsl(var(--muted))" 
        strokeWidth="20" 
      />
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="none" 
        stroke="hsl(var(--primary))" 
        strokeWidth="20" 
        strokeDasharray="125 251" 
        strokeLinecap="round" 
        transform="rotate(-90 50 50)"
      />
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="none" 
        stroke="hsl(var(--primary) / 0.6)" 
        strokeWidth="20" 
        strokeDasharray="75 251" 
        strokeDashoffset="-125" 
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};

export default AnalyticsDonut;
