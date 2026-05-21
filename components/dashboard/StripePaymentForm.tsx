import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from '../../hooks/useTranslation';
import { glassCardClass, glassButtonClass } from './DashboardShared';

interface StripePaymentFormProps {
  amount: string;
  onSuccess: () => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ amount, onSuccess }) => {
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

    const { error: stripeError, token } = await stripe.createToken(cardElement as any);

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
          <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" className="h-5 w-auto" alt="Visa" />
          <img src="https://cdn-icons-png.flaticon.com/512/349/349228.png" className="h-5 w-auto" alt="Mastercard" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/90 p-4 rounded-xl border border-gray-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1A1A1A',
                  fontFamily: 'Montserrat, sans-serif',
                  '::placeholder': { color: '#9CA3AF' }
                }
              }
            }}
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={!stripe || processing || !amount}
          className={glassButtonClass}
        >
          {processing ? (
            <span className="animate-pulse">{t('wallet_processing')}</span>
          ) : (
            `${t('wallet_stripe_pay_now')} $${amount || '0.00'}`
          )}
        </button>
      </form>
    </div>
  );
};
