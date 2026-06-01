import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, GlassDropdown } from './DashboardShared';

interface PaymentMethod {
  id: string;
  translationKey: string;
  isActive: boolean;
  imgUrl: string;
  type: 'mobile_transfer' | 'remittance' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash_location' | 'wallet_qr';
  details: any;
}

interface AdminPaymentsProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ paymentMethods, setPaymentMethods }) => {
  const { t } = useTranslation();
  
  // Configure Modal State
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [detailsForm, setDetailsForm] = useState<Record<string, string>>({});
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Update image state for configure modal
  const [configureImgUrl, setConfigureImgUrl] = useState('');

  // Add Payment Method State
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'mobile_transfer' | 'remittance' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash_location' | 'wallet_qr'>('bank_transfer');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Helper for Payment Gateway Safe Fallback Icons (BUG-06)
  const getFallbackIcon = (type: string) => {
    switch (type) {
      case 'stripe':
      case 'paypal':
        return (
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'mobile_transfer':
        return (
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'remittance':
        return (
          <svg className="w-8 h-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const originalState = method.isActive;
    const nextState = !originalState;

    setPaymentMethods(prev =>
      prev.map(m => (m.id === method.id ? { ...m, isActive: nextState } : m))
    );

    try {
      await api.updatePaymentMethod(parseInt(method.id), { is_active: nextState });
    } catch (err: any) {
      // Rollback on fail
      setPaymentMethods(prev =>
        prev.map(m => (m.id === method.id ? { ...m, isActive: originalState } : m))
      );
      alert(err.message || 'Failed to update payment method status');
    }
  };

  const handleOpenConfigure = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setConfigureImgUrl(method.imgUrl || '');
    
    // Convert details structure to a list of key-values in state
    const currentDetails = method.details || {};
    const form: Record<string, string> = {};
    
    if (method.type === 'mobile_transfer' || method.type === 'wallet_qr') {
      form.phoneNumber = currentDetails.phoneNumber || '';
      form.paymentCode = currentDetails.paymentCode || '';
    } else if (method.type === 'remittance') {
      form.accountName = currentDetails.accountName || '';
      form.phoneNumber = currentDetails.phoneNumber || '';
      form.city = currentDetails.city || '';
      form.paymentCode = currentDetails.paymentCode || '';
    } else if (method.type === 'paypal') {
      form.email = currentDetails.email || '';
    } else if (method.type === 'cash_location') {
      form.address = currentDetails.address || '';
    } else if (method.type === 'bank_transfer') {
      form.bankName = currentDetails.bankName || '';
      form.accountNumber = currentDetails.accountNumber || '';
      form.iban = currentDetails.iban || '';
    }

    setDetailsForm(form);
    setIsConfigureOpen(true);
  };

  const handleConfigureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setIsConfiguring(true);
    try {
      await api.updatePaymentMethod(parseInt(selectedMethod.id), {
        details: detailsForm,
        img_url: configureImgUrl || null,
      });

      setPaymentMethods(prev =>
        prev.map(m => (m.id === selectedMethod.id ? { ...m, details: detailsForm, imgUrl: configureImgUrl } : m))
      );

      setIsConfigureOpen(false);
      setSelectedMethod(null);
      alert(t('profile_save_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to configure payment method settings');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      alert('Payment name is required');
      return;
    }

    setIsAdding(true);
    try {
      const added = await api.createPaymentMethod({
        name: newName,
        type: newType,
        img_url: newImgUrl || undefined,
        is_active: true,
        details: {},
      });

      const newMethod: PaymentMethod = {
        id: String(added.id),
        translationKey: added.translation_key || added.name,
        isActive: added.is_active,
        imgUrl: added.img_url || '',
        type: added.type as any,
        details: added.details || {},
      };

      setPaymentMethods(prev => [...prev, newMethod]);
      setIsAddMethodOpen(false);
      setNewName('');
      setNewImgUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to add custom payment method');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">{t('admin_payments_title')}</h2>
          <p className="text-sm text-gray-300">{t('admin_payments_subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddMethodOpen(true)}
          className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_payments_add_button' as any) || 'Add Payment Gateway'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={
              glassCardClass +
              ` p-6 flex flex-col justify-between ${method.isActive ? 'border-brand-gold/20' : 'border-white/10 grayscale opacity-60'}`
            }
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                {method.imgUrl ? (
                  <img
                    src={method.imgUrl}
                    className="h-10 w-auto max-w-[120px] object-contain"
                    alt={t(method.translationKey as any)}
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                      const next = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
                      if (next) next.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback Icon — shown only when no imgUrl or image fails */}
                <div
                  className="p-1 bg-white/5 rounded-lg border border-white/10"
                  style={{ display: method.imgUrl ? 'none' : 'flex' }}
                >
                  {getFallbackIcon(method.type)}
                </div>

                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    checked={method.isActive}
                    onChange={() => handleToggleActive(method)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
                </label>
              </div>

              <h3 className="font-bold text-white mb-1 uppercase tracking-widest text-xs">
                {t(method.translationKey as any)}
              </h3>
              <p className="text-xs text-gray-400 font-bold mb-4">
                {method.isActive
                  ? t('admin_payments_status_active')
                  : t('admin_payments_status_inactive')}
              </p>
            </div>

            <button
              onClick={() => handleOpenConfigure(method)}
              className="w-full py-2.5 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 text-white transition-colors"
            >
              {t('admin_payments_configure')}
            </button>
          </div>
        ))}
      </div>

      {/* Configure Payment Details Overlay (BUG-05) */}
      {isConfigureOpen && selectedMethod && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleConfigureSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
              {getFallbackIcon(selectedMethod.type)}
              <div>
                <h3 className="font-serif text-xl text-white">
                  {t('admin_payments_configure')}
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  {t(selectedMethod.translationKey as any)}
                </p>
              </div>
            </div>

            {/* Logo / Image URL */}
            <div className="border-b border-white/10 pb-4">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                {t('admin_payments_field_icon' as any) || 'Logo / Image URL'}
              </label>
              {configureImgUrl && (
                <div className="mb-3 flex items-center gap-3">
                  <img src={configureImgUrl} alt="Payment logo" className="h-10 w-auto max-w-[120px] object-contain rounded bg-white/10 p-1" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                </div>
              )}
              <input
                type="text"
                value={configureImgUrl}
                onChange={e => setConfigureImgUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Dynamic configure fields depending on payment channel type */}
            {(selectedMethod.type === 'mobile_transfer' || selectedMethod.type === 'wallet_qr') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                    {t('signup_form_phone_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.phoneNumber || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, phoneNumber: e.target.value })}
                    className={glassInputClass}
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                    {t('admin_payments_field_payment_code' as any)}
                  </label>
                  <input
                    type="text"
                    value={detailsForm.paymentCode || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, paymentCode: e.target.value })}
                    className={glassInputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('admin_payments_payment_code_hint' as any)}</p>
                </div>
              </div>
            )}

            {selectedMethod.type === 'remittance' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('admin_payments_field_account_name' as any) || 'Account Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.accountName || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, accountName: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('signup_form_phone_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.phoneNumber || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, phoneNumber: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('admin_payments_field_city' as any) || 'City / Location'}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.city || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, city: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('admin_payments_field_payment_code' as any)}
                  </label>
                  <input
                    type="text"
                    value={detailsForm.paymentCode || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, paymentCode: e.target.value })}
                    className={glassInputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('admin_payments_payment_code_hint' as any)}</p>
                </div>
              </div>
            )}

