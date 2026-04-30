import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, subtitle = "", onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "data-card group cursor-default",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="stat-value text-white">{value}</p>
            {subtitle && <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{subtitle}</span>}
          </div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all border border-border group-hover:border-primary/50">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      
      {onClick && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between group-hover:border-primary/30 transition-colors">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">View Details</span>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      )}
    </div>
  );
}
