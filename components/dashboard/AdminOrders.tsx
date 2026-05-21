import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Order, User } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, StatusPill, Icon } from './DashboardShared';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  users: User[];
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, setOrders, users }) => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Action state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filters logic
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Pagination logic (H-16)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      alert(t('profile_save_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">{t('admin_orders_title')}</h2>
          <p className="text-sm text-gray-300">
            {t('admin_orders_subtitle' as any) || 'View and manage boutique purchases and sewing quotes'}
          </p>
        </div>

        {/* Status Filter (H-17) */}
        <div className="flex gap-2">
          {['all', 'pending', 'pending_quote', 'approved', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1); // Reset page index
              }}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${
                statusFilter === status
                  ? 'bg-brand-gold border-brand-gold text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
              }`}
            >
              {status === 'all' ? t('admin_users_filter_all_roles' as any) || 'All' : t(`status_${status.toLowerCase()}` as any)}
            </button>
          ))}
        </div>
      </div>

      <div className={glassCardClass + " overflow-x-auto mb-6"}>
        <table className="w-full text-start min-w-[700px]">
          <thead className="bg-white/5 text-gray-300 uppercase text-[9px] font-bold tracking-[0.15em] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-start">{t('admin_orders_table_id')}</th>
              <th className="px-6 py-4 text-start">{t('admin_orders_table_customer')}</th>
              <th className="px-6 py-4 text-start">{t('admin_orders_table_price')}</th>
              <th className="px-6 py-4 text-start">{t('admin_orders_table_status')}</th>
              <th className="px-6 py-4 text-start">Date</th>
              <th className="px-6 py-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedOrders.map(order => {
              const customerUser = users.find(u => u.id === order.customerId);
              const isUpdating = updatingOrderId === order.id;

              return (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-gray-300">
                    #{order.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-white">
                    {customerUser ? `${customerUser.firstName} ${customerUser.lastName}` : t('unknown')}
                    <p className="text-[9px] text-gray-400 font-normal">{customerUser?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-brand-gold font-bold">
                    ${order.price ? Number(order.price).toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex justify-end gap-2">
                      {order.status === 'pending_quote' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'approved')}
                            disabled={isUpdating}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold uppercase rounded transition-colors disabled:opacity-50"
                          >
                            Approve Quote
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={isUpdating}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold uppercase rounded transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          disabled={isUpdating}
                          className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold uppercase rounded transition-colors disabled:opacity-50"
                        >
                          Mark Completed
                        </button>
                      )}

                      {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'pending_quote' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={isUpdating}
                          className="px-2.5 py-1 bg-white/10 hover:bg-red-500/20 text-red-400 hover:text-white border border-red-500/20 text-[9px] font-bold uppercase rounded transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-xs">
                  {t('dashboard_no_orders')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (H-16) */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-black/20 border border-white/10 rounded-xl">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
          >
            Previous
          </button>
          <span className="text-xs text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
