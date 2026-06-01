import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { UserRole, Order, PortfolioItem, User } from '../../types';
import { glassCardClass, Icon, MetricCard, StatusPill } from './DashboardShared';

interface ManagerOverviewProps {
  userRole: UserRole;
  authUser: any;
  users: User[];
  orders: Order[];
  portfolioItems: PortfolioItem[];
  adminStats: any;
  setCurrentView: (view: any) => void;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({
  userRole,
  authUser,
  users,
  orders,
  portfolioItems,
  adminStats,
  setCurrentView,
}) => {
  const { t } = useTranslation();

  // If customer or tailor/designer, render customized non-admin overview
  if (userRole !== 'manager') {
    const userOrders = orders.filter(o => o.customerId === authUser?.id);
    const completedOrders = userOrders.filter(o => o.status === 'completed');
    const totalSpent = userOrders.reduce((acc, curr) => acc + (curr.price || 0), 0);

    return (
      <div className="animate-fade-in text-start">
        <div className="mb-10">
          <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">
            {t('dashboard_welcome_user')}, {authUser?.first_name || 'User'}
          </h2>
          <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
          <p className="text-base text-gray-300">
            <span className="text-brand-gold font-bold uppercase tracking-widest text-sm">{t(`signup_form_role_${userRole}` as any)}</span> • {t('dashboard_welcome_message')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard
            title={t('admin_stat_total_orders')}
            value={userOrders.length}
            icon="shopping-bag"
          />
          <MetricCard
            title={t('wallet_current_balance')}
            value={`$${Number(authUser?.balance || 0).toFixed(2)}`}
            icon="credit-card"
          />
          <MetricCard
            title={t('status_completed')}
            value={completedOrders.length}
            icon="check-circle"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className={glassCardClass + " overflow-hidden"}>
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-serif text-xl text-white">{t('dashboard_recent_activity')}</h3>
                <button
                  onClick={() => setCurrentView(userRole === 'customer' ? 'orders' : 'requests')}
                  className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:underline"
                >
                  {t('dashboard_view_all')}
                </button>
              </div>
              <div className="divide-y divide-white/10">
                {userOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold">
                        <Icon name="box" className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">#{order.id.slice(-6)}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                ))}
                {userOrders.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    {t('dashboard_no_orders')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-white/10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
              <h3 className="text-xl font-serif mb-6 relative z-10">{t('dashboard_boutique_ops')}</h3>
              <div className="space-y-2 relative z-10">
                {userRole === 'customer' ? (
                  <>
                    <button
                      onClick={() => setCurrentView('design')}
                      className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
                    >
                      <span className="text-xs font-medium">{t('dashboard_menu_create_design')}</span>
                      <Icon name="palette" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentView('my-designs')}
                      className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
                    >
                      <span className="text-xs font-medium">{t('dashboard_menu_my_designs')}</span>
                      <Icon name="share" className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentView('portfolio')}
                      className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
                    >
                      <span className="text-xs font-medium">{t('dashboard_menu_portfolio')}</span>
                      <Icon name="grid" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentView('requests')}
                      className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
                    >
                      <span className="text-xs font-medium">{t('dashboard_menu_requests')}</span>
                      <Icon name="clipboard" className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manager Admin View
  const totalRevenue = adminStats?.total_revenue ?? orders.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const pendingApprovals = adminStats?.pending_approvals ?? portfolioItems.filter(i => i.status === 'pending').length;

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-10">
        <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">
          {t('dashboard_welcome_user')}, {t('dashboard_admin_access')}
        </h2>
        <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
        <p className="text-base text-gray-300">{t('dashboard_welcome_message')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard
          title={t('admin_stat_total_users')}
          value={adminStats?.total_users ?? users.length}
          icon="users"
          trend="12%"
        />
        <MetricCard
          title={t('admin_stat_total_orders')}
          value={adminStats?.total_orders ?? orders.length}
          icon="shopping-bag"
          trend="5%"
        />
        <MetricCard
          title={t('admin_stat_total_revenue')}
          value={`$${Number(totalRevenue).toFixed(0)}`}
          icon="credit-card"
          trend="20%"
        />
        <MetricCard
          title={t('admin_stat_pending_approvals')}
          value={pendingApprovals}
          icon="check-circle"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={glassCardClass + " overflow-hidden"}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-serif text-xl text-white">{t('dashboard_recent_activity')}</h3>
              <button
                onClick={() => setCurrentView('admin-orders')}
                className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:underline"
              >
                {t('dashboard_view_all')}
              </button>
            </div>
            <div className="divide-y divide-white/10">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold">
                      <Icon name="box" className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">#{order.id.slice(-6)}</p>
                      <p className="text-[11px] text-gray-400 font-normal">
                        {users.find(u => u.id === order.customerId)?.firstName || t('unknown')} •{' '}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={order.status} />
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {t('dashboard_no_orders')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-white/10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <h3 className="text-xl font-serif mb-6 relative z-10">{t('dashboard_boutique_ops')}</h3>
            <div className="space-y-2 relative z-10">
              <button
                onClick={() => setCurrentView('admin-products')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
              >
                <span className="text-xs font-medium">{t('dashboard_menu_admin_products')}</span>
                <Icon name="shopping-bag" className="w-3 h-3" />
              </button>
              <button
                onClick={() => setCurrentView('admin-socials')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start"
              >
                <span className="text-xs font-medium">{t('dashboard_menu_admin_socials')}</span>
                <Icon name="share" className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className={glassCardClass + " p-5 text-start"}>
            <h4 className="font-serif text-lg text-white mb-4">{t('dashboard_approvals_waitlist')}</h4>
            <div className="space-y-4">
              {portfolioItems
                .filter(i => i.status === 'pending')
                .slice(0, 3)
                .map(i => (
                  <div key={i.id} className="flex items-center gap-3">
                    <img
                      src={i.imageUrls[0] || 'https://placehold.co/100x100'}
                      className="w-10 h-10 rounded-lg object-cover"
                      alt=""
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-xs text-white truncate">{t(i.title as any)}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">
                        {t('dashboard_portfolio_request')}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('admin-approvals')}
                      className="text-brand-gold font-bold text-xs hover:underline uppercase tracking-widest"
                    >
                      {t('dashboard_review_action')}
                    </button>
                  </div>
                ))}
              {portfolioItems.filter(i => i.status === 'pending').length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  {t('dashboard_no_pending_approvals' as any) || 'No pending approvals'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
