
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole } from '../types';

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
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [bgImage, setBgImage] = useState(ROLE_IMAGES.default);
  const [recoveryStep, setRecoveryStep] = useState<'enterEmail' | 'showOptions' | 'codeSent'>('enterEmail');
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(activeRole);
  };
  
  const handleSignupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole || activeRole;
    onLogin(role);
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
        <button type="submit" className={buttonClasses}>{t('login_form_login_button')}</button>
      </form>

      <div className="text-center border-t border-white/10 pt-6">
        <p className="text-sm text-gray-300 mb-2">{t('login_form_no_account')}</p>
        <button onClick={() => setView('signup')} className="text-brand-gold hover:text-white font-bold text-sm tracking-wide transition-colors">
          {t('login_form_signup_now')}
        </button>
      </div>
    </div>
  );

  const SignupView = () => (
    <div className="space-y-6">
       <div className="text-center mb-6">
        <h2 className="text-3xl font-serif text-white">{t('login_tab_signup')}</h2>
        <p className="text-gray-300 text-xs mt-2 uppercase tracking-widest">Join as {t(`signup_form_role_${activeRole}` as any)}</p>
      </div>

      <form onSubmit={handleSignupSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder={t('contact_form_firstName')} required className={inputClasses} />
          <input type="text" name="lastName" placeholder={t('contact_form_lastName')} required className={inputClasses} />
        </div>
        <input type="email" name="email" placeholder={t('contact_form_email')} required className={inputClasses} />
        <input type="tel" name="phone" placeholder={t('signup_form_phone_label')} required className={inputClasses} />
        <input type="password" name="password" placeholder={t('login_form_password')} required className={inputClasses} />
        
        {/* Role is implicitly selected via the UI state, but we send it in form */}
        <input type="hidden" name="role" value={activeRole} />
        
        <div className="pt-2">
            <button type="submit" className={buttonClasses}>{t('signup_form_signup_button')}</button>
        </div>
      </form>

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
        <div className={glassPanelClasses}>
            {view === 'login' && <LoginView />}
            {view === 'signup' && <SignupView />}
            {view === 'forgot' && <ForgotPasswordView />}
        </div>

      </div>
    </section>
  );
};

export default LoginPage;
