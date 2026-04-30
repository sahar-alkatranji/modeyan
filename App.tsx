import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import NewArrivals from './components/NewArrivals';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import { LanguageProvider } from './contexts/LanguageContext';
import AboutPage from './components/AboutPage';
import ShopPage from './components/ShopPage';
import { CartItem, Product, UserRole, SavedDesign, Order, User, SocialLink, DressPart } from './types';
import CartSidebar from './components/CartSidebar';
import UserDashboard from './components/UserDashboard';
import { PRODUCTS, SOCIAL_LINKS, DRESS_PARTS } from './constants';

type Page = 'home' | 'login' | 'about' | 'shop' | 'user-dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('customer');
  
  // App-Wide Data State (Acting as Database)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [dressParts, setDressParts] = useState<DressPart[]>(DRESS_PARTS);
  
  // Social Media State
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    SOCIAL_LINKS.map(link => ({ ...link, isEnabled: true }))
  );
  
  // Mock Users Database
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', firstName: 'Sara', lastName: 'Ahmed', email: 'sara@example.com', role: 'customer', balance: 150.00, joinedDate: new Date('2023-01-15') },
    { id: 'u2', firstName: 'John', lastName: 'Doe', email: 'manager@modeya.com', role: 'manager', balance: 0, joinedDate: new Date('2022-11-01') },
    { id: 'u3', firstName: 'Layla', lastName: 'Tailor', email: 'layla@modeya.com', role: 'tailor', balance: 450.50, joinedDate: new Date('2023-03-10') },
    { id: 'u4', firstName: 'Samer', lastName: 'Design', email: 'samer@modeya.com', role: 'designer', balance: 1200.00, joinedDate: new Date('2023-02-20') },
  ]);

  // Load saved designs from local storage or empty array
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    try {
      const saved = localStorage.getItem('modeya_saved_designs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load designs from cache", e);
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);

  // Persist saved designs to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('modeya_saved_designs', JSON.stringify(savedDesigns));
    } catch (e) {
      console.error("Failed to save designs to cache", e);
    }
  }, [savedDesigns]);

  const navigate = (page: Page, anchor?: string) => {
    const doScroll = (selector: string) => {
      const element = document.querySelector(selector);
      if (element) {
        const headerEl = document.querySelector('header');
        // Estimate header height as a fallback if it can't be found
        const headerOffset = headerEl ? headerEl.offsetHeight : 72;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
        window.scrollTo({
             top: offsetPosition,
             behavior: "smooth"
        });
      }
    };
  
    if (currentPage === page && anchor) {
      // Already on the right page, just scroll
      doScroll(anchor);
    } else {
      // Need to change page
      setCurrentPage(page);
      if (anchor) {
        // Wait for the new page components to render before scrolling.
        setTimeout(() => doScroll(anchor), 50);
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    navigate('user-dashboard');
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
        } else {
            return [...prevCart, { product, size, quantity: 1 }];
        }
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

  return (
    <LanguageProvider>
      <div className="bg-brand-beige text-gray-800 font-sans">
        <Header 
          onNavigate={navigate}
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          socialLinks={socialLinks}
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
          {currentPage === 'login' && <LoginPage onNavigate={navigate} onLogin={handleLogin} />}
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
                // Admin Props
                products={products}
                setProducts={setProducts}
                users={users}
                setUsers={setUsers}
                socialLinks={socialLinks}
                setSocialLinks={setSocialLinks}
                dressParts={dressParts}
                setDressParts={setDressParts}
            />
          )}
        </main>
        <Footer socialLinks={socialLinks} />
      </div>
    </LanguageProvider>
  );
};

export default App;