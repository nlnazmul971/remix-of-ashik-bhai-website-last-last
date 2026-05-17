import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDeliveryZones, useUpdateDeliveryZone } from '@/hooks/useSupabase';

const AdminDeliveryCharge = () => {
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones(true);
  const updateZone = useUpdateDeliveryZone();
  const [zoneEdits, setZoneEdits] = useState<Record<string, { fee: number }>>({});

  useEffect(() => {
    setZoneEdits(prev => {
      const next = { ...prev };
      for (const z of zones) {
        if (!next[z.id]) next[z.id] = { fee: z.fee };
      }
      return next;
    });
  }, [zones]);

  const handleSaveZone = async (zoneId: string) => {
    const edit = zoneEdits[zoneId];
    if (!edit) return;
    try {
      await updateZone.mutateAsync({ id: zoneId, fee: edit.fee });
      toast.success('Delivery charge updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update delivery charge');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border border-border p-6 space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Delivery Charge
          </h3>
          <p className="text-xs text-muted-foreground">Checkout page এ যে delivery fee দেখায়, এখানে থেকে আপডেট হবে।</p>
        </div>

        {zonesLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading delivery charges...
          </div>
        ) : zones.length === 0 ? (
          <p className="border border-border p-4 text-sm text-muted-foreground">No delivery charge zones found.</p>
        ) : (
          <div className="space-y-4">
            {zones.map(z => {
              const edit = zoneEdits[z.id] || { fee: z.fee };
              return (
                <div key={z.id} className="border border-border p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-foreground">{z.name}</p>
                      {z.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{z.description}</p>}
                    </div>
                    <button
                      onClick={() => handleSaveZone(z.id)}
                      disabled={updateZone.isPending}
                      className="luxury-button-primary inline-flex h-11 w-full sm:w-36 shrink-0 items-center justify-center gap-2 text-[10px]"
                    >
                      {updateZone.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Delivery Fee (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      value={edit.fee}
                      onChange={e => setZoneEdits(prev => ({ ...prev, [z.id]: { fee: Number(e.target.value) } }))}
                      className="luxury-input"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeliveryCharge;
