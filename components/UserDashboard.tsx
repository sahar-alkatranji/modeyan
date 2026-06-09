import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole, DressPart, SavedDesign, Order, Product, User, SocialLink } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

// Decomposed Component Imports
import { glassCardClass, glassInputClass, glassButtonClass, Icon, StatusPill } from './dashboard/DashboardShared';
import { DesignStudio } from './dashboard/DesignStudio';
import { MyDesigns } from './dashboard/MyDesigns';
import { ManagerOverview } from './dashboard/ManagerOverview';
import { AdminUsers } from './dashboard/AdminUsers';
import { AdminPayments } from './dashboard/AdminPayments';
import { AdminProducts } from './dashboard/AdminProducts';
import { AdminSocials } from './dashboard/AdminSocials';
import { AdminOrders } from './dashboard/AdminOrders';
import { ProfessionalPortfolio } from './dashboard/ProfessionalPortfolio';
import { AdminDesignAssets } from './dashboard/AdminDesignAssets';
import { OrderDetailModal } from './dashboard/OrderDetailModal';
import { AdminTopups } from './dashboard/AdminTopups';
import AdminSettings from './dashboard/AdminSettings';
import { SupportChat } from './dashboard/SupportChat';
import { OrderChat } from './dashboard/OrderChat';

const ROLE_IMAGES = {
  customer: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
  designer: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop',
  tailor: 'https://images.unsplash.com/photo-1550920430-b3b4f624d783?q=80&w=2070&auto=format&fit=crop',
  manager: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
  default: 'https://i.pinimg.com/1200x/6a/8a/d1/6a8ad1d51775ca4922490cc273a4cd01.jpg'
};

