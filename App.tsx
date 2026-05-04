import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import NewArrivals from './components/NewArrivals';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AboutPage from './components/AboutPage';
import ShopPage from './components/ShopPage';
import { CartItem, Product, UserRole, SavedDesign, Order, User, SocialLink, DressPart } from './types';
import CartSidebar from './components/CartSidebar';
import UserDashboard from './components/UserDashboard';
import { PRODUCTS, SOCIAL_LINKS, DRESS_PARTS } from './constants';
import { api } from './services/api';

type Page = 'home' | 'login' | 'about' | 'shop' | 'user-dashboard';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [dressParts, setDressParts] = useState<DressPart[]>(DRESS_PARTS);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    SOCIAL_LINKS.map(link => ({ ...link, isEnabled: true }))
  );
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    try {
      const saved = localStorage.getItem('modeya_saved_designs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load designs from cache", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('modeya_saved_designs', JSON.stringify(savedDesigns));
    } catch (e) {
      console.error("Failed to save designs to cache", e);
    }
  }, [savedDesigns]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const designs = await api.getDesigns();
        const mappedProducts: Product[] = designs.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: d.price || 0,
          imageUrls: [d.image_url],
          sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        }));
        setProducts(prev => mappedProducts.length > 0 ? mappedProducts : prev);
      } catch { /* use fallback */ }

      try {
        const parts = await api.getParts();
        const mapped: DressPart[] = parts.map((p: any) => ({
          id: String(p.id),
          type: p.category as any,
          name: p.name,
          imageUrl: p.image_url,
        }));
        setDressParts(prev => mapped.length > 0 ? mapped : prev);
      } catch { /* use fallback */ }

      try {
        const links = await api.getSocialLinks();
        if (links.length > 0) {
          setSocialLinks(links.map((l: any) => ({
            name: l.name,
            href: l.href || '#',
            icon: SOCIAL_LINKS.find(sl => sl.name.toLowerCase() === l.name.toLowerCase())?.icon || <span />,
            isEnabled: l.is_enabled,
          })));
        }
      } catch { /* use fallback */ }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.getOrders().then((o: any[]) => {
        setOrders(o.map(ord => ({
          id: String(ord.id),
          customerId: String(ord.customer_id),
          design: {} as any,
          tailorId: String(ord.tailor_id || ''),
          measurements: {} as any,
          status: ord.status as any,
          price: ord.total_price,
          createdAt: new Date(ord.created_at || Date.now()),
        })));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page as Page);
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: Page, anchor?: string) => {
    const doScroll = (selector: string) => {
      const element = document.querySelector(selector);
      if (element) {
        const headerEl = document.querySelector('header');
        const headerOffset = headerEl ? headerEl.offsetHeight : 72;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    };

    if (currentPage === page && anchor) {
      doScroll(anchor);
    } else {
      window.history.pushState({ page }, '', `/${page === 'home' ? '' : page}`);
      setCurrentPage(page);
      if (anchor) {
        setTimeout(() => doScroll(anchor), 50);
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  const handleAddToCart = (product: Product, size: string) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.product.id === product.id && item.size === size
      );
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      }
      return [...prevCart, { product, size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: number, size: string) => {
    setCart(prevCart => prevCart.filter(item => 
      !(item.product.id === productId && item.size === size)
    ));
  };

  const handleUpdateCartQuantity = (productId: number, size: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => !(item.product.id === productId && item.size === size));
      }
      return prevCart.map(item =>
        (item.product.id === productId && item.size === size)
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const userRole = (user?.role as UserRole) || 'customer';

  if (isLoading) {
    return (
      <LanguageProvider>
        <div className="min-h-screen flex items-center justify-center bg-brand-beige">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold"></div>
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="bg-brand-beige text-gray-800 font-sans">
        <Header 
          onNavigate={navigate}
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          socialLinks={socialLinks}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
        />
        <CartSidebar 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateCartQuantity}
        />
        <main>
          {currentPage === 'home' && (
            <>
              <Hero onNavigate={navigate} />
              <NewArrivals onNavigate={navigate} onAddToCart={handleAddToCart} products={products} />
              <About onNavigate={navigate} />
              <Contact />
            </>
          )}
          {currentPage === 'login' && (
            <LoginPage 
              onNavigate={navigate}
              onLogin={() => {
                navigate('user-dashboard');
              }}
            />
          )}
          {currentPage === 'about' && <AboutPage onNavigate={navigate} />}
          {currentPage === 'shop' && <ShopPage onAddToCart={handleAddToCart} products={products} />}
          {currentPage === 'user-dashboard' && (
            <UserDashboard 
              onNavigate={navigate}
              userRole={userRole}
              savedDesigns={savedDesigns}
              setSavedDesigns={setSavedDesigns}
              orders={orders}
              setOrders={setOrders}
              onAddToCart={handleAddToCart}
              products={products}
              setProducts={setProducts}
              users={users}
              setUsers={setUsers}
              socialLinks={socialLinks}
              setSocialLinks={setSocialLinks}
              dressParts={dressParts}
              setDressParts={setDressParts}
              onLogout={logout}
            />
          )}
        </main>
        <Footer socialLinks={socialLinks} />
      </div>
    </LanguageProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
