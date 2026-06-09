
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onNavigate: (page: 'home' | 'login' | 'user-dashboard') => void;
  onLogin: (role: UserRole) => void;
}

// High-quality images for each role - Updated Tailor Image
const ROLE_IMAGES = {
  customer: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop', // Fashion/Shopping
  designer: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop', // Sketching/Design
  tailor: 'https://images.unsplash.com/photo-1550920430-b3b4f624d783?q=80&w=2070&auto=format&fit=crop', // Woman sewing on machine
  manager: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop', // Boutique/Office
  default: 'https://i.pinimg.com/1200x/6a/8a/d1/6a8ad1d51775ca4922490cc273a4cd01.jpg' // Original Elegant Background
};

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const { t } = useTranslation();
  const { login, register: registerUser } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [bgImage, setBgImage] = useState(ROLE_IMAGES.default);
  const [recoveryStep, setRecoveryStep] = useState<'enterEmail' | 'showOptions' | 'codeSent'>('enterEmail');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preload images
  useEffect(() => {
    Object.values(ROLE_IMAGES).forEach(src => {
      const img = new Image();
      img.src = src;
    });
    // Set initial image based on default active role
    setBgImage(ROLE_IMAGES['customer']);
  }, []);

  const handleRoleChange = (role: UserRole) => {
    if (role === activeRole) return;
    setIsAnimating(true);
    setActiveRole(role);
    setTimeout(() => {
        setBgImage(ROLE_IMAGES[role]);
        setIsAnimating(false);
    }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value;
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value;
    try {
      await login(email, password);
      onLogin(activeRole);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole || activeRole;
    try {
      await registerUser({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        phone: formData.get('phone') as string,
        role: role,
      });
      onLogin(role);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStep('showOptions');
  };

  const handleRecoveryMethodSelect = () => {
    setRecoveryStep('codeSent');
  };

  const resetToLogin = () => {
    setView('login');
    setTimeout(() => {
        setRecoveryStep('enterEmail');
    }, 300);
  }

  // Styles
  const glassPanelClasses = "relative z-10 w-full max-w-md p-8 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in transition-all duration-500";
  const inputClasses = "w-full p-4 border border-white/30 bg-white/5 text-white placeholder-gray-300 focus:bg-white/10 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all rounded-xl";
  const buttonClasses = "w-full py-4 bg-white text-brand-dark font-bold tracking-[0.2em] text-xs hover:bg-brand-gold hover:text-white transition-all duration-300 rounded-xl uppercase shadow-lg transform hover:-translate-y-1";
  const roleButtonClasses = (role: UserRole) => `px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeRole === role ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30 hover:bg-white/10'}`;

  const LoginView = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-serif text-white mb-2">{t('login_tab_login')}</h2>
        <p className="text-gray-300 text-sm">{t('signup_form_role_label')}</p>
        
        {/* Role Selector */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
            {(['customer', 'designer', 'tailor', 'manager'] as UserRole[]).map(role => (
                <button 
                    key={role} 
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={roleButtonClasses(role)}
                >
                    {t(`signup_form_role_${role}` as any)}
                </button>
            ))}
        </div>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-5">
        <div className="space-y-1">
            <input type="email" name="email" required placeholder={t('contact_form_email')} className={inputClasses} />
        </div>
        <div className="space-y-1">
            <input type="password" name="password" required placeholder={t('login_form_password')} className={inputClasses} />
            <div className="text-end">
                <button type="button" onClick={() => setView('forgot')} className="text-xs text-gray-300 hover:text-white underline">{t('login_form_forgot_password')}</button>
            </div>
        </div>
        <button type="submit" disabled={loading} className={buttonClasses}>{loading ? '...' : t('login_form_login_button')}</button>
      </form>
      {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}

      <div className="text-center border-t border-white/10 pt-6">
        <p className="text-sm text-gray-300 mb-2">{t('login_form_no_account')}</p>
        <button onClick={() => setView('signup')} className="text-brand-gold hover:text-white font-bold text-sm tracking-wide transition-colors">
          {t('login_form_signup_now')}
        </button>
      </div>
    </div>
  );

  const ROLE_ICONS: Record<string, React.ReactElement> = {
    customer: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    designer: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    tailor: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
    manager: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  };

  const SignupView = () => (
    <div className="space-y-6">
       <div className="text-center mb-4">
        <h2 className="text-3xl font-serif text-white">{t('login_tab_signup')}</h2>
      </div>

      {/* Role Selector with Icons */}
      <div>
        <p className="text-xs text-gray-300 uppercase tracking-widest mb-3 text-center">{t('signup_form_role_label')}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['customer', 'designer', 'tailor'] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 text-start ${
                activeRole === role
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-transparent text-white border-white/30 hover:bg-white/10'
              }`}
            >
              <span className="flex-shrink-0">{ROLE_ICONS[role]}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{t(`signup_form_role_${role}` as any)}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSignupSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder={t('contact_form_firstName')} required className={inputClasses} />
          <input type="text" name="lastName" placeholder={t('contact_form_lastName')} required className={inputClasses} />
        </div>
        <input type="email" name="email" placeholder={t('contact_form_email')} required className={inputClasses} />
        <input type="tel" name="phone" placeholder={t('signup_form_phone_label')} required className={inputClasses} />
        <input type="password" name="password" placeholder={t('login_form_password')} required minLength={8} className={inputClasses} />

        {/* Role is implicitly selected via the UI state, but we send it in form */}
        <input type="hidden" name="role" value={activeRole} />

        <div className="pt-2">
            <button type="submit" disabled={loading} className={buttonClasses}>{loading ? '...' : t('signup_form_signup_button')}</button>
        </div>
      </form>
      {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}

      <div className="text-center">
        <p className="text-sm text-gray-300">
          {t('signup_form_has_account')}
          <button onClick={() => setView('login')} className="ml-2 text-white font-bold hover:underline">
            {t('signup_form_login_now')}
          </button>
        </p>
      </div>
    </div>
  );

  const ForgotPasswordView = () => (
    <div className="space-y-8">
        <div className="text-center">
             <h2 className="text-3xl font-serif text-white mb-2">{t('forgot_password_title')}</h2>
             <p className="text-gray-300 text-sm">{t('forgot_password_instructions')}</p>
        </div>

        {recoveryStep === 'enterEmail' && (
             <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <input type="email" name="email" placeholder={t('contact_form_email')} required className={inputClasses} />
                <button type="submit" className={buttonClasses}>{t('forgot_password_submit_button')}</button>
             </form>
        )}

        {recoveryStep === 'showOptions' && (
            <div className="space-y-4">
                <button onClick={handleRecoveryMethodSelect} className={`${inputClasses} hover:bg-white/20 text-start flex justify-between items-center`}>
                    <span>{t('forgot_password_recovery_sms_button')}</span>
                    <span className="text-xl">📱</span>
                </button>
                <button onClick={handleRecoveryMethodSelect} className={`${inputClasses} hover:bg-white/20 text-start flex justify-between items-center`}>
                    <span>{t('forgot_password_recovery_call_button')}</span>
                    <span className="text-xl">📞</span>
                </button>
            </div>
        )}

        {recoveryStep === 'codeSent' && (
             <div className="bg-green-500/20 border border-green-500/50 p-6 rounded-xl text-center">
                <p className="text-white font-medium">{t('forgot_password_code_sent_message')}</p>
            </div>
        )}

      <div className="text-center">
        <button onClick={resetToLogin} className="text-sm text-gray-300 hover:text-white underline">
          {t('forgot_password_back_to_login')}
        </button>
      </div>
    </div>
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform ${isAnimating ? 'scale-105 blur-sm opacity-80' : 'scale-100 blur-0 opacity-100'}`}
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 backdrop-blur-[1px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-12">
        
        {/* Left Side: Text Content (Hidden on mobile for simplicity or kept for brand presence) */}
        <div className="hidden md:block max-w-lg text-white text-start animate-fade-in">
             <h1 className="text-6xl font-serif font-bold mb-6 leading-tight">
                {activeRole === 'customer' && "Discover Your Elegance."}
                {activeRole === 'designer' && "Create The Future of Fashion."}
                {activeRole === 'tailor' && "Craft Perfection in Every Stitch."}
                {activeRole === 'manager' && "Oversee Excellence."}
             </h1>
             <p className="text-xl text-gray-200 font-light leading-relaxed">
                {activeRole === 'customer' && "Join MODEYA to explore exclusive collections and customize your dream dress."}
                {activeRole === 'designer' && "Showcase your portfolio, connect with clients, and bring your sketches to life."}
                {activeRole === 'tailor' && "Receive orders, manage projects, and grow your tailoring business with us."}
                {activeRole === 'manager' && "Access the administrative suite to manage users, orders, and boutique operations."}
             </p>
        </div>

        {/* Right Side: Glass Form */}
        {/*
          Render the views by CALLING the functions ({LoginView()}) rather than
          mounting them as elements (<LoginView />). They are defined inside this
          component, so as elements React gives them a new component identity on
          every render and remounts the whole subtree. Because the email/password
          inputs are uncontrolled, that remount wipes whatever the user typed.
          Selecting the "designer" or "manager" role calls handleRoleChange, which
          fires a setState + a 300ms setTimeout setState — the resulting re-render
          remounted and cleared the form, so submitting sent empty credentials and
          the backend replied "Incorrect email or password". Calling the function
          inlines the JSX into this component's tree, keeping the inputs mounted.
        */}
        <div className={glassPanelClasses}>
            {view === 'login' && LoginView()}
            {view === 'signup' && SignupView()}
            {view === 'forgot' && ForgotPasswordView()}
        </div>

      </div>
    </section>
  );
};

export default LoginPage;