            {selectedMethod.type === 'paypal' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                  {t('contact_form_email')}
                </label>
                <input
                  type="email"
                  required
                  value={detailsForm.email || ''}
                  onChange={e => setDetailsForm({ ...detailsForm, email: e.target.value })}
                  className={glassInputClass}
                  placeholder="payments@company.com"
                />
              </div>
            )}

            {selectedMethod.type === 'cash_location' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">
                  {t('admin_payments_field_address' as any) || 'Branch Office Address'}
                </label>
                <input
                  type="text"
                  required
                  value={detailsForm.address || ''}
                  onChange={e => setDetailsForm({ ...detailsForm, address: e.target.value })}
                  className={glassInputClass}
                />
              </div>
            )}

            {selectedMethod.type === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('admin_payments_field_bank_name' as any) || 'Bank Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.bankName || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, bankName: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    {t('admin_payments_field_account_num' as any) || 'Account Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.accountNumber || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, accountNumber: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={detailsForm.iban || ''}
                    onChange={e => setDetailsForm({ ...detailsForm, iban: e.target.value })}
                    className={glassInputClass}
                  />
                </div>
              </div>
            )}

            {selectedMethod.type === 'stripe' && (
              <p className="text-xs text-gray-300 py-4">
                {t('admin_payments_stripe_note' as any) || 'Stripe configuration parameters are managed via secure Environment Variables backend integrations.'}
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsConfigureOpen(false);
                  setSelectedMethod(null);
                }}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isConfiguring}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isConfiguring ? t('wallet_processing') : t('profile_save_button' as any) || 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Gateway Modal */}
      {isAddMethodOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleAddPaymentSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('admin_payments_add_modal_title' as any) || 'Create Payment Method'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('admin_payments_field_name' as any) || 'Gateway Name'}
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className={glassInputClass}
                placeholder="e.g. Al-Baraka Bank"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('admin_payments_field_type' as any) || 'Gateway Type'}
              </label>
              <GlassDropdown
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'mobile_transfer', label: 'Mobile Wallet Transfer' },
                  { value: 'wallet_qr', label: 'Wallet QR (شام كاش / Usend)' },
                  { value: 'remittance', label: 'Remittance Agency' },
                  { value: 'cash_location', label: 'Cash / Head Office' },
                  { value: 'paypal', label: 'PayPal' },
                  { value: 'stripe', label: 'Stripe Card Element' },
                ]}
                value={newType}
                onChange={(v) => setNewType(v as any)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">
                {t('admin_payments_field_icon' as any) || 'Logo URL (Optional)'}
              </label>
              <input
                type="text"
                value={newImgUrl}
                onChange={e => setNewImgUrl(e.target.value)}
                className={glassInputClass}
                placeholder="https://example.com/logo.jpg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddMethodOpen(false)}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isAdding ? t('wallet_processing') : t('signup_form_submit_label' as any) || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
