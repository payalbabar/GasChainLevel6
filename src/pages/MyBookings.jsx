import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, ChevronRight, MapPin, Clock, Box, Zap, Loader2, ArrowLeft } from "lucide-react";
import { CYLINDER_LABELS } from "@/lib/blockchain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import moment from "moment";
import BookingDetail from "../components/BookingDetail";

const STATUS_STYLE = {
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending:   "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await base44.entities.Booking.list("-created_date", 50);
      setBookings(data);
      if (selected) {
        const upd = data.find(b => b.id === selected.id);
        if (upd) setSelected(upd);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [selected?.id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading orders…</p>
    </div>
  );

  if (selected) return <BookingDetail booking={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Order History</h1>
          <p className="text-xs text-muted-foreground">Lifecycle of your energy allocations — tracked on-chain.</p>
        </div>
        <Link to="/book">
          <Button size="sm" className="bg-primary text-primary-foreground font-bold rounded-md">
            <Zap className="mr-2 h-4 w-4" /> New Booking
          </Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 rounded-lg border border-border bg-card">
          <div className="h-16 w-16 rounded-lg bg-secondary/30 flex items-center justify-center mb-4">
            <ClipboardList className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">No orders yet</p>
          <p className="text-xs text-muted-foreground mb-6">Book a cylinder to start tracking your supply chain.</p>
          <Link to="/book">
            <Button variant="outline" size="sm" className="border-border/60 hover:border-primary/40 text-xs">
              Create First Booking
            </Button>
          </Link>
        </div>
      ) : (
        <div className="data-table-container">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 px-4 py-2.5 border-b border-border bg-secondary/20">
            {["Order ID","Type","Customer","Amount","Status","Time",""].map(h=>(
              <div key={h} className={cn("text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
                h===""?"col-span-1":h==="Order ID"?"col-span-3":h==="Customer"?"col-span-2":h==="Type"?"col-span-2":h==="Amount"?"col-span-2":h==="Status"?"col-span-1":"col-span-1"
              )}>{h}</div>
            ))}
          </div>

          <div className="divide-y divide-border/50 bg-card">
            {bookings.map(b => (
              <div key={b.id}
                className="flex md:grid md:grid-cols-12 items-center px-4 py-2.5 hover:bg-[#1F2937]/30 transition-colors duration-150 cursor-pointer group gap-3 md:gap-0"
              >
                {/* Icon + ID */}
                <div className="flex items-center gap-3 col-span-3 min-w-0">
                  <div className={cn("h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                    b.status==="delivered"?"bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20":
                    b.status==="pending"  ?"bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20":
                    "bg-primary/10 text-primary group-hover:bg-primary/20"
                  )}>
                    <Box className="h-4 w-4"/>
                  </div>
                  <span className="text-sm font-mono font-bold text-white truncate">{b.booking_id}</span>
                </div>
                {/* Type */}
                <div className="col-span-2 hidden md:block">
                  <span className="text-xs font-medium text-muted-foreground">{CYLINDER_LABELS[b.cylinder_type] || b.cylinder_type}</span>
                </div>
                {/* Customer */}
                <div className="col-span-2 hidden md:block">
                  <p className="text-xs font-semibold text-white truncate">{b.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3"/>{b.customer_address?.split(",")[0]}
                  </p>
                </div>
                {/* Amount */}
                <div className="col-span-2">
                  <p className="text-sm font-bold font-mono text-primary">₹{(b.final_amount||b.total_amount||0).toLocaleString()}</p>
                </div>
                {/* Status */}
                <div className="col-span-1 hidden md:block">
                  <span className={cn("badge",STATUS_STYLE[b.status]||"bg-muted/10 text-muted-foreground border-border/20")}>
                    {b.status?.replace(/_/g," ")}
                  </span>
                </div>
                {/* Time */}
                <div className="col-span-1 hidden md:flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <Clock className="h-3 w-3"/>{moment(b.created_date).fromNow()}
                </div>
                {/* Arrow */}
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
