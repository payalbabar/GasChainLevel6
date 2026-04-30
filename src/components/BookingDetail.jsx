import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Database, MapPin, Clock, Loader2, Terminal, Link2, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_LABELS, generateBlockHash } from "@/lib/blockchain";
import { cn } from "@/lib/utils";
import moment from "moment";
import { toast } from "@/hooks/use-toast";

const STATUS_FLOW = ["pending", "confirmed", "dispatched", "in_transit", "delivered"];

export default function BookingDetail({ booking, onBack }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    async function load() {
      const data = await base44.entities.SupplyChainBlock.filter(
        { booking_id: booking.booking_id },
        "created_date",
        50
      );
      setBlocks(data);
      setLoading(false);
    }
    load();
  }, [booking.booking_id]);

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdating(true);

    try {
        await base44.entities.Booking.update(booking.id, { status: newStatus });

        const maxIndex = blocks.reduce((max, b) => Math.max(max, b.block_index || 0), 0);
        const lastBlock = blocks.find(b => b.block_index === maxIndex) || blocks[0];
        const prevHash = lastBlock?.block_hash || "0x0000000000000000";
        const newHash = generateBlockHash(prevHash, { booking_id: booking.booking_id, event: newStatus });

        const eventMap = {
          confirmed: "cylinder_assigned",
          dispatched: "dispatched",
          in_transit: "in_transit",
          delivered: "delivered",
        };

        await base44.entities.SupplyChainBlock.create({
          block_index: maxIndex + 1,
          block_hash: newHash,
          previous_hash: prevHash,
          timestamp: new Date().toISOString(),
          booking_id: booking.booking_id,
          event_type: eventMap[newStatus] || newStatus,
          event_data: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() }),
          location: newStatus === "delivered" ? booking.customer_address : "Distribution Network",
          verified_by: "unknown-node",
          nonce: Math.floor(Math.random() * 100000),
        });

        const updatedBlocks = await base44.entities.SupplyChainBlock.filter(
          { booking_id: booking.booking_id },
          "created_date",
          50
        );
        setBlocks(updatedBlocks);
        toast({ title: "Status Updated", description: "New state committed to blockchain." });
    } catch (err) {
        toast({ title: "Update Failed", description: "Failed to broadcast state update.", variant: "destructive" });
    } finally {
        setUpdating(false);
        setNewStatus("");
    }
  }

  const currentIdx = STATUS_FLOW.indexOf(booking.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-8 pb-16">
      
      {/* Back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Audit Active
        </div>
      </div>

      {/* Main Order Card */}
      <div className="rounded-lg border border-border bg-card">        
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Contract ID</p>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold font-mono">{booking.booking_id}</h1>
                                <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-medium uppercase",
                                    booking.status === 'delivered' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                                )}>
                                    {booking.status?.replace("_", " ")}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                            <p className="text-sm font-medium">{booking.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Delivery Address</p>
                            <p className="text-xs text-muted-foreground max-w-[200px]">{booking.customer_address}</p>
                        </div>
                    </div>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-3xl font-semibold">KES {(booking.final_amount || 0).toLocaleString()}</p>
                    {booking.subsidy_applied > 0 && (
                        <div className="inline-flex items-center gap-1 mt-1 text-xs text-success">
                            <CheckCircle2 className="h-3 w-3" /> Subsidy Applied
                        </div>
                    )}
                </div>
            </div>

            {/* Lifecycle Progress */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">Lifecycle</p>
                    <p className="text-xs text-muted-foreground">Step {currentIdx + 1} of {STATUS_FLOW.length}</p>
                </div>
                <div className="flex items-center gap-2">
                {STATUS_FLOW.map((status, i) => (
                    <div key={status} className="flex-1 space-y-2">
                        <div className={cn(
                            "h-1.5 w-full rounded-md transition-colors duration-150",
                            i <= currentIdx ? "bg-primary" : "bg-muted"
                        )} />
                        <span className={cn(
                            "text-[10px] font-medium capitalize block text-center",
                            i <= currentIdx ? "text-primary" : "text-muted-foreground"
                        )}>
                            {status.replace("_", " ")}
                        </span>
                    </div>
                ))}
                </div>
            </div>
        </div>
      </div>

      {/* Status Update */}
      {booking.status !== "delivered" && booking.status !== "cancelled" && (
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                   <h3 className="text-sm font-semibold">Update Status</h3>
                   <p className="text-xs text-muted-foreground">Broadcast a state transition to the network.</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted/50 border-border">
                    <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.filter((_, i) => i > currentIdx).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                        {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStatusUpdate} disabled={!newStatus || updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                {updating ? "Processing..." : "Commit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-success/10 text-success flex items-center justify-center">
                <Link2 className="h-4 w-4" />
            </div>
            <div>
                <h2 className="text-sm font-semibold">Audit Trail</h2>
                <p className="text-xs text-muted-foreground">{blocks.length} blocks indexed</p>
            </div>
          </div>
        </div>

        <div className="p-6">
            {loading ? (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            ) : blocks.length === 0 ? (
            <div className="text-center py-12">
                <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No blocks recorded yet</p>
            </div>
            ) : (
            <div className="relative pl-8">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-6">
                {blocks.map((block, idx) => (
                    <div key={block.id} className="relative flex gap-4">
                    {/* Dot */}
                    <div className={cn(
                        "absolute left-[-24px] top-1 h-5 w-5 rounded-md flex items-center justify-center z-10 border-2",
                        idx === 0 ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
                    )}>
                        <span className="text-[8px] font-bold">{block.block_index}</span>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {EVENT_LABELS[block.event_type] || block.event_type?.replace(/_/g, " ")}
                                </span>
                                {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">Latest</span>}
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {moment(block.created_date).format("DD MMM, HH:mm")}
                            </span>
                        </div>

                        {block.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" /> {block.location}
                        </p>
                        )}

                        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Verified By</p>
                                    <p className="text-xs font-medium">{block.verified_by || "unknown-node"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Hash</p>
                                    <p className="text-xs font-mono text-muted-foreground truncate">{block.block_hash}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-success" />
                                    <p className="text-[10px] text-muted-foreground">Validated</p>
                                </div>
                                <p className="text-[10px] font-mono text-muted-foreground">Nonce: {block.nonce || "000000"}</p>
                            </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
