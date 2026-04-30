import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  CheckCircle, ChevronRight, Loader2, AlertCircle, Box
} from "lucide-react";
import { generateHash, generateBlockHash, generateBookingId } from "@/lib/blockchain";
import { checkConnection, sendXLM, retrievePublicKey } from "@/lib/freighter";
import { cn } from "@/lib/utils";

const ASSETS = [
    { id: "6kg_refill", label: "6 kg refill", price: 300 },
    { id: "13kg_refill", label: "13 kg refill", price: 700 },
    { id: "50kg_commercial", label: "50 kg commercial", price: 6000 },
];

export default function BookCylinder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cylinder_type: "6kg_refill",
    quantity: 1,
    depot_source: "Central Zone",
    delivery_address: "",
    delivery_date: "",
    time_window: "Morning (8-12)",
    notes: "",
    customer_name: "",
    customer_phone: ""
  });
  const [loading, setLoading] = useState(false);

  const selectedAsset = useMemo(() => ASSETS.find(a => a.id === form.cylinder_type), [form.cylinder_type]);
  const price = selectedAsset?.price || 0;
  const totalAmount = price * form.quantity;
  const deliveryFee = 200;
  const vat = totalAmount * 0.16;
  const finalAmount = totalAmount + deliveryFee + vat;

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const bookingId = generateBookingId();
      const blockHash = generateHash({ bookingId, ...form });

      await base44.entities.Booking.create({
        ...form,
        customer_name: form.customer_name || "Guest Customer", 
        customer_phone: form.customer_phone || "N/A",
        customer_address: form.delivery_address || "N/A",
        booking_id: bookingId,
        total_amount: totalAmount,
        final_amount: finalAmount,
        status: "confirmed",
        block_hash: blockHash,
      });

      await base44.entities.SupplyChainBlock.create({
        block_index: Math.floor(Math.random() * 1000),
        block_hash: generateBlockHash("0x0", { bookingId }),
        previous_hash: "0x0000000000000000",
        timestamp: new Date().toISOString(),
        booking_id: bookingId,
        event_type: "booking_created",
        location: form.depot_source,
        verified_by: "system-node",
        nonce: Math.floor(Math.random() * 100000),
      });

      toast({ title: "Order Confirmed", description: "Successfully logged to the network." });
      navigate("/bookings");
    } catch (err) {
      toast({ title: "Commit Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <Link to="/bookings" className="hover:text-white transition-colors">Orders</Link>
        <ChevronRight size={12} />
        <span className="text-white">New order</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        
        {/* ── Left Column ── */}
        <div className="space-y-6">
          
          {/* Main Form Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            
            {/* Step Wizard Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="space-y-4 w-full">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Customer details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={form.customer_name}
                      onChange={(e) => updateForm("customer_name", e.target.value)}
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+254 --- --- ---"
                      value={form.customer_phone}
                      onChange={(e) => updateForm("customer_phone", e.target.value)}
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cylinder Selection */}
            <div className="space-y-3 mb-8">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Select cylinder type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ASSETS.map(asset => (
                  <div 
                    key={asset.id}
                    onClick={() => updateForm("cylinder_type", asset.id)}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer text-center transition-all",
                      form.cylinder_type === asset.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    <div className="h-10 w-10 mx-auto rounded-md bg-secondary/50 flex items-center justify-center mb-3">
                      <Box size={20} className={form.cylinder_type === asset.id ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <p className="text-xs font-bold text-white mb-0.5">{asset.label}</p>
                    <p className="text-[10px] text-muted-foreground">KES {asset.price.toLocaleString()}/unit</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4 mb-8">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Order details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">Quantity</label>
                  <input 
                    type="number" 
                    value={form.quantity}
                    onChange={(e) => updateForm("quantity", parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">Depot source</label>
                  <select 
                    value={form.depot_source}
                    onChange={(e) => updateForm("depot_source", e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    <option>Central Zone</option>
                    <option>Westlands</option>
                    <option>Industrial Area</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Delivery details</h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground">Delivery address</label>
                <input 
                  type="text" 
                  placeholder="Enter full address..." 
                  value={form.delivery_address}
                  onChange={(e) => updateForm("delivery_address", e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">Delivery date</label>
                  <input 
                    type="date" 
                    value={form.delivery_date}
                    onChange={(e) => updateForm("delivery_date", e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground">Time window</label>
                  <select 
                    value={form.time_window}
                    onChange={(e) => updateForm("time_window", e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    <option>Morning (8-12)</option>
                    <option>Afternoon (12-5)</option>
                    <option>Evening (5-8)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Notes Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Notes & special instructions</h3>
            <textarea 
              rows="3" 
              placeholder="E.g. gate code, contact person, floor number..." 
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div className="space-y-6">
          
          {/* Order Summary */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Order summary</h3>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2 mb-4">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-500/90 leading-tight">Price may vary based on depot stock availability</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{selectedAsset?.label} × {form.quantity}</span>
                <span className="text-white font-mono font-medium">KES {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="text-white font-mono font-medium">KES {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">VAT (16%)</span>
                <span className="text-white font-mono font-medium">KES {vat.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-5 flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Total</span>
              <span className="text-lg font-bold text-primary font-mono">KES {finalAmount.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Confirm order
            </button>
            <button 
              onClick={() => toast({ title: "Draft Saved", description: "Order has been saved to local node cache." })}
              className="w-full h-10 mt-2 bg-transparent border border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-white font-medium text-xs rounded-md transition-colors"
            >
              Save as draft
            </button>
          </div>

          {/* Customer Snapshot */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Customer</h3>
            <p className="text-[10px] text-muted-foreground">{form.delivery_address || 'No address provided'}</p>
          </div>

        </div>

      </div>
    </div>
  );
}

function StepItem({ num, label, status }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
        status === "done" ? "bg-primary text-primary-foreground" : 
        status === "current" ? "bg-primary/20 border-2 border-primary text-primary" : 
        "bg-secondary text-muted-foreground"
      )}>
        {status === "done" ? "✓" : num}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block",
        status === "done" ? "text-muted-foreground" : 
        status === "current" ? "text-white" : 
        "text-muted-foreground/50"
      )}>
        {label}
      </span>
    </div>
  );
}
