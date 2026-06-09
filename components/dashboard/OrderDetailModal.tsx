import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { UserRole } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, glassButtonClass, StatusPill } from './DashboardShared';

interface OrderDetailModalProps {
  orderId: string | number;
  role: UserRole;
  currentUserId?: string;
  onClose: () => void;
  onChanged?: () => void;
}

// Order states from which a cancel is allowed (mirrors backend ALLOWED_TRANSITIONS)
const CANCELLABLE = ['pending_quote', 'quote_submitted', 'quote_accepted', 'disputed'];
const MEASURE_FIELDS = ['bust', 'waist', 'hips', 'shoulder_width', 'dress_length', 'sleeve_length', 'neck_circumference'];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, role, currentUserId, onClose, onChanged }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDays, setQuoteDays] = useState('');
  const [quoteMsg, setQuoteMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await api.getOrderDetail(Number(orderId)));
    } catch (e: any) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orderId]);

  const afterChange = async () => { await load(); onChanged?.(); };

  const submitQuote = async () => {
    const price = parseFloat(quotePrice);
    if (!price || price <= 0) { alert(t('quote_invalid_price' as any) || 'Please enter a valid price.'); return; }
    setBusy(true);
    try {
      await api.submitQuote({
        order_id: Number(orderId),
        price,
        estimated_days: quoteDays ? parseInt(quoteDays, 10) : undefined,
        message: quoteMsg || undefined,
      });
      setQuotePrice(''); setQuoteDays(''); setQuoteMsg('');
      alert(t('quote_submitted_success' as any) || 'Quote submitted.');
      await afterChange();
    } catch (e: any) { alert(e.message || 'Failed to submit quote'); }
    finally { setBusy(false); }
  };

  const respond = async (quoteId: number, accept: boolean) => {
    setBusy(true);
    try {
      await api.respondToQuote(quoteId, accept);
      alert(accept ? (t('quote_accepted_success' as any) || 'Quote accepted.') : (t('quote_rejected_success' as any) || 'Quote rejected.'));
      await afterChange();
    } catch (e: any) { alert(e.message || 'Failed to respond to quote'); }
    finally { setBusy(false); }
  };

  const cancelOrder = async () => {
    if (!window.confirm(t('order_cancel_confirm' as any) || 'Cancel this order?')) return;
    setBusy(true);
    try {
      await api.cancelOrder(Number(orderId));
      alert(t('order_cancelled_success' as any) || 'Order cancelled.');
      onChanged?.();
      onClose();
    } catch (e: any) { alert(e.message || 'Failed to cancel order'); }
    finally { setBusy(false); }
  };

  const status: string = detail?.status;
  const isOwner = !!currentUserId && !!detail && String(detail.customer_id) === String(currentUserId);
  const myQuoteExists = detail?.quotes?.some((q: any) => String(q.tailor_id) === String(currentUserId));
  const canSubmitQuote = (role === 'tailor' || role === 'manager') && status === 'pending_quote' && !myQuoteExists;
  const canRespondQuotes = (isOwner || role === 'manager') && status === 'quote_submitted';
  const canCancel = (isOwner || role === 'manager') && CANCELLABLE.includes(status);

  return (
    <div className="fixed inset-0 z-[150] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className={glassCardClass + ' p-6 sm:p-8 max-w-2xl w-full my-8 text-start'} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-white">{(t('order_detail_title' as any) || 'Order Details')} #{String(orderId).slice(-6)}</h3>
            {status && <div className="mt-2"><StatusPill status={status} /></div>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading && <div className="py-12 text-center text-gray-400">{t('loading' as any) || 'Loading…'}</div>}
        {error && <div className="py-4 text-red-400 text-sm">{error}</div>}

        {detail && !loading && (
          <div className="space-y-6">
            {/* Design / parts */}
            <div className="grid sm:grid-cols-[120px_1fr] gap-4">
              {detail.design_image && (
                <img src={detail.design_image} alt="" className="w-full sm:w-[120px] h-[140px] object-cover rounded-xl border border-white/10" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
              )}
              <div className="space-y-2">
                {detail.design_name && <p className="text-white font-bold">{detail.design_name}</p>}
                <p className="text-sm text-gray-300">{(t('order_detail_type' as any) || 'Type')}: {detail.design_type}</p>
                {detail.total_price != null && <p className="text-sm text-brand-gold font-bold">${Number(detail.total_price).toFixed(2)}</p>}
                {detail.notes && <p className="text-sm text-gray-400">{detail.notes}</p>}
                {detail.selected_parts && Object.keys(detail.selected_parts).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(detail.selected_parts).map(([k, v]: [string, any]) => (
                      <span key={k} className="text-[10px] uppercase tracking-wide bg-white/10 text-gray-200 px-2 py-1 rounded-md">
                        {k.replace(/_/g, ' ')}: {v && typeof v === 'object' ? (v.name || '') : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Measurements */}
            {detail.measurements?.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase tracking-widest text-brand-gold font-bold mb-2">{t('order_detail_measurements' as any) || 'Measurements'}</p>
                {detail.measurements.map((m: any) => (
                  <div key={m.id} className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-300">
                    {MEASURE_FIELDS.map(f => m[f] != null && (
                      <span key={f}>{f.replace(/_/g, ' ')}: <b className="text-white">{m[f]}</b></span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Quotes */}
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-gold font-bold mb-3">{t('order_detail_quotes' as any) || 'Quotes'}</p>
              {(!detail.quotes || detail.quotes.length === 0) && (
                <p className="text-sm text-gray-400">{t('order_detail_no_quotes' as any) || 'No quotes yet.'}</p>
              )}
              <div className="space-y-3">
                {detail.quotes?.map((q: any) => (
                  <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-bold">{q.tailor_name || ('#' + q.tailor_id)}</p>
                        <p className="text-brand-gold font-bold">${Number(q.price).toFixed(2)}{q.estimated_days ? ` · ${q.estimated_days} ${t('quote_days' as any) || 'days'}` : ''}</p>
                        {q.message && <p className="text-sm text-gray-400 mt-1">{q.message}</p>}
                      </div>
                      <div className="text-end flex-shrink-0">
                        {q.is_accepted && <span className="text-green-400 text-xs font-bold uppercase">{t('quote_accepted' as any) || 'Accepted'}</span>}
                        {q.is_rejected && <span className="text-red-400 text-xs font-bold uppercase">{t('quote_rejected' as any) || 'Rejected'}</span>}
                      </div>
                    </div>
                    {canRespondQuotes && !q.is_accepted && !q.is_rejected && (
                      <div className="flex gap-2 mt-3">
                        <button disabled={busy} onClick={() => respond(q.id, true)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase rounded-lg disabled:opacity-50">{t('quote_accept' as any) || 'Accept'}</button>
                        <button disabled={busy} onClick={() => respond(q.id, false)} className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold uppercase rounded-lg disabled:opacity-50">{t('quote_reject' as any) || 'Reject'}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tailor: submit a quote */}
            {canSubmitQuote && (
              <div className="p-4 rounded-xl bg-white/5 border border-brand-gold/20">
                <p className="text-xs uppercase tracking-widest text-brand-gold font-bold mb-3">{t('quote_submit_title' as any) || 'Submit a Quote'}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input type="number" min="0" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} placeholder={t('quote_price' as any) || 'Price ($)'} className={glassInputClass} />
                  <input type="number" min="0" value={quoteDays} onChange={e => setQuoteDays(e.target.value)} placeholder={t('quote_estimated_days' as any) || 'Estimated days'} className={glassInputClass} />
                </div>
                <textarea value={quoteMsg} onChange={e => setQuoteMsg(e.target.value)} placeholder={t('quote_message' as any) || 'Message (optional)'} rows={2} className={glassInputClass + ' mt-3 resize-none'} />
                <button disabled={busy} onClick={submitQuote} className={glassButtonClass + ' mt-3'}>{t('quote_submit_button' as any) || 'Submit Quote'}</button>
              </div>
            )}

            {/* Cancel */}
            {canCancel && (
              <div className="pt-2 border-t border-white/10">
                <button disabled={busy} onClick={cancelOrder} className="px-5 py-2.5 bg-white/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold uppercase rounded-lg disabled:opacity-50">{t('order_cancel_button' as any) || 'Cancel Order'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
