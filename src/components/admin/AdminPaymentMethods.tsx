import { useEffect, useMemo, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckoutPaymentSettings, useUpsertCheckoutPaymentSetting } from '@/hooks/useSupabase';

const AdminPaymentMethods = () => {
  const { data: paymentSettings = [], isLoading: paymentLoading } = useCheckoutPaymentSettings();
  const upsertPayment = useUpsertCheckoutPaymentSetting();
  const [paymentEdits, setPaymentEdits] = useState<Record<string, { number: string; instructions: string; is_active: boolean }>>({});

  const paymentByProvider = useMemo(() => {
    const map: Record<string, (typeof paymentSettings)[number]> = {};
    for (const s of paymentSettings) map[s.provider] = s;
    return map;
  }, [paymentSettings]);

  useEffect(() => {
    setPaymentEdits(prev => {
      const next = { ...prev };
      for (const s of paymentSettings) {
        if (!next[s.provider]) next[s.provider] = { number: s.number || '', instructions: s.instructions || '', is_active: s.is_active };
      }
      return next;
    });
  }, [paymentSettings]);

  const handleSavePayment = async (provider: string) => {
    const edit = paymentEdits[provider];
    if (!edit) return;
    try {
      await upsertPayment.mutateAsync({ provider, ...edit });
      toast.success('Payment settings updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment settings');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border border-border p-6 space-y-4">
        <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Online Payment (bKash / Nagad)
        </h3>
        <p className="text-xs text-muted-foreground">Checkout এ number + instruction এখান থেকে পরিবর্তন হবে।</p>

        {paymentLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payment settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['bkash', 'nagad'] as const).map(provider => {
              const existing = paymentByProvider[provider];
              const edit = paymentEdits[provider] || {
                number: existing?.number || '',
                instructions: existing?.instructions || '',
                is_active: existing?.is_active ?? true,
              };

              return (
                <div key={provider} className="border border-border p-4 space-y-3 bg-muted/10">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{provider === 'bkash' ? 'bKash' : 'Nagad'}</p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={edit.is_active}
                          onChange={e => setPaymentEdits(prev => ({ ...prev, [provider]: { ...edit, is_active: e.target.checked } }))}
                        />
                        Active
                      </label>
                      <button
                        onClick={() => handleSavePayment(provider)}
                        disabled={upsertPayment.isPending}
                        className="luxury-button-primary inline-flex items-center gap-2 text-[10px]"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Number</label>
                    <input
                      value={edit.number}
                      onChange={e => setPaymentEdits(prev => ({ ...prev, [provider]: { ...edit, number: e.target.value } }))}
                      className="luxury-input"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Instruction</label>
                    <textarea
                      value={edit.instructions}
                      onChange={e => setPaymentEdits(prev => ({ ...prev, [provider]: { ...edit, instructions: e.target.value } }))}
                      className="luxury-input min-h-[90px]"
                      placeholder="Payment করার পর sender number + transaction ID দিন..."
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

export default AdminPaymentMethods;
