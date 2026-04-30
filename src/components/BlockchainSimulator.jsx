import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateHash, generateBlockHash, generateBookingId } from "@/lib/blockchain";
import { Terminal } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CUSTOMERS = ["Amit Sharma", "Priya Patel", "Vikram Singh", "Anjali Gupta", "Rahul Verma"];
const TYPES = ["14.2kg_domestic", "19kg_commercial", "5kg_portable"];
const LOCATIONS = ["Central Warehouse", "Regional Depot", "Transit Hub", "Distribution Point"];

export default function BlockchainSimulator() {
  const [isActive, setIsActive] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      const type = Math.random() > 0.3 ? 'booking' : 'status_update';
      
      if (type === 'booking') {
        const id = generateBookingId();
        const hash = generateHash({ id });
        const name = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
        const cylinder = TYPES[Math.floor(Math.random() * TYPES.length)];
        
        await base44.entities.Booking.create({
          booking_id: id,
          customer_name: name,
          customer_phone: "98" + Math.floor(Math.random() * 100000000),
          customer_address: "Sector " + Math.floor(Math.random() * 100) + ", New Delhi",
          cylinder_type: cylinder,
          quantity: 1,
          status: 'pending',
          payment_method: 'online',
          total_amount: 900,
          final_amount: 700,
          block_hash: hash,
        });

        await base44.entities.SupplyChainBlock.create({
          block_index: 1,
          block_hash: hash,
          previous_hash: '0x0000000000000000',
          timestamp: new Date().toISOString(),
          booking_id: id,
          event_type: 'booking_created',
          event_data: JSON.stringify({ customer: name }),
          location: 'Enterprise Origin',
          verified_by: 'Consensus Network',
        });

        setLastEvent(`INIT: ${id}`);
        toast({ title: "Mainnet Event", description: `Transaction ${id} anchored.` });
      } else {
        const bookings = await base44.entities.Booking.list("-created_date", 50);
        
        const eligible = bookings.filter(b => ['pending', 'confirmed', 'dispatched', 'in_transit'].includes(b.status));
        
        if (eligible.length > 0) {
          const b = eligible[Math.floor(Math.random() * eligible.length)];
          let nextStatus, eventType, eventLabel, location;

          if (b.status === 'pending') {
            nextStatus = 'confirmed';
            eventType = 'cylinder_assigned';
            eventLabel = 'Cylinder Assigned';
            location = 'LPG Depot';
          } else if (b.status === 'confirmed') {
            nextStatus = 'dispatched';
            eventType = 'dispatched';
            eventLabel = 'Dispatched from Warehouse';
            location = 'Global Transit Node';
          } else if (b.status === 'dispatched') {
            nextStatus = 'in_transit';
            eventType = 'in_transit';
            eventLabel = 'In Transit';
            location = 'Zone Authorization';
          } else if (b.status === 'in_transit') {
            nextStatus = 'delivered';
            eventType = 'delivered';
            eventLabel = 'Delivered to Consumer';
            location = b.customer_address || 'End User Premise';
          }

          const prevHash = b.block_hash;
          const newHash = generateBlockHash(prevHash, { status: nextStatus, event: eventType });
          const existingBlocks = await base44.entities.SupplyChainBlock.filter({ booking_id: b.booking_id });

          await base44.entities.Booking.update(b.id, { status: nextStatus, block_hash: newHash });
          await base44.entities.SupplyChainBlock.create({
            block_index: existingBlocks.length + 1,
            block_hash: newHash,
            previous_hash: prevHash,
            timestamp: new Date().toISOString(),
            booking_id: b.booking_id,
            event_type: eventType,
            event_data: JSON.stringify({ status: nextStatus, remarks: "Automated state transition" }),
            location: location,
            verified_by: 'Validator Node ' + Math.floor(Math.random() * 99),
          });

          setLastEvent(`SYNC: ${b.booking_id} → ${nextStatus.toUpperCase()}`);
          toast({ title: "Ledger Update", description: `State mutation committed for ${b.booking_id}` });
        }
      }
    }, 8000); 

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-center gap-4 p-3 rounded-lg border transition-colors duration-700 backdrop-blur-3xl 
        ${isActive ? 'bg-black/80 border-primary/40' : 'bg-black/60 border-white/10'}`}>
        
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center border transition-colors duration-500
            ${isActive ? 'bg-primary border-primary/20 text-white' : 'bg-white/5 border-white/5 text-slate-500'}
        `}>
          <Terminal className="h-5 w-5" />
        </div>
        
        <div className="pr-4 border-r border-white/5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Automated Indexer</p>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <p className="text-xs font-bold text-white font-mono tracking-tight max-w-[150px] truncate">
                {isActive ? (lastEvent || 'LISTENING TO NETWORK...') : 'NODE IDLE'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2.5 rounded-lg font-black tracking-widest text-[9px] uppercase transition-colors duration-300
            ${isActive 
                ? 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5' 
                : 'bg-primary text-white hover:bg-primary/90'}
          `}
        >
          {isActive ? 'HALT DAEMON' : 'SPIN UP NODE'}
        </button>
      </div>
    </div>
  );
}
