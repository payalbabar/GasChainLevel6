import { Database, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EVENT_LABELS } from "@/lib/blockchain";
import { cn } from "@/lib/utils";
import moment from "moment";

function EventBadge({ type }) {
  const map = {
    booking_created:   "bg-primary/10 text-primary border-primary/20",
    payment_confirmed: "bg-success/10 text-success border-success/20",
    delivery_updated:  "bg-primary/10 text-primary border-primary/20",
    subsidy_credited:  "bg-warning/10 text-warning border-warning/20",
    cylinder_assigned: "bg-accent/10 text-accent border-accent/20",
    dispatched:        "bg-sky-500/10 text-sky-400 border-sky-500/20",
    in_transit:        "bg-primary/10 text-primary border-primary/20",
    delivered:         "bg-success/10 text-success border-success/20",
  };
  return (
    <span className={cn(
      "text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide border",
      map[type] || "bg-muted/20 text-muted-foreground border-border/20"
    )}>
      {EVENT_LABELS[type] || type?.replace(/_/g, " ") || "event"}
    </span>
  );
}

export default function RecentBlocks({ blocks }) {
  const navigate = useNavigate();
  const isEmpty = !blocks || blocks.length === 0;

  return (
    <div
      className="rounded-lg border border-border/50 overflow-hidden flex flex-col h-[480px]"
      style={{ background: "hsl(220 18% 7% / 0.9)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{
              background: "hsl(260 60% 58% / 0.1)",
              border: "1px solid hsl(260 60% 58% / 0.15)",
            }}
          >
            <Database className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Blockchain Activity</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {blocks?.length || 0} blocks indexed
            </p>
          </div>
        </div>
        <Link
          to="/ledger"
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5 transition-colors" />
        </Link>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-3">
          <div className="h-14 w-14 rounded-lg bg-muted/20 flex items-center justify-center">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">No blocks yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Initialize a booking to start consensus.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border/20">
          {blocks.slice(0, 8).map((block) => (
            <div
              key={block.id}
              onClick={() => navigate("/ledger")}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/15 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Block index badge */}
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 text-accent group-hover:bg-accent/10 transition-colors"
                  style={{ background: "hsl(260 60% 58% / 0.08)" }}
                >
                  #{block.block_index}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ShieldCheck className="h-3 w-3 text-success flex-shrink-0" />
                    <EventBadge type={block.event_type} />
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {block.block_hash}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                {moment(block.created_date).fromNow()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
