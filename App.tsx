import React, { useState, useEffect } from 'react';
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

import ShippingPolicyPage from './components/ShippingPolicyPage';

type Page = 'home' | 'login' | 'about' | 'shop' | 'user-dashboard' | 'policy-shipping';
type ShopCategory = 'all' | 'long' | 'short' | 'summer' | 'winter' | 'spring' | 'autumn';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const path = window.location.pathname.replace('/', '');
    const validPages: Page[] = ['home', 'login', 'about', 'shop', 'user-dashboard', 'policy-shipping'];
    return (validPages.includes(path as Page) ? path : 'home') as Page;
  });
  // F2: Persist cart in localStorage across sessions
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('modeya_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load cart from cache", e);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<ShopCategory>('all');
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

  // F2: Persist cart changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modeya_cart', JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to cache", e);
    }
  }, [cart]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const designs = await api.getDesigns();
        if (Array.isArray(designs)) {
          const mappedProducts: Product[] = designs.map((d: any) => ({
            id: d.id,
            name: d.name || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            imageUrls: d.image_url ? [d.image_url] : [],
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
          }));
          setProducts(prev => mappedProducts.length > 0 ? mappedProducts : prev);
        }
      } catch (e) {
        console.error("Failed to load designs from API, using fallback", e);
      }

      try {
        const categories = ['front_neckline', 'back_neckline', 'fabrics', 'skirt_styles', 'train', 'ornaments'];
        const allParts: DressPart[] = [];
        for (const cat of categories) {
          try {
            const scanParts = await api.getScannerParts(cat);
            if (Array.isArray(scanParts)) {
              for (const p of scanParts) {
                allParts.push({
                  id: String(p.id),
                  type: p.category as any,
                  name: p.name || '',
                  imageUrl: p.imageUrl || '',
                });
              }
            }
          } catch (err) {
            console.error(`Failed to load scanner parts for ${cat}`, err);
          }
        }
        if (allParts.length > 0) {
          setDressParts(allParts);
        }
      } catch (e) {
        console.error("Failed to load dress parts from scanner, using fallback", e);
      }

      try {
        const links = await api.getSocialLinks();
        if (Array.isArray(links) && links.length > 0) {
          setSocialLinks(links.map((l: any) => ({
            name: l.name || '',
            href: l.href || '#',
            icon: SOCIAL_LINKS.find(sl => sl.name?.toLowerCase() === l.name?.toLowerCase())?.icon || <span />,
            isEnabled: !!l.is_enabled,
          })));
        }
      } catch (e) {
        console.error("Failed to load social links from API, using fallback", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.getOrders().then((o: any[]) => {
        if (Array.isArray(o)) {
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
        }
      }).catch((e) => {
        console.error("Failed to load orders from API", e);
      });
    }
  }, [isAuthenticated]);

  // F1: navigate defined BEFORE the useEffect that calls it
  const navigate = (page: Page, anchor?: string, category?: ShopCategory) => {
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

    if (page === 'shop' && category) {
      setShopCategory(category);
    }

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

  // Redirect to dashboard if authenticated and on login page, or restore session
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (currentPage === 'login') {
        navigate('user-dashboard');
      }
    }
  }, [isLoading, isAuthenticated, currentPage]);

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

  const navigateToShopCategory = (category: ShopCategory) => {
    setShopCategory(category);
    navigate('shop');
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

  if (isLoading && currentPage === 'user-dashboard') {
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
      <div className="bg-brand-beige text-gray-800 font-sans overflow-x-hidden max-w-[100vw]">
        <Header
          onNavigate={navigate}
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          socialLinks={socialLinks}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          hidden={currentPage === 'user-dashboard'}
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
          {currentPage === 'shop' && <ShopPage onAddToCart={handleAddToCart} products={products} initialCategory={shopCategory} />}
          {currentPage === 'policy-shipping' && <ShippingPolicyPage onNavigate={navigate} />}
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
        {currentPage !== 'user-dashboard' && (
          <Footer socialLinks={socialLinks} onNavigate={navigate} onShopCategory={navigateToShopCategory} />
        )}
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
