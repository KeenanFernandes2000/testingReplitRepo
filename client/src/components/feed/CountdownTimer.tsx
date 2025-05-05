import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string;
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [hoursLeft, setHoursLeft] = useState(calculateHoursLeft());
  
  function calculateHoursLeft() {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    return diffHours;
  }
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHoursLeft(calculateHoursLeft());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return (
    <div 
      className="w-8 h-8 rounded-full countdown-timer flex items-center justify-center mr-2" 
      style={{ "--hours": hoursLeft } as React.CSSProperties}
    >
      <span className="text-xs font-medium">{hoursLeft}h</span>
    </div>
  );
}
