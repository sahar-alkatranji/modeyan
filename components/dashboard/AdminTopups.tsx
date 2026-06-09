import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { api } from '../../services/api';
import { glassCardClass } from './DashboardShared';

// #2: Admin panel to review/approve pending wallet top-up requests.
export const AdminTopups: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getPendingTopups()); } catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const act = async (id: number, approve: boolean) => {
    setBusyId(id);
    try {
      await api.approveTopup(id, approve);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) { alert(e.message || 'Failed to process top-up'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-white mb-1">{t('admin_topups_title' as any) || 'Pending Top-ups'}</h2>
        <p className="text-sm text-gray-300">{t('admin_topups_subtitle' as any) || 'Review and approve wallet top-up requests.'}</p>
      </div>
      <div className={glassCardClass + ' overflow-x-auto'}>
        <table className="w-full text-start min-w-0 sm:min-w-[640px]">
          <thead className="bg-white/5 text-gray-200 uppercase text-xs font-bold tracking-[0.15em] border-b border-white/10">
            <tr>
              <th className="px-6 py-4">{t('admin_topups_user' as any) || 'User'}</th>
              <th className="px-6 py-4">{t('admin_topups_amount' as any) || 'Amount'}</th>
              <th className="px-6 py-4">{t('admin_topups_method' as any) || 'Method'}</th>
              <th className="px-6 py-4">{t('admin_topups_receipt' as any) || 'Receipt'}</th>
              <th className="px-6 py-4 text-end">{t('admin_orders_table_actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-bold">{it.user_name}</td>
                <td className="px-6 py-4 text-sm text-brand-gold font-bold">${Number(it.amount).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{it.payment_method}</td>
                <td className="px-6 py-4 text-sm">
                  {it.receipt_url
                    ? <a href={it.receipt_url} target="_blank" rel="noreferrer" className="text-blue-300 underline">{t('admin_topups_view_receipt' as any) || 'View'}</a>
                    : <span className="text-gray-500">—</span>}
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="flex justify-end gap-2">
                    <button disabled={busyId === it.id} onClick={() => act(it.id, true)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase rounded-lg disabled:opacity-50">{t('admin_topups_approve' as any) || 'Approve'}</button>
                    <button disabled={busyId === it.id} onClick={() => act(it.id, false)} className="px-3 py-1.5 bg-white/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold uppercase rounded-lg disabled:opacity-50">{t('admin_topups_reject' as any) || 'Reject'}</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs">{t('admin_topups_empty' as any) || 'No pending top-ups.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