interface UserDashboardProps {
  onNavigate: (page: 'home') => void;
  userRole: UserRole;
  savedDesigns: SavedDesign[];
  setSavedDesigns: React.Dispatch<React.SetStateAction<SavedDesign[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onAddToCart: (product: Product, size: string) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  socialLinks: SocialLink[];
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
  dressParts: DressPart[];
  setDressParts: React.Dispatch<React.SetStateAction<DressPart[]>>;
  onLogout: () => void;
}

type DashboardView = 'overview' | 'design' | 'my-designs' | 'orders' | 'profile' | 'wallet' | 'portfolio' | 'requests' | 'support-chat' | 'admin-approvals' | 'admin-products' | 'admin-users' | 'admin-payments' | 'admin-socials' | 'admin-design-assets' | 'admin-orders' | 'admin-topups' | 'admin-settings' | 'admin-support';

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onNavigate, userRole, orders, setOrders, users, setUsers, products, setProducts, socialLinks, setSocialLinks, dressParts, setDressParts, setSavedDesigns, savedDesigns, onLogout
}) => {
  const { t } = useTranslation();
  const { user: authUser, refreshUser } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [walletBalance, setWalletBalance] = useState<number>(authUser?.balance || 0);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [adminStats, setAdminStats] = useState<any>(null);
  
  // Design states (CR-03 fix)
  const [designSelections, setDesignSelections] = useState<any>({});
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [generatedAiImage, setGeneratedAiImage] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  
  // Mobile Sidebar Hamburger Navigation (CR-06)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Extended payment methods state for wallet settings
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  // Profile image upload state
  const [profileImage, setProfileImage] = useState<string>(authUser?.profile_image || '');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Order detail / quote modal + tailor's quotable requests
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [tailorRequests, setTailorRequests] = useState<any[]>([]);

  // Transaction history (#6) + change password (#5)
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    setProfileImage(authUser?.profile_image || '');
  }, [authUser?.profile_image]);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const { url } = await api.uploadFile(file, 'image');
      const finalUrl = url.startsWith("http") ? url : url.replace("/storage/uploads/", "/api/v1/uploads/");
      await api.updateMe({ profile_image: finalUrl });
      setProfileImage(finalUrl);
      await refreshUser();   // Refresh user data to sync with backend
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const wallet = await api.getWallet();
        setWalletBalance(Number(wallet.balance));
      } catch {}
    };
    if (userRole) loadWallet();
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'manager') {
      api.getUsers().then((data: any[]) => {
        setUsers(data.map(u => ({
          id: String(u.id),
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email,
          role: u.role as UserRole,
          balance: typeof u.balance === 'number' && !isNaN(u.balance) ? u.balance : 0,
          profileImage: u.profile_image || undefined,
          joinedDate: new Date(u.created_at || Date.now()),
        })));
      }).catch(() => {});
    }
  }, [userRole]);

  useEffect(() => {
    api.getPaymentMethods().then((data: any[]) => {
      if (data.length > 0) {
        setPaymentMethods(data.map(m => ({
          id: String(m.id),
          translationKey: m.translation_key || m.name,
          isActive: m.is_active,
          imgUrl: m.img_url || '',
          type: m.type || 'cash_location',
          details: m.details || {},
        })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (userRole === 'tailor' || userRole === 'designer' || userRole === 'manager') {
      api.getPortfolio().then((data: any[]) => {
        if (data.length > 0) {
          setPortfolioItems(data.map(item => ({
            id: String(item.id),
            tailorId: String(item.tailor_id),
            title: item.title,
            description: item.description || '',
            price: item.price || 0,
            imageUrls: item.image_urls || [],
            status: item.status,
          })));
        }
      }).catch(() => {});
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'manager' && currentView === 'overview') {
      api.getAdminStats().then(setAdminStats).catch(() => {});
    }
  }, [userRole, currentView]);

  const reloadOrders = async () => {
    try {
      const o = await api.getOrders();
      if (Array.isArray(o)) setOrders(o.map((ord: any) => ({
        id: String(ord.id),
        customerId: String(ord.customer_id),
        design: {} as any,
        tailorId: String(ord.tailor_id || ''),
        measurements: {} as any,
        status: ord.status as any,
        price: ord.total_price,
        createdAt: new Date(ord.created_at || Date.now()),
      })));
    } catch {}
  };

  const reloadTailorRequests = async () => {
    try {
      const o = await api.getTailorPendingOrders();
      if (Array.isArray(o)) setTailorRequests(o.map((ord: any) => ({
        id: String(ord.id),
        customerId: String(ord.customer_id),
        status: ord.status,
        price: ord.total_price,
      })));
    } catch {}
  };

  // Tailors/managers pull quotable orders from the dedicated endpoint
  // (these are unassigned pending_quote orders, not in the user's own order list)
  useEffect(() => {
    if ((userRole === 'tailor' || userRole === 'manager') && currentView === 'requests') reloadTailorRequests();
  }, [userRole, currentView]);

  const requestList = (userRole === 'tailor' || userRole === 'manager')
    ? tailorRequests
    : orders.filter(o => o.status === 'pending_quote');

  // Load transaction history when the wallet view is open (#6)
  useEffect(() => {
    if (currentView === 'wallet') {
      api.getTransactions().then((d: any[]) => setTransactions(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [currentView]);

  const handleChangePassword = async () => {
    if (!pwOld || !pwNew) return;
    if (pwNew.length < 8) { alert(t('password_min_length' as any) || 'New password must be at least 8 characters.'); return; }
    if (pwNew !== pwConfirm) { alert(t('password_mismatch' as any) || 'New passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await api.changePassword(pwOld, pwNew);
      setPwOld(''); setPwNew(''); setPwConfirm('');
      alert(t('password_change_success' as any) || 'Password updated. Please log in again.');
      onLogout();
      onNavigate('home');
    } catch (e: any) { alert(e.message || 'Failed to change password'); }
    finally { setPwBusy(false); }
  };

  const SidebarItem = ({ view, icon, label }: { view: DashboardView, icon: string, label: string }) => (
    <button 
        onClick={() => {
          setCurrentView(view);
          setIsMobileSidebarOpen(false); // Close mobile tray on click
        }} 
        className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${currentView === view ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
    >
        <div className="flex-shrink-0">
             <Icon name={icon} className={`w-4 h-4 transition-colors duration-300 ${currentView === view ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
        </div>
        <span className={`text-base font-bold uppercase tracking-[0.1em] text-start leading-none ${currentView === view ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </button>
  );

  const dashboardBackgroundImage = ROLE_IMAGES[userRole] || ROLE_IMAGES.default;

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${dashboardBackgroundImage}')` }}
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
      </div>

      {/* MOBILE HEADER & HAMBURGER - fixed at top */}
      <header className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl border-b border-white/10 z-[100]">
        <h1 className="font-serif text-lg font-black tracking-[0.15em] text-white">MODEYA</h1>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-white hover:text-brand-gold transition-colors focus:outline-none relative z-[110]"
        >
          {isMobileSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay when sidebar is open */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* FIXED SIDEBAR DESKTOP */}
      <aside className="hidden md:flex fixed top-0 bottom-0 start-0 w-64 bg-gray-950/80 backdrop-blur-xl border-r border-white/10 flex-col h-full overflow-y-auto custom-scrollbar z-[80]">
          <div className="p-8 pb-0 text-center">
             <h1 className="font-serif text-xl font-black tracking-[0.15em] text-white mb-1">MODEYA</h1>
             {userRole === 'manager' && (
               <p className="text-xs font-bold text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_management_suite')}</p>
             )}
          </div>
          
          <div className="p-4 flex-grow">
              <nav className="space-y-1">
                  <SidebarItem view="overview" icon="grid" label={t('dashboard_menu_overview')} />

                  {/* CUSTOMER MENU */}
                  {userRole === 'customer' && (
                      <>
                        <SidebarItem view="design" icon="palette" label={t('dashboard_menu_create_design')} />
                        <SidebarItem view="my-designs" icon="share" label={t('dashboard_menu_my_designs')} />
                        <SidebarItem view="orders" icon="shopping-bag" label={t('dashboard_menu_orders')} />
                      </>
                  )}

                  {/* TAILOR & DESIGNER MENU */}
                  {(userRole === 'tailor' || userRole === 'designer') && (
                      <>
                        <SidebarItem view="portfolio" icon="grid" label={t('dashboard_menu_portfolio')} />
                        <SidebarItem view="requests" icon="clipboard" label={t('dashboard_menu_requests')} />
                      </>
                  )}

                  {/* MANAGER MENU */}
                  {userRole === 'manager' && (
                    <>
                        <div className="mt-6 mb-2 px-3 text-start"><span className="text-sm font-black text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_sidebar_admin')}</span></div>
                        <SidebarItem view="admin-orders" icon="clipboard" label={t('dashboard_menu_admin_orders')} />
                        <SidebarItem view="admin-topups" icon="credit-card" label={t('dashboard_menu_admin_topups' as any) || 'Top-up Requests'} />
                        <SidebarItem view="admin-approvals" icon="check-circle" label={t('dashboard_menu_admin_approvals')} />
                        <SidebarItem view="admin-products" icon="shopping-bag" label={t('dashboard_menu_admin_products')} />
                        <SidebarItem view="admin-users" icon="users" label={t('dashboard_menu_admin_users')} />
                        <SidebarItem view="admin-payments" icon="credit-card" label={t('dashboard_menu_admin_payments')} />
                        <SidebarItem view="admin-socials" icon="share" label={t('dashboard_menu_admin_socials')} />
                        <SidebarItem view="admin-design-assets" icon="palette" label={t('admin_design_assets_title' as any) || 'Design Assets'} />
                        <SidebarItem view="admin-support" icon="headphones" label={t('admin_support_title' as any) || 'Support Tickets'} />
                    </>
                  )}

                  <div className="mt-6 mb-2 px-3 text-start"><span className="text-sm font-black text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_sidebar_personal')}</span></div>
                  <SidebarItem view="wallet" icon="credit-card" label={t('dashboard_menu_wallet')} />
                  <SidebarItem view="support-chat" icon="message-square" label={t('support_chat_title' as any) || 'Support'} />
                  <SidebarItem view="profile" icon="settings" label={t('dashboard_menu_profile')} />
              </nav>
          </div>
          
          <div className="p-6 mt-auto border-t border-white/10">
             <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-start min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {profileImage ? (
                          <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">{authUser?.first_name?.[0] || ''}{authUser?.last_name?.[0] || ''}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white leading-none mb-0.5 truncate">{authUser?.first_name || ''} {authUser?.last_name || ''}</p>
                        <p className="text-xs text-brand-gold leading-none capitalize">{userRole}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                      onLogout();
                      onNavigate('home');
                    }}
                    className="flex-shrink-0 p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-all"
                    title={t('dashboard_menu_logout')}
                >
                    <Icon name="logout" className="w-4 h-4" />
                </button>
             </div>
          </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <aside className={`fixed top-[56px] bottom-0 start-0 w-64 bg-gray-950/95 backdrop-blur-2xl border-r border-white/10 flex flex-col h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar z-[95] transition-transform duration-300 md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
          <div className="p-4 flex-grow">
              <nav className="space-y-1">
                  <SidebarItem view="overview" icon="grid" label={t('dashboard_menu_overview')} />

                  {userRole === 'customer' && (
                      <>
                        <SidebarItem view="design" icon="palette" label={t('dashboard_menu_create_design')} />
                        <SidebarItem view="my-designs" icon="share" label={t('dashboard_menu_my_designs')} />
                        <SidebarItem view="orders" icon="shopping-bag" label={t('dashboard_menu_orders')} />
                      </>
                  )}

                  {(userRole === 'tailor' || userRole === 'designer') && (
                      <>
                        <SidebarItem view="portfolio" icon="grid" label={t('dashboard_menu_portfolio')} />
                        <SidebarItem view="requests" icon="clipboard" label={t('dashboard_menu_requests')} />
                      </>
                  )}

                  {userRole === 'manager' && (
                    <>
                        <div className="mt-6 mb-2 px-3 text-start"><span className="text-sm font-black text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_sidebar_admin')}</span></div>
                        <SidebarItem view="admin-orders" icon="clipboard" label={t('dashboard_menu_admin_orders')} />
                        <SidebarItem view="admin-topups" icon="credit-card" label={t('dashboard_menu_admin_topups' as any) || 'Top-up Requests'} />
                        <SidebarItem view="admin-approvals" icon="check-circle" label={t('dashboard_menu_admin_approvals')} />
                        <SidebarItem view="admin-products" icon="shopping-bag" label={t('dashboard_menu_admin_products')} />
                        <SidebarItem view="admin-users" icon="users" label={t('dashboard_menu_admin_users')} />
                        <SidebarItem view="admin-payments" icon="credit-card" label={t('dashboard_menu_admin_payments')} />
                        <SidebarItem view="admin-socials" icon="share" label={t('dashboard_menu_admin_socials')} />
                        <SidebarItem view="admin-design-assets" icon="palette" label={t('admin_design_assets_title' as any) || 'Design Assets'} />
                        <SidebarItem view="admin-support" icon="headphones" label={t('admin_support_title' as any) || 'Support Tickets'} />
                    </>
                  )}

                  <div className="mt-6 mb-2 px-3 text-start"><span className="text-sm font-black text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_sidebar_personal')}</span></div>
                  <SidebarItem view="wallet" icon="credit-card" label={t('dashboard_menu_wallet')} />
                  <SidebarItem view="support-chat" icon="message-square" label={t('support_chat_title' as any) || 'Support'} />
                  <SidebarItem view="profile" icon="settings" label={t('dashboard_menu_profile')} />
              </nav>

              {/* Logout button directly below menu items */}
              <button
                  onClick={() => {
                    onLogout();
                    onNavigate('home');
                  }}
                  className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-all text-sm font-bold min-h-[48px]"
              >
                  <Icon name="logout" className="w-5 h-5" />
                  <span>{t('dashboard_menu_logout')}</span>
              </button>
          </div>
      </aside>

      {/* Main Content Area - scrollable */}
      <main className="flex-grow relative md:ms-64 overflow-y-auto overflow-x-hidden pt-[56px] md:pt-0 h-full">
          <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
              {currentView === 'overview' && (
                <ManagerOverview
                  userRole={userRole}
                  authUser={authUser}
                  users={users}
                  orders={orders}
                  portfolioItems={portfolioItems}
                  adminStats={adminStats}
                  setCurrentView={setCurrentView}
                />
              )}
              {currentView === 'admin-users' && (
                <AdminUsers users={users} setUsers={setUsers} />
              )}
              {currentView === 'admin-payments' && (
                <AdminPayments paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} />
              )}
              {currentView === 'admin-products' && (
                <AdminProducts products={products} setProducts={setProducts} />
              )}
              {currentView === 'admin-socials' && (
                <AdminSocials socialLinks={socialLinks} setSocialLinks={setSocialLinks} />
              )}
              {currentView === 'admin-orders' && (
                <AdminOrders orders={orders} setOrders={setOrders} users={users} />
              )}
              {currentView === 'admin-topups' && (
                <AdminTopups />
              )}
              {currentView === 'admin-settings' && (
                <AdminSettings />
              )}
              {currentView === 'support-chat' && (
                <SupportChat mode="user" />
              )}
              {currentView === 'admin-support' && (
                <SupportChat mode="admin" />
              )}
              {currentView === 'design' && (
                <DesignStudio
                  dressParts={dressParts}
                  designSelections={designSelections}
                  setDesignSelections={setDesignSelections}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  generatedAiImage={generatedAiImage}
                  setGeneratedAiImage={setGeneratedAiImage}
                  isGeneratingAi={isGeneratingAi}
                  setIsGeneratingAi={setIsGeneratingAi}
                  savedDesigns={savedDesigns}
                  setSavedDesigns={setSavedDesigns}
                />
              )}
              {currentView === 'my-designs' && (
                <MyDesigns
                  savedDesigns={savedDesigns}
                  setSavedDesigns={setSavedDesigns}
                  setCurrentView={setCurrentView}
                />
              )}
              {(currentView === 'portfolio' || currentView === 'admin-approvals') && (
                <ProfessionalPortfolio
                  portfolioItems={portfolioItems}
                  setPortfolioItems={setPortfolioItems}
                  userRole={userRole}
                  currentUserId={authUser?.id ? String(authUser.id) : undefined}
                />
              )}
              {currentView === 'admin-design-assets' && (
                <AdminDesignAssets
                  dressParts={dressParts}
                  setDressParts={setDressParts}
                />
              )}
              
              {/* Personal Wallet Section */}
              {currentView === 'wallet' && (
                <div className="animate-fade-in text-start">
                  <div className="mb-8">
                    <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">{t('dashboard_menu_wallet')}</h2>
                    <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
                    <p className="text-base text-gray-300">{t('wallet_subtitle' as any)}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className={glassCardClass + " p-6 text-center"}>
                      <p className="text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('wallet_current_balance')}</p>
                      <p className="text-4xl font-serif text-white font-bold">${walletBalance.toFixed(2)}</p>
                    </div>
                    <div className={glassCardClass + " p-6 text-center"}>
                      <p className="text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('wallet_amount_to_add' as any)}</p>
                      <div className="flex gap-2 mt-3">
                        <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className={glassInputClass.replace('w-full','flex-1') + ' text-base'} placeholder="0.00" />
                        <button onClick={async () => { if (!topUpAmount || parseFloat(topUpAmount) <= 0) return; try { await api.topUpWallet(parseFloat(topUpAmount)); setTopUpAmount(''); alert('Top-up request submitted — pending admin approval.'); } catch (err: any) { alert(err.message || 'Failed to submit top-up'); } }} className="px-4 py-2 bg-brand-gold text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-yellow-600">{t('wallet_top_up' as any)}</button>
                      </div>
                    </div>
                    <div className={glassCardClass + " p-6 text-center"}>
                      <p className="text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('wallet_pending_balance' as any) || 'Pending Balance'}</p>
                      <p className="text-2xl font-serif text-white font-bold">${authUser?.pending_balance?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  {/* Offline payment notice */}
                  <div className="mb-8 flex items-start gap-3 rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-4">
                    <Icon name="info" className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-100 leading-relaxed">{t('wallet_offline_notice' as any)}</p>
                  </div>

                  {/* Transaction history (#6) */}
                  <div className="mb-8">
                    <h3 className="text-xl font-serif text-white mb-4">{t('wallet_transactions_title' as any) || 'Transaction History'}</h3>
                    <div className={glassCardClass + " overflow-x-auto"}>
                      <table className="w-full text-start min-w-0 sm:min-w-[560px]">
                        <thead className="bg-white/5 text-gray-300 uppercase text-sm font-bold tracking-[0.15em] border-b border-white/10">
                          <tr>
                            <th className="px-6 py-4">{t('wallet_tx_type' as any) || 'Type'}</th>
                            <th className="px-6 py-4">{t('wallet_tx_amount' as any) || 'Amount'}</th>
                            <th className="px-6 py-4">{t('admin_orders_table_status')}</th>
                            <th className="px-6 py-4">{t('admin_orders_table_date' as any) || 'Date'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {transactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-200 capitalize">{String(tx.transaction_type || '').replace(/_/g, ' ')}</td>
                              <td className="px-6 py-4 text-sm text-white font-medium">${Number(tx.amount).toFixed(2)}</td>
                              <td className="px-6 py-4"><StatusPill status={tx.status} /></td>
                              <td className="px-6 py-4 text-sm text-gray-300">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}</td>
                            </tr>
                          ))}
                          {transactions.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">{t('wallet_no_transactions' as any) || 'No transactions yet.'}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Methods for top-up */}
                  {paymentMethods.filter(m => m.isActive).length > 0 && (
                    <div>
                      <h3 className="text-xl font-serif text-white mb-4">{t('wallet_payment_methods' as any) || 'طرق الدفع المتاحة'}</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paymentMethods.filter(m => m.isActive).map(method => (
                          <div key={method.id} className={glassCardClass + " p-5"}>
                            <div className="flex items-center gap-3 mb-3">
                              {method.imgUrl ? (
                                <img src={method.imgUrl} alt={method.translationKey} className="h-8 w-auto max-w-[80px] object-contain" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                              ) : null}
                              <span className="font-bold text-white text-xs uppercase tracking-wider">{t(method.translationKey as any)}</span>
                            </div>
                            {method.details?.phoneNumber && (
                              <p className="text-sm text-gray-400 mb-1">
                                <span className="text-gray-300">{t('wallet_payment_phone' as any)}</span> {method.details.phoneNumber}
                              </p>
                            )}
                            {method.details?.paymentCode && (
                              <p className="text-sm text-gray-300 font-bold bg-white/5 rounded-lg px-3 py-2 mt-2 border border-white/10">
                                {t('wallet_payment_code' as any)} <span className="text-brand-gold">{method.details.paymentCode}</span>
                              </p>
                            )}
                            {method.details?.accountName && (
                              <p className="text-sm text-gray-400 mb-1">
                                <span className="text-gray-300">{t('wallet_payment_account_name' as any)}</span> {method.details.accountName}
                              </p>
                            )}
                            {method.details?.bankName && (
                              <p className="text-sm text-gray-400 mb-1">
                                <span className="text-gray-300">{t('wallet_payment_bank' as any)}</span> {method.details.bankName}
                              </p>
                            )}
                            {method.details?.accountNumber && (
                              <p className="text-sm text-gray-400 mb-1">
                                <span className="text-gray-300">{t('wallet_payment_account_number' as any)}</span> {method.details.accountNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Profile Section */}
              {currentView === 'profile' && (
                <div className="animate-fade-in text-start">
                  <div className="mb-8">
                    <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">{t('dashboard_menu_profile')}</h2>
                    <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
                    <p className="text-base text-gray-300">{t('profile_subtitle' as any)}</p>
                  </div>
                  <div className={glassCardClass + " p-8 max-w-4xl"}>
                    {/* Profile image */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-white/10">
                      <div className="relative w-28 h-28 flex-shrink-0">
                        <div className="w-28 h-28 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center">
                          {profileImage ? (
                            <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-white">{authUser?.first_name?.[0] || ''}{authUser?.last_name?.[0] || ''}</span>
                          )}
                        </div>
                        <label className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-brand-gold text-white flex items-center justify-center cursor-pointer hover:bg-yellow-600 transition-colors shadow-lg">
                          <Icon name="camera" className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={isUploadingImage} />
                        </label>
                      </div>
                      <div className="text-center sm:text-start">
                        <p className="block text-base font-bold text-gray-300 mb-1">{t('profile_label_image' as any)}</p>
                        <p className="text-base text-gray-400">{isUploadingImage ? t('profile_uploading' as any) : t('profile_change_image' as any)}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('contact_form_firstName')}</label>
                        <input type="text" defaultValue={authUser?.first_name || ''} id="profile-first-name" className={glassInputClass + ' text-base'} />
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('contact_form_lastName')}</label>
                        <input type="text" defaultValue={authUser?.last_name || ''} id="profile-last-name" className={glassInputClass + ' text-base'} />
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('contact_form_email')}</label>
                        <input type="email" defaultValue={authUser?.email || ''} className={glassInputClass + ' text-base'} disabled />
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('signup_form_phone_label')}</label>
                        <input type="tel" defaultValue={authUser?.phone || ''} id="profile-phone" className={glassInputClass + ' text-base'} />
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-base font-bold text-gray-300 uppercase tracking-widest mb-2">{t('profile_label_bio' as any)}</label>
                      <textarea defaultValue={authUser?.bio || ''} id="profile-bio" rows={3} className={glassInputClass + " resize-none text-base"} />
                    </div>
                    <button onClick={async () => { try { const first_name = (document.getElementById('profile-first-name') as HTMLInputElement)?.value; const last_name = (document.getElementById('profile-last-name') as HTMLInputElement)?.value; const phone = (document.getElementById('profile-phone') as HTMLInputElement)?.value; const bio = (document.getElementById('profile-bio') as HTMLTextAreaElement)?.value; await api.updateMe({ first_name, last_name, phone, bio, profile_image: profileImage }); await refreshUser(); alert(t('profile_save_success')); } catch (err: any) { alert(err.message || 'Failed to update profile'); } }} className={glassButtonClass + " mt-6 w-auto px-8"}>{t('profile_save_button' as any)}</button>
                  </div>

                  {/* Change Password (#5) */}
                  <div className={glassCardClass + " p-8 max-w-4xl mt-6"}>
                    <h3 className="text-xl font-serif text-white mb-1">{t('password_change_title' as any) || 'Change Password'}</h3>
                    <p className="text-sm text-gray-400 mb-6">{t('password_change_subtitle' as any) || 'You will be logged out after changing your password.'}</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <input type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} placeholder={t('password_current' as any) || 'Current password'} className={glassInputClass + ' text-base'} />
                      <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder={t('password_new' as any) || 'New password (min 8)'} className={glassInputClass + ' text-base'} />
                      <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder={t('password_confirm' as any) || 'Confirm new password'} className={glassInputClass + ' text-base'} />
                    </div>
                    <button disabled={pwBusy} onClick={handleChangePassword} className={glassButtonClass + " mt-6 w-auto px-8 disabled:opacity-50"}>{t('password_change_button' as any) || 'Update Password'}</button>
                  </div>
                </div>
              )}

              {/* Personal Orders Section */}
              {currentView === 'orders' && (
                <div className="animate-fade-in text-start">
                  <div className="mb-8">
                    <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">{t('dashboard_menu_orders')}</h2>
                    <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
                    <p className="text-base text-gray-300">{t('orders_subtitle' as any)}</p>
                  </div>
                  <div className={glassCardClass + " overflow-hidden overflow-x-auto"}>
                    <table className="w-full text-start min-w-0 sm:min-w-[480px]">
                      <thead className="bg-white/5 text-gray-300 uppercase text-base font-bold tracking-[0.15em] border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4">{t('admin_orders_table_id')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_status')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_price')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_date' as any)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {orders.filter(o => String(o.customerId) === String(authUser?.id)).map(order => (
                          <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-white/5 transition-colors cursor-pointer">
                            <td className="px-6 py-4 font-mono text-sm text-gray-200">#{String(order.id || '').slice(-6)}</td>
                            <td className="px-6 py-4"><StatusPill status={order.status} /></td>
                            <td className="px-6 py-4 text-sm text-white font-medium">${order.price || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {orders.filter(o => String(o.customerId) === String(authUser?.id)).length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">{t('dashboard_no_orders')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Personal Requests (for Tailors / Designers) */}
              {currentView === 'requests' && (
                <div className="animate-fade-in text-start">
                  <div className="mb-8">
                    <h2 className="text-4xl font-serif font-bold text-white mb-2 tracking-wide">{t('dashboard_menu_requests')}</h2>
                    <div className="w-16 h-0.5 bg-brand-gold mb-3"></div>
                    <p className="text-base text-gray-300">{t('requests_subtitle' as any)}</p>
                  </div>
                  <div className={glassCardClass + " overflow-hidden overflow-x-auto"}>
                    <table className="w-full text-start min-w-0 sm:min-w-[480px]">
                      <thead className="bg-white/5 text-gray-300 uppercase text-base font-bold tracking-[0.15em] border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4">{t('admin_orders_table_id')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_customer')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_status')}</th>
                          <th className="px-6 py-4">{t('admin_orders_table_price')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {requestList.map((order: any) => (
                          <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-white/5 transition-colors cursor-pointer">
                            <td className="px-6 py-4 font-mono text-sm text-gray-200">#{String(order.id || '').slice(-6)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-white">{users.find(u => u.id === order.customerId)?.firstName || '-'}</td>
                            <td className="px-6 py-4"><StatusPill status={order.status} /></td>
                            <td className="px-6 py-4 text-sm text-white font-medium">${order.price || '-'}</td>
                          </tr>
                        ))}
                        {requestList.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">{t('dashboard_no_orders')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>

          {selectedOrderId && (
            <OrderDetailModal
              orderId={selectedOrderId}
              role={userRole}
              currentUserId={authUser?.id ? String(authUser.id) : undefined}
              onClose={() => setSelectedOrderId(null)}
              onChanged={() => { reloadOrders(); if (userRole === 'tailor' || userRole === 'manager') reloadTailorRequests(); }}
            />
          )}
      </main>
    </div>
  );
};

export default UserDashboard;