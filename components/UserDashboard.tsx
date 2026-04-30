import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from '../hooks/useTranslation';
import { UserRole, DressPart, SavedDesign, Order, Product, Measurements, PortfolioItem, UserProfile, User, SocialLink } from '../types';
import { GoogleGenAI } from "@google/genai";

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

// Consistent Role Images matching LoginPage
const ROLE_IMAGES = {
  customer: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop', // Fashion/Shopping
  designer: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop', // Sketching/Design
  tailor: 'https://images.unsplash.com/photo-1550920430-b3b4f624d783?q=80&w=2070&auto=format&fit=crop', // Woman sewing on machine
  manager: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop', // Boutique/Office
  default: 'https://i.pinimg.com/1200x/6a/8a/d1/6a8ad1d51775ca4922490cc273a4cd01.jpg' // Original Elegant Background
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
}

type DashboardView = 'overview' | 'design' | 'my-designs' | 'orders' | 'profile' | 'wallet' | 'portfolio' | 'requests' | 'designer-portfolio' | 'admin-approvals' | 'admin-products' | 'admin-users' | 'admin-payments' | 'admin-socials' | 'admin-design-assets' | 'admin-orders';

interface PaymentMethod {
    id: string;
    translationKey: string;
    isActive: boolean;
    imgUrl: string;
    type: 'mobile_transfer' | 'remittance' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash_location';
    details: any;
}

// --- Icons ---
const Icon = ({ name, className = "w-3 h-3" }: { name: string, className?: string }) => {
    switch (name) {
        case 'grid': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
        case 'users': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
        case 'shopping-bag': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
        case 'credit-card': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
        case 'check-circle': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'settings': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case 'share': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
        case 'box': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
        case 'clipboard': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        case 'logout': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
        case 'scissor': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
        case 'pencil': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
        case 'palette': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
        case 'sparkles': return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
        default: return null;
    }
};

// Reusable Styles based on Login Page (Glassmorphism)
const glassCardClass = "bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300";
const glassInputClass = "w-full p-4 border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all rounded-xl";
const glassButtonClass = "w-full py-4 bg-white text-brand-dark font-bold tracking-[0.2em] text-xs hover:bg-brand-gold hover:text-white transition-all duration-300 rounded-xl uppercase shadow-lg transform hover:-translate-y-1";

const StripePaymentForm = ({ amount, onSuccess }: { amount: string, onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        setProcessing(true);
        setError(null);

        const { error: stripeError, token } = await stripe.createToken(cardElement);

        if (stripeError) {
            setError(stripeError.message || 'An error occurred');
            setProcessing(false);
        } else if (token) {
            setTimeout(() => {
                setProcessing(false);
                onSuccess();
            }, 1000);
        }
    };

    return (
        <div className={glassCardClass + " p-6"}>
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-white">{t('wallet_stripe_card_details')}</h4>
                <div className="flex gap-2">
                     <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-5 w-auto" alt="Visa"/>
                     <img src="https://cdn-icons-png.flaticon.com/512/349/349228.png" className="h-5 w-auto" alt="Mastercard"/>
                </div>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/90 p-4 rounded-xl border border-gray-200">
                    <CardElement options={{ style: { base: { fontSize: '16px', color: '#1A1A1A', fontFamily: 'Montserrat, sans-serif', '::placeholder': { color: '#9CA3AF' } } } }}/>
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <button 
                    type="submit" 
                    disabled={!stripe || processing || !amount}
                    className={glassButtonClass}
                >
                    {processing ? <span className="animate-pulse">{t('wallet_processing')}</span> : `${t('wallet_stripe_pay_now')} $${amount || '0.00'}`}
                </button>
            </form>
        </div>
    );
};

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onNavigate, userRole, orders, users, setUsers, products, setProducts, socialLinks, setSocialLinks, dressParts, setSavedDesigns, savedDesigns
}) => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [walletBalance, setWalletBalance] = useState<number>(150.00);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [isUserWalletModalOpen, setIsUserWalletModalOpen] = useState(false);
  const [selectedUserForWallet, setSelectedUserForWallet] = useState<User | null>(null);
  const [adminWalletAction, setAdminWalletAction] = useState<'add' | 'deduct'>('add');
  const [adminWalletAmount, setAdminWalletAmount] = useState('');

  // Extended payment methods state for admin
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
      { id: 'auth_center', translationKey: 'payment_method_auth_center', isActive: true, imgUrl: 'https://cdn-icons-png.flaticon.com/512/535/535239.png', type: 'cash_location', details: { address: 'Damascus, Al-Hamra St, Bldg 4' } },
      { id: 'visa', translationKey: 'payment_method_visa', isActive: true, imgUrl: 'https://cdn-icons-png.flaticon.com/512/349/349221.png', type: 'stripe', details: {} },
      { id: 'mastercard', translationKey: 'payment_method_mastercard', isActive: true, imgUrl: 'https://cdn-icons-png.flaticon.com/512/349/349228.png', type: 'stripe', details: {} },
      { id: 'paypal', translationKey: 'payment_method_paypal', isActive: true, imgUrl: 'https://cdn-icons-png.flaticon.com/512/174/174861.png', type: 'paypal', details: { email: 'payments@modeya.com' } },
      { id: 'syriatel', translationKey: 'payment_method_syriatel', isActive: true, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Syriatel_Logo.svg/1200px-Syriatel_Logo.svg.png', type: 'mobile_transfer', details: { phoneNumber: '0999123456' } },
      { id: 'mtn', translationKey: 'payment_method_mtn', isActive: true, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/MTN_Logo.svg/1024px-MTN_Logo.svg.png', type: 'mobile_transfer', details: { phoneNumber: '0955123456' } },
      { id: 'haram', translationKey: 'payment_method_haram', isActive: true, imgUrl: 'https://cdn-icons-png.flaticon.com/512/2535/2535076.png', type: 'remittance', details: { accountName: 'Modeya Manager', phoneNumber: '0933333333', city: 'Damascus' } },
      { id: 'bank_transfer', translationKey: 'payment_method_bank', isActive: false, imgUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', type: 'bank_transfer', details: {} },
      { id: 'baraka', translationKey: 'payment_method_barakabank', isActive: false, imgUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830289.png', type: 'bank_transfer', details: {} },
  ]);

  // Portfolio Items Mock - NOW USING KEYS
  const [portfolioItems] = useState<PortfolioItem[]>([
      { id: 'p1', tailorId: 'u3', title: 'portfolio_p1_title', description: 'portfolio_p1_desc', price: 550, imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/9d86cb91-bae4-4c50-b229-260ea30b6827.jpg?raw=true'], status: 'approved' },
      { id: 'p2', tailorId: 'u3', title: 'portfolio_p2_title', description: 'portfolio_p2_desc', price: 420, imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/8b1facb8-f876-4bb6-9434-1184d39783bc.jpg?raw=true'], status: 'pending' },
      { id: 'p3', tailorId: 'u3', title: 'portfolio_p3_title', description: 'portfolio_p3_desc', price: 380, imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/8b1facb8-f876-4bb6-9434-1184d39783bc.jpg?raw=true'], status: 'pending' },
  ]);

  // Design Studio State
  const [designSelections, setDesignSelections] = useState<any>({});
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [generatedAiImage, setGeneratedAiImage] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- Sub-renderers ---

  const StatusPill = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        approved: 'bg-green-500/20 text-green-300 border-green-500/30',
        pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
        completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${styles[status.toLowerCase()] || 'bg-gray-500/20 text-gray-300'}`}>
            {t(('status_' + status.toLowerCase()) as any)}
        </span>
    );
  };

  const MetricCard = ({ title, value, icon, trend }: { title: string, value: string | number, icon: string, trend?: string }) => (
    <div className={glassCardClass + " p-6 flex flex-col justify-between group hover:border-brand-gold"}>
        <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 text-gray-300 group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                <Icon name={icon} className="w-4 h-4" />
            </div>
            {trend && <span className="text-[10px] font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded-md">+{trend}</span>}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-2xl font-serif text-white">{value}</h3>
        </div>
    </div>
  );

  const DesignStudio = () => {
      
    const handleGenerateAI = async () => {
        if (Object.keys(designSelections).length === 0) {
            alert(t('dashboard_design_no_selection'));
            return;
        }

        setIsGeneratingAi(true);
        setGeneratedAiImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const partsDescription = [
                designSelections.top ? `Top: ${t(designSelections.top.name as any)}` : '',
                designSelections.bottom ? `Bottom: ${t(designSelections.bottom.name as any)}` : '',
                designSelections.sleeve ? `Sleeves: ${t(designSelections.sleeve.name as any)}` : '',
                designSelections.fabric ? `Fabric: ${t(designSelections.fabric.name as any)}` : '',
                designSelections.embellishment ? `Embellishment: ${t(designSelections.embellishment.name as any)}` : '',
            ].filter(Boolean).join(', ');

            const prompt = `Create a high-fashion, realistic full-body photograph of a dress. The dress has the following specifications: ${partsDescription}. The color of the dress is ${selectedColor}. The style should be elegant and suitable for a boutique display. Professional studio lighting, 4k resolution, white background.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio: '3:4', imageSize: '1K' }
                }
            });

            if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64EncodeString = part.inlineData.data;
                        const imageUrl = `data:image/png;base64,${base64EncodeString}`;
                        setGeneratedAiImage(imageUrl);
                        break;
                    }
                }
            } else {
                throw new Error("No image generated");
            }

        } catch (error) {
            console.error("AI Generation Error:", error);
            alert(t('dashboard_design_ai_error'));
        } finally {
            setIsGeneratingAi(false);
        }
    };

    return (
      <div className="animate-fade-in">
          <div className="mb-8">
              <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_design_title')}</h2>
              <p className="text-sm text-gray-300">{t('dashboard_design_summary')}</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                  {['top', 'bottom', 'sleeve', 'fabric', 'embellishment'].map(partType => (
                      <div key={partType} className={glassCardClass + " p-6"}>
                          <h4 className="font-bold uppercase tracking-widest text-xs mb-4 text-brand-gold">{t(`design_part_${partType}` as any)}</h4>
                          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                              {dressParts.filter(p => p.type === partType).map(part => (
                                  <button 
                                    key={part.id} 
                                    onClick={() => setDesignSelections({...designSelections, [partType]: part})}
                                    className={`flex-shrink-0 w-24 p-2 rounded-xl border transition-all ${designSelections[partType]?.id === part.id ? 'border-brand-gold bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                                  >
                                      <div className="w-full h-20 bg-white rounded-lg mb-2 overflow-hidden">
                                          <img src={part.imageUrl} className="w-full h-full object-cover" alt={part.name} />
                                      </div>
                                      <p className="text-[9px] font-bold text-center truncate text-white">{t(part.name as any)}</p>
                                  </button>
                              ))}
                          </div>
                      </div>
                  ))}
                  <div className={glassCardClass + " p-6"}>
                        <h4 className="font-bold uppercase tracking-widest text-xs mb-4 text-brand-gold">{t('design_color_picker_label')}</h4>
                        <div className="flex items-center gap-4">
                            <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-16 h-16 rounded cursor-pointer border-0" />
                            <span className="font-mono text-xs text-white">{selectedColor}</span>
                        </div>
                  </div>
              </div>
              <div className="space-y-6">
                  <div className={glassCardClass + " p-6 sticky top-6"}>
                      <h3 className="font-serif text-xl mb-4 text-white">{t('dashboard_design_preview')}</h3>
                      
                      <div className="aspect-[3/4] bg-white/5 rounded-xl mb-4 flex items-center justify-center text-gray-400 overflow-hidden relative border border-white/10">
                          {isGeneratingAi ? (
                              <div className="text-center p-4">
                                  <svg className="animate-spin h-8 w-8 text-brand-gold mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <p className="text-xs text-white">{t('dashboard_design_generating')}</p>
                              </div>
                          ) : generatedAiImage ? (
                              <img src={generatedAiImage} alt="AI Generated Dress" className="w-full h-full object-cover" />
                          ) : (
                              <div className="text-center p-4">
                                  <Icon name="sparkles" className="w-8 h-8 mx-auto mb-2 opacity-50 text-brand-gold" />
                                  <p className="text-xs text-gray-300">{t('dashboard_design_no_selection')}</p>
                              </div>
                          )}
                      </div>

                      <button 
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAi}
                        className="w-full py-3 mb-3 bg-brand-gold text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                      >
                          <Icon name="sparkles" className="w-4 h-4" />
                          {t('dashboard_design_ai_button')}
                      </button>

                      <div className="space-y-2 mb-6">
                          {Object.keys(designSelections).map(key => (
                              <div key={key} className="flex justify-between text-xs">
                                  <span className="text-gray-400 capitalize">{t(`design_part_${key}` as any)}:</span>
                                  <span className="font-bold text-white">{t(designSelections[key]?.name as any)}</span>
                              </div>
                          ))}
                      </div>

                      <button 
                        onClick={() => {
                            const newDesign: SavedDesign = {
                                id: Date.now().toString(),
                                name: 'dashboard_design_default_name', // Save the KEY not the translated string
                                createdAt: new Date(),
                                parts: designSelections,
                                selectedColor: selectedColor,
                                generatedImageUrl: generatedAiImage || undefined
                            };
                            setSavedDesigns([...savedDesigns, newDesign]);
                            alert(t('profile_save_success'));
                        }}
                        className={glassButtonClass}
                      >
                          {t('dashboard_design_save_button')}
                      </button>
                  </div>
              </div>
          </div>
      </div>
    );
  };

  const AdminProducts = () => (
      <div className="animate-fade-in text-start">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-serif text-white mb-1">{t('admin_products_title')}</h2>
                <p className="text-sm text-gray-300">{t('admin_products_subtitle')}</p>
            </div>
            <button 
                onClick={() => {
                     const newProduct: Product = {
                         id: Date.now(),
                         name: 'product_new_name', // Key
                         price: 0,
                         imageUrls: ['https://placehold.co/400x600?text=New+Product'],
                         sizes: ['S', 'M', 'L']
                     };
                     setProducts([...products, newProduct]);
                }}
                className="px-6 py-2 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white"
            >
                {t('admin_products_add_button')}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                  <div key={product.id} className={glassCardClass + " overflow-hidden group"}>
                      <div className="aspect-[3/4] relative">
                          <img src={product.imageUrls[0]} alt={t(product.name as any)} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                                className="px-4 py-2 bg-white text-red-500 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-gray-100"
                              >
                                  {t('admin_products_action_delete')}
                              </button>
                          </div>
                      </div>
                      <div className="p-4">
                          <h3 className="font-bold text-white">{t(product.name as any)}</h3>
                          <p className="text-sm text-gray-300">${product.price}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const AdminSocials = () => (
      <div className="animate-fade-in text-start">
           <div className="mb-8">
              <h2 className="text-3xl font-serif text-white mb-1">{t('admin_socials_title')}</h2>
              <p className="text-sm text-gray-300">{t('admin_socials_subtitle')}</p>
          </div>
          <div className={glassCardClass + " p-6"}>
              {socialLinks.map((link, idx) => (
                  <div key={link.name} className="flex items-center gap-4 mb-4 pb-4 border-b last:border-0 border-white/10">
                      <div className="p-2 bg-white/10 rounded-lg text-white">{link.icon}</div>
                      <div className="flex-1">
                          <p className="font-bold text-xs uppercase tracking-widest text-white mb-1">{link.name}</p>
                          <input 
                            type="text" 
                            value={link.href} 
                            onChange={(e) => {
                                const newLinks = [...socialLinks];
                                newLinks[idx].href = e.target.value;
                                setSocialLinks(newLinks);
                            }}
                            className="w-full text-sm text-gray-300 bg-transparent border-none focus:ring-0 p-0 placeholder-gray-500" 
                          />
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer scale-75">
                            <input 
                                type="checkbox" 
                                checked={link.isEnabled} 
                                onChange={() => {
                                    const newLinks = [...socialLinks];
                                    newLinks[idx].isEnabled = !newLinks[idx].isEnabled;
                                    setSocialLinks(newLinks);
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                  </div>
              ))}
              <button onClick={() => alert(t('admin_socials_success'))} className={glassButtonClass + " mt-4"}>
                  {t('admin_socials_save')}
              </button>
          </div>
      </div>
  );

  const AdminOrders = () => (
      <div className="animate-fade-in text-start">
          <div className="mb-8">
              <h2 className="text-3xl font-serif text-white mb-1">{t('admin_orders_title')}</h2>
          </div>
          <div className={glassCardClass + " overflow-hidden"}>
             <table className="w-full text-start">
                  <thead className="bg-white/5 text-gray-300 uppercase text-[9px] font-bold tracking-[0.15em] border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">{t('admin_orders_table_id')}</th>
                        <th className="px-6 py-4">{t('admin_orders_table_customer')}</th>
                        <th className="px-6 py-4">{t('admin_orders_table_price')}</th>
                        <th className="px-6 py-4">{t('admin_orders_table_status')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                      {orders.map(order => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-gray-300">{order.id}</td>
                              <td className="px-6 py-4 text-xs font-bold text-white">{users.find(u => u.id === order.customerId)?.firstName}</td>
                              <td className="px-6 py-4 text-xs text-white">${order.price || '-'}</td>
                              <td className="px-6 py-4"><StatusPill status={order.status} /></td>
                          </tr>
                      ))}
                      {orders.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">{t('dashboard_no_orders')}</td></tr>
                      )}
                  </tbody>
             </table>
          </div>
      </div>
  );

  const ManagerOverview = () => (
    <div className="animate-fade-in text-start">
        <div className="mb-10">
            <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_welcome_user')}, {userRole === 'manager' ? 'Admin' : users[0].firstName}</h2>
            <p className="text-sm text-gray-300">{t('dashboard_welcome_message')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <MetricCard title={t('admin_stat_total_users')} value={users.length} icon="users" trend="12%" />
            <MetricCard title={t('admin_stat_total_orders')} value={orders.length} icon="shopping-bag" trend="5%" />
            <MetricCard title={t('admin_stat_total_revenue')} value={`$${(orders.reduce((acc, curr) => acc + (curr.price || 0), 0)).toFixed(0)}`} icon="credit-card" trend="20%" />
            <MetricCard title={t('admin_stat_pending_approvals')} value={portfolioItems.filter(i => i.status === 'pending').length} icon="check-circle" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className={glassCardClass + " overflow-hidden"}>
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="font-serif text-xl text-white">{t('dashboard_recent_activity')}</h3>
                        <button onClick={() => setCurrentView('admin-orders')} className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:underline">{t('dashboard_view_all')}</button>
                    </div>
                    <div className="divide-y divide-white/10">
                        {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold"><Icon name="box" className="w-4 h-4"/></div>
                                    <div><p className="font-bold text-sm text-white">{t('order_id')} #{order.id.slice(-6)}</p><p className="text-[11px] text-gray-400">{users.find(u => u.id === order.customerId)?.firstName} • {new Date(order.createdAt).toLocaleDateString()}</p></div>
                                </div>
                                <StatusPill status={order.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="space-y-8">
                <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-white/10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                    <h3 className="text-xl font-serif mb-6 relative z-10">{t('dashboard_boutique_ops')}</h3>
                    <div className="space-y-2 relative z-10">
                        <button onClick={() => setCurrentView('admin-products')} className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start">
                            <span className="text-xs font-medium">{t('dashboard_menu_admin_products')}</span>
                            <Icon name="shopping-bag" className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCurrentView('admin-socials')} className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-start">
                            <span className="text-xs font-medium">{t('dashboard_menu_admin_socials')}</span>
                            <Icon name="share" className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className={glassCardClass + " p-5 text-start"}>
                    <h4 className="font-serif text-lg text-white mb-4">{t('dashboard_approvals_waitlist')}</h4>
                    <div className="space-y-4">
                        {portfolioItems.filter(i => i.status === 'pending').slice(0, 3).map(i => (
                            <div key={i.id} className="flex items-center gap-3">
                                <img src={i.imageUrls[0]} className="w-10 h-10 rounded-lg object-cover" alt=""/>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold text-xs text-white truncate">{t(i.title as any)}</p>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">{t('dashboard_portfolio_request')}</p>
                                </div>
                                <button onClick={() => setCurrentView('admin-approvals')} className="text-brand-gold font-bold text-[9px] hover:underline uppercase tracking-widest">{t('dashboard_review_action')}</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const AdminUsers = () => (
      <div className="animate-fade-in text-start">
          <div className="mb-8">
              <h2 className="text-3xl font-serif text-white mb-1">{t('admin_users_title')}</h2>
              <p className="text-sm text-gray-300">{t('admin_users_subtitle')}</p>
          </div>
          <div className={glassCardClass + " overflow-hidden"}>
              <table className="w-full text-start">
                  <thead className="bg-white/5 text-gray-300 uppercase text-[9px] font-bold tracking-[0.15em] border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4">{t('admin_users_table_name')}</th>
                        <th className="px-6 py-4">{t('admin_users_table_role')}</th>
                        <th className="px-6 py-4">{t('admin_users_table_balance')}</th>
                        <th className="px-6 py-4 text-end"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                      {users.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-6 py-4 text-start">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-brand-gold font-bold text-xs">
                                          {u.firstName[0]}{u.lastName[0]}
                                      </div>
                                      <div><p className="font-bold text-sm text-white leading-none mb-1">{u.firstName} {u.lastName}</p><p className="text-[10px] text-gray-400 font-normal">{u.email}</p></div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-start"><span className="text-[10px] uppercase font-bold text-gray-400">{t(('signup_form_role_' + u.role) as any)}</span></td>
                              <td className="px-6 py-4 font-serif text-base font-medium text-white">${u.balance.toFixed(2)}</td>
                              <td className="px-6 py-4 text-end">
                                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <button onClick={() => { setSelectedUserForWallet(u); setIsUserWalletModalOpen(true); }} className="text-white hover:text-brand-gold text-[10px] font-bold uppercase tracking-widest">{t('admin_users_action_wallet')}</button>
                                      <button onClick={() => { if(confirm(t('admin_users_delete_confirm'))) setUsers(users.filter(user => user.id !== u.id)); }} className="text-red-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest">{t('admin_users_action_delete')}</button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const AdminPayments = () => (
    <div className="animate-fade-in text-start">
        <div className="mb-8">
            <h2 className="text-3xl font-serif text-white mb-1">{t('admin_payments_title')}</h2>
            <p className="text-sm text-gray-300">{t('admin_payments_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
                <div key={method.id} className={glassCardClass + ` p-6 ${method.isActive ? 'border-brand-gold/20' : 'border-white/10 grayscale opacity-60'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <img src={method.imgUrl} className="h-10 w-auto object-contain" alt={method.id} />
                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                            <input 
                                type="checkbox" 
                                checked={method.isActive} 
                                onChange={() => {
                                    setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, isActive: !m.isActive } : m));
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
                        </label>
                    </div>
                    <h3 className="font-bold text-white mb-1 uppercase tracking-widest text-xs">{t(method.translationKey as any)}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mb-4">{method.isActive ? t('admin_payments_status_active') : t('admin_payments_status_inactive')}</p>
                    
                    <button className="w-full py-2.5 border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 text-white transition-colors">
                        {t('admin_payments_configure')}
                    </button>
                </div>
            ))}
        </div>
    </div>
  );

  const ProfessionalPortfolio = () => (
      <div className="animate-fade-in text-start">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_menu_portfolio')}</h2>
                <p className="text-sm text-gray-300">{t('portfolio_subtitle')}</p>
            </div>
            <button className="px-6 py-2 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white">
                {t('tailor_portfolio_add_button')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map(item => (
                  <div key={item.id} className={glassCardClass + " overflow-hidden"}>
                      <div className="aspect-square relative">
                          <img src={item.imageUrls[0]} alt={t(item.title as any)} className="w-full h-full object-cover"/>
                          <div className="absolute top-2 right-2">
                              <StatusPill status={item.status} />
                          </div>
                      </div>
                      <div className="p-4">
                          <h4 className="font-bold text-white mb-1">{t(item.title as any)}</h4>
                          <p className="text-xs text-gray-400">{t(item.description as any)}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const MyDesigns = () => (
      <div className="animate-fade-in text-start">
           <div className="mb-8">
              <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_menu_my_designs')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDesigns.length === 0 ? (
                  <div className={glassCardClass + " col-span-3 text-center py-20"}>
                      <p className="text-gray-400 mb-4">{t('dashboard_no_designs')}</p>
                      <button onClick={() => setCurrentView('design')} className="text-brand-gold font-bold uppercase tracking-widest text-xs hover:underline">{t('dashboard_menu_create_design')}</button>
                  </div>
              ) : (
                  savedDesigns.map(design => (
                      <div key={design.id} className={glassCardClass + " p-4"}>
                          <div className="aspect-[3/4] bg-white/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                              {design.generatedImageUrl ? (
                                  <img src={design.generatedImageUrl} alt={t(design.name as any)} className="w-full h-full object-cover" />
                              ) : (
                                  <Icon name="palette" className="w-8 h-8 text-gray-500" />
                              )}
                          </div>
                          <h4 className="font-bold text-white">{t(design.name as any)}</h4>
                          <p className="text-xs text-gray-400 mb-4">{new Date(design.createdAt).toLocaleDateString()}</p>
                          <button className="w-full py-2 border border-white/20 text-white font-bold uppercase tracking-widest text-[10px] rounded hover:bg-white hover:text-black transition">
                              {t('dashboard_send_to_tailor')}
                          </button>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  const SidebarItem = ({ view, icon, label }: { view: DashboardView, icon: string, label: string }) => (
    <button 
        onClick={() => setCurrentView(view)} 
        className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${currentView === view ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
    >
        <div className="flex-shrink-0">
             <Icon name={icon} className={`w-4 h-4 transition-colors duration-300 ${currentView === view ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-[0.1em] text-start leading-none ${currentView === view ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
    </button>
  );

  const dashboardBackgroundImage = ROLE_IMAGES[userRole] || ROLE_IMAGES.default;

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative text-white">
      {/* Dynamic Background matching Login Page */}
      <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${dashboardBackgroundImage}')` }}
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      {/* FIXED Sidebar - Glassmorphism */}
      <aside className="fixed top-0 bottom-0 w-64 md:w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex-shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar z-40 hidden md:flex">
          <div className="p-8 pb-0 text-center">
             <h1 className="font-serif text-xl font-black tracking-[0.15em] text-white mb-1">MODEYA</h1>
             <p className="text-[8px] font-bold text-brand-gold uppercase tracking-[0.2em]">{t('dashboard_management_suite')}</p>
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
                        <div className="mt-6 mb-2 px-3 text-start"><span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('dashboard_sidebar_admin')}</span></div>
                        <SidebarItem view="admin-orders" icon="clipboard" label={t('dashboard_menu_admin_orders')} />
                        <SidebarItem view="admin-approvals" icon="check-circle" label={t('dashboard_menu_admin_approvals')} />
                        <SidebarItem view="admin-products" icon="shopping-bag" label={t('dashboard_menu_admin_products')} />
                        <SidebarItem view="admin-users" icon="users" label={t('dashboard_menu_admin_users')} />
                        <SidebarItem view="admin-payments" icon="credit-card" label={t('dashboard_menu_admin_payments')} />
                        <SidebarItem view="admin-socials" icon="share" label={t('dashboard_menu_admin_socials')} />
                    </>
                  )}

                  <div className="mt-6 mb-2 px-3 text-start"><span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('dashboard_sidebar_personal')}</span></div>
                  <SidebarItem view="wallet" icon="credit-card" label={t('dashboard_menu_wallet')} />
                  <SidebarItem view="profile" icon="settings" label={t('dashboard_menu_profile')} />
              </nav>
          </div>
          
          <div className="p-6 mt-auto border-t border-white/10">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-start">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">
                        {userRole === 'manager' ? 'AD' : 'US'}
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-white leading-none mb-1">{userRole === 'manager' ? t('dashboard_admin_access') : t('dashboard_user_account')}</p>
                        <p className="text-[7px] text-gray-400 leading-none">{t('dashboard_version_premium')}</p>
                    </div>
                </div>
                {/* LARGER LOGOUT BUTTON */}
                <button 
                    onClick={() => onNavigate('home')} 
                    title={t('dashboard_menu_logout')}
                    className="p-3 rounded-lg text-red-400 hover:bg-white/10 transition-colors shadow-sm"
                >
                    <Icon name="logout" className="w-6 h-6" />
                </button>
             </div>
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative min-h-screen md:ms-64 transition-all duration-300">
          <div className="relative z-10 p-6 md:p-10 max-w-6xl mx-auto">
              {currentView === 'overview' && <ManagerOverview />}
              {currentView === 'admin-users' && <AdminUsers />}
              {currentView === 'admin-payments' && <AdminPayments />}
              {currentView === 'admin-products' && <AdminProducts />}
              {currentView === 'admin-socials' && <AdminSocials />}
              {currentView === 'admin-orders' && <AdminOrders />}
              {currentView === 'design' && <DesignStudio />}
              {currentView === 'my-designs' && <MyDesigns />}
              {(currentView === 'portfolio' || currentView === 'admin-approvals') && <ProfessionalPortfolio />}
              
              {/* Fallback for other views */}
              {!['overview', 'admin-users', 'admin-payments', 'admin-products', 'admin-socials', 'admin-orders', 'design', 'my-designs', 'portfolio', 'admin-approvals'].includes(currentView) && (
                <div className={glassCardClass + " p-16 md:p-24 text-center"}>
                    <h2 className="text-2xl font-serif text-white mb-4 capitalize">{t(`dashboard_menu_${currentView.replace(/-/g, '_')}` as any)}</h2>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8">{t('dashboard_feature_coming_soon')}</p>
                    <button onClick={() => setCurrentView('overview')} className={glassButtonClass + " w-auto px-8"}>
                        {t('dashboard_return_to_overview')}
                    </button>
                </div>
              )}
          </div>
      </main>

      {/* Admin Wallet Modal */}
      {isUserWalletModalOpen && selectedUserForWallet && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className={glassCardClass + " p-8 max-w-md w-full text-start"}>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-brand-gold font-bold text-xl">
                          {selectedUserForWallet.firstName[0]}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-white">{t('admin_wallet_modal_title')}</h3>
                        <p className="text-sm text-gray-300">{selectedUserForWallet.firstName} {selectedUserForWallet.lastName}</p>
                      </div>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl mb-6 text-center border border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('admin_wallet_current_balance')}</p>
                      <p className="text-4xl font-serif text-white font-bold">${selectedUserForWallet.balance.toFixed(2)}</p>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('admin_wallet_action_label')}</label>
                        <select className={glassInputClass} value={adminWalletAction} onChange={(e) => setAdminWalletAction(e.target.value as any)}>
                            <option value="add" className="bg-gray-800">{t('admin_wallet_action_add')}</option>
                            <option value="deduct" className="bg-gray-800">{t('admin_wallet_action_deduct')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('admin_wallet_amount_label')}</label>
                        <input type="number" className={glassInputClass} placeholder="0.00" value={adminWalletAmount} onChange={e => setAdminWalletAmount(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setIsUserWalletModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">{t('modal_cancel')}</button>
                      <button onClick={() => { 
                          const amt = parseFloat(adminWalletAmount); 
                          setUsers(users.map(u => u.id === selectedUserForWallet.id ? { ...u, balance: adminWalletAction === 'add' ? u.balance + amt : u.balance - amt } : u));
                          setIsUserWalletModalOpen(false); 
                          setAdminWalletAmount('');
                      }} className="flex-1 py-4 bg-white text-black rounded-xl shadow-lg font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold hover:text-white transition-colors">{t('admin_wallet_submit')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserDashboard;