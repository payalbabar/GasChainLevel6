import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Phone, Clock, MapPin, Truck, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import { CYLINDER_LABELS } from "@/lib/blockchain";

// ── Main Page Component ──

export default function Deliveries() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeBookings, setActiveBookings] = useState([]);

  const loadData = async () => {
    try {
      const bookings = await base44.entities.Booking.list("-created_date", 50);
      const active = bookings.filter(b => b.status !== "delivered" && b.status !== "cancelled");
      setActiveBookings(active);
      
      if (order) {
        const updated = active.find(b => b.id === order.id);
        if (updated) setOrder(updated);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch delivery data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Syncing active deliveries...</p>
      </div>
    );
  }

  if (error || activeBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-semibold text-white">No active deliveries found</p>
        <p className="text-xs text-muted-foreground">There are currently no orders in transit.</p>
        <Link to="/book" className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md transition-colors hover:bg-primary/90">
          Create New Order
        </Link>
      </div>
    );
  }

  const isConfirmed = order && (order.status === "confirmed" || order.status === "delivered");
  const isDelivered = order && order.status === "delivered";

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <span className="text-muted-foreground">Deliveries</span>
        <ChevronRight size={12} />
      </div>
      {/* Top Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Delivery Tracking</h1>
          <p className="text-xs text-muted-foreground mt-1">Select an active order to monitor dispatcher progress.</p>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Delivery</label>
          <select 
            className="h-9 px-3 w-full md:w-[300px] bg-card border border-border rounded-md text-xs text-white focus:border-primary outline-none"
            value={order?.id || ""}
            onChange={(e) => setOrder(activeBookings.find(b => b.id === e.target.value))}
          >
            <option value="" disabled>Select a delivery...</option>
            {activeBookings.map(b => (
              <option key={b.id} value={b.id}>{b.booking_id || b.id.substring(0,8)} — {b.customer_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!order ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border border-dashed rounded-lg bg-card">
          <Truck className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
          <p className="text-sm font-semibold text-white">No Delivery Selected</p>
          <p className="text-xs text-muted-foreground mt-1">Please select an active booking from the dropdown above.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
            <DeliveryMapCard order={order} isConfirmed={isConfirmed} isDelivered={isDelivered} />
            <DeliveryTimeline order={order} isConfirmed={isConfirmed} isDelivered={isDelivered} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <OrderDetailsCard order={order} isConfirmed={isConfirmed} isDelivered={isDelivered} />
          <DriverCard isConfirmed={isConfirmed} />
          <ActionPanel order={order} isDelivered={isDelivered} onActionComplete={loadData} />
        </div>

        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function DeliveryMapCard({ order, isConfirmed, isDelivered }) {
  const displayId = order.booking_id || order.id?.substring(0, 8);
  const customerName = order.customer_name || "Unknown Customer";
  const destination = order.customer_address?.split(',')[0] || "Destination";
  const displayStatus = order.status === "confirmed" ? "In transit" : order.status === "pending" ? "Pending dispatch" : order.status;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4 mb-6">
        <span className="text-sm font-bold text-white">Order {displayId} — {customerName}</span>
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-md border text-[10px] font-bold tracking-wider uppercase transition-colors",
          isDelivered ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
          isConfirmed ? "bg-primary/10 text-primary border-primary/20" : 
          "bg-amber-500/10 text-amber-500 border-amber-500/20"
        )}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {displayStatus}
        </div>
      </div>

      <div className="relative h-32 bg-secondary/30 rounded-lg mb-8 flex items-center justify-center overflow-hidden border border-border/50 group">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="absolute left-[15%] top-[55%] w-[70%] h-0.5 border-t-2 border-dashed border-primary/50" />
        
        <div className="absolute left-[14%] top-[42%] h-4 w-4 rounded-full bg-card border-[3px] border-primary flex items-center justify-center z-10 transition-transform group-hover:scale-110">
          <div className="h-1 w-1 bg-primary rounded-full" />
        </div>
        <div className="absolute left-[12%] top-[65%] text-[10px] text-muted-foreground font-medium">Depot</div>

        <div className="absolute left-[83%] top-[42%] h-4 w-4 rounded-full bg-card border-[3px] border-primary flex items-center justify-center z-10 transition-transform group-hover:scale-110">
          <div className={cn("h-1 w-1 rounded-full transition-colors", isDelivered ? "bg-primary" : "bg-transparent")} />
        </div>
        <div className="absolute left-[81%] top-[65%] text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">{destination}</div>

        {isConfirmed && !isDelivered && (
          <div className="absolute left-[53%] top-[40%] h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-20">
            <Truck size={12} />
          </div>
        )}
        
        {isConfirmed && !isDelivered && (
          <div className="absolute left-[48%] top-[20%] text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">
            Driver en route
          </div>
        )}
      </div>
    </>
  );
}

function DeliveryTimeline({ order, isConfirmed, isDelivered }) {
  const cylinderType = CYLINDER_LABELS[order.cylinder_type] || order.cylinder_type;
  const quantity = order.quantity || 1;

  return (
    <>
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Delivery timeline</h3>
      <div className="pl-6 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-6 before:w-px before:bg-border/50">
        <TimelineItem 
          status="done"
          title="Order confirmed"
          time={`${moment(order.created_date).format("MMM D · hh:mm A")}`}
          desc="Order received and payment verified"
        />
        <TimelineItem 
          status={isConfirmed ? "done" : "todo"}
          title="Dispatched from depot"
          time={isConfirmed ? moment(order.created_date).add(30, 'minutes').format("MMM D · hh:mm A") : "Pending"}
          desc={isConfirmed ? `${quantity} × ${cylinderType} loaded` : null}
        />
        <TimelineItem 
          status={isDelivered ? "done" : isConfirmed ? "current" : "todo"}
          title="In transit"
          time={isConfirmed && !isDelivered ? `Now · ETA ${moment().add(45, 'minutes').format("hh:mm A")}` : isDelivered ? moment(order.created_date).add(1, 'hours').format("MMM D · hh:mm A") : "Pending"}
          desc={isConfirmed && !isDelivered ? "Tracking driver location" : null}
        />
        <TimelineItem 
          status={isDelivered ? "done" : "todo"}
          title="Out for delivery"
          time={isDelivered ? moment(order.created_date).add(1.5, 'hours').format("MMM D · hh:mm A") : "Pending"}
        />
        <TimelineItem 
          status={isDelivered ? "done" : "todo"}
          title="Delivered"
          time={isDelivered ? moment(order.created_date).add(2, 'hours').format("MMM D · hh:mm A") : "Pending"}
          isLast
        />
      </div>
    </>
  );
}

function OrderDetailsCard({ order, isConfirmed, isDelivered }) {
  const displayId = order.booking_id || order.id?.substring(0, 8);
  const cylinderType = CYLINDER_LABELS[order.cylinder_type] || order.cylinder_type;
  const quantity = order.quantity || 1;
  const amount = `KES ${(order.final_amount || order.total_amount || 0).toLocaleString()}`;
  const destination = order.customer_address?.split(',')[0] || "Standard Zone";

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-border/80 transition-colors">
      <h3 className="text-xs font-bold text-white border-b border-border pb-3 mb-3">Order details</h3>
      <div className="space-y-2">
        <DetailRow label="Order ID" value={displayId} valueClass="font-mono text-primary font-bold" />
        <DetailRow label="Customer" value={order.customer_name || "Customer"} />
        <DetailRow label="Item" value={`${quantity} × ${cylinderType}`} />
        <DetailRow label="Amount" value={amount} />
        <DetailRow label="Destination" value={destination} />
        <DetailRow label="ETA" value={isConfirmed && !isDelivered ? moment().add(45, 'minutes').format("hh:mm A") : "--"} valueClass="text-primary font-bold" />
      </div>
    </div>
  );
}

function DriverCard({ isConfirmed }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-border/80 transition-colors">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Assigned driver</h3>
      <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", isConfirmed ? "bg-secondary/30 border-border/50" : "bg-background border-border opacity-50 grayscale")}>
        <div className="h-8 w-8 rounded-md bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">JO</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{isConfirmed ? "John Otieno" : "Awaiting assignment"}</p>
          <p className="text-[10px] text-muted-foreground truncate">KCA 421B · Toyota Hilux</p>
        </div>
        <button disabled={!isConfirmed} className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1">
          <Phone size={10} /> Call
        </button>
      </div>
    </div>
  );
}

function ActionPanel({ order, isDelivered, onActionComplete }) {
  const [updating, setUpdating] = useState(false);

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await base44.entities.Booking.update(order.id, { status: 'cancelled' });
      if(onActionComplete) onActionComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-border/80 transition-colors">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Actions</h3>
      <div className="space-y-2">
        <button 
          disabled={isDelivered} 
          className="w-full h-9 bg-transparent border border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          Reschedule delivery
        </button>
        <button 
          disabled={isDelivered || order.status === 'cancelled' || updating} 
          onClick={handleCancel}
          className="w-full h-9 bg-transparent border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {updating ? <Loader2 size={12} className="animate-spin mx-auto" /> : (order.status === 'cancelled' ? "Order Cancelled" : "Cancel order")}
        </button>
      </div>
    </div>
  );
}

// ── Shared UI Elements ──

function DetailRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0 hover:bg-secondary/10 px-1 -mx-1 rounded transition-colors">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs text-white text-right", valueClass)}>{value}</span>
    </div>
  );
}

function TimelineItem({ status, title, time, desc, isLast }) {
  return (
    <div className="relative group">
      <div className={cn(
        "absolute left-[-29px] top-1 h-2.5 w-2.5 rounded-full z-10 transition-colors",
        status === "done" ? "bg-primary ring-4 ring-card" : 
        status === "current" ? "bg-primary border-[3px] border-card ring-2 ring-primary" : 
        "bg-secondary border border-border group-hover:border-muted-foreground"
      )} />
      <div className="space-y-1">
        <p className={cn("text-xs font-bold transition-colors", status === "todo" ? "text-muted-foreground/70 font-normal group-hover:text-muted-foreground" : "text-white")}>{title}</p>
        <p className={cn("text-[10px]", status === "todo" ? "text-muted-foreground/50" : "text-muted-foreground")}>{time}</p>
        {desc && <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 max-w-sm">{desc}</p>}
      </div>
      {isLast && <div className="absolute left-[-24px] top-2 bottom-[-24px] w-4 bg-card" />}
    </div>
  );
}
