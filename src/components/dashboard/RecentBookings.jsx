import { ArrowRight, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CYLINDER_LABELS } from "@/lib/blockchain";
import { cn } from "@/lib/utils";
import moment from "moment";

function StatusBadge({ status }) {
  const map = {
    pending:   "bg-warning/10 text-warning border border-warning/20",
    confirmed: "bg-primary/10 text-primary border border-primary/20",
    delivered: "bg-success/10 text-success border border-success/20",
    cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
    transit:   "bg-primary/10 text-primary border border-primary/20",
  };
  return (
    <span className={cn(
      "text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide",
      map[status] || "bg-muted/20 text-muted-foreground border border-border/20"
    )}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function RecentBookings({ bookings }) {
  const navigate = useNavigate();
  const isEmpty = !bookings || bookings.length === 0;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden flex flex-col h-[480px]"
      style={{ background: "hsl(220 18% 7% / 0.9)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(200 100% 55% / 0.1)", border: "1px solid hsl(200 100% 55% / 0.15)" }}
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Bookings</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {bookings?.length || 0} total records
            </p>
          </div>
        </div>
        <Link
          to="/bookings"
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
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">No bookings yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Book a cylinder to see activity here.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border/20">
          {bookings.slice(0, 8).map((booking) => (
            <div
              key={booking.id}
              onClick={() => navigate("/bookings")}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/15 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold font-mono text-foreground truncate">{booking.booking_id}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {CYLINDER_LABELS[booking.cylinder_type]}
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-primary font-semibold">KES {(booking.final_amount || booking.total_amount || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0 ml-4">{moment(booking.created_date).fromNow()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
