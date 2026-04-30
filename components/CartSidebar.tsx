import React from 'react';
import { CartItem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (productId: number, size: string) => void;
  onUpdateQuantity: (productId: number, size: string, newQuantity: number) => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, cartItems, onRemove, onUpdateQuantity }) => {
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const sidebarPositionClass = direction === 'rtl' ? 'left-0' : 'right-0';
  const sidebarTransformClass = isOpen
    ? 'translate-x-0'
    : direction === 'rtl'
    ? '-translate-x-full'
    : 'translate-x-full';

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${sidebarPositionClass} h-full w-full max-w-sm bg-brand-beige shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${sidebarTransformClass} flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="cart-title" className="text-xl font-serif text-black">{t('cart_title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black" aria-label="Close cart">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500">{t('cart_empty')}</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-6">
            <ul className="space-y-6">
              {cartItems.map(item => (
                <li key={`${item.product.id}-${item.size}`} className="flex items-start space-x-4">
                  <img src={item.product.imageUrls[0]} alt={t(item.product.name as any)} className="w-20 h-24 object-cover border border-gray-200" />
                  <div className="flex-grow text-sm">
                    <h3 className="font-semibold text-black">{t(item.product.name as any)}</h3>
                    {item.product.sizes && <p className="text-gray-500">{t('product_modal_size')}: {item.size}</p>}
                    <p className="text-gray-600 mt-1">${item.product.price.toFixed(2)}</p>
                    <div className="flex items-center mt-3 border border-gray-300 w-fit">
                      <button onClick={() => onUpdateQuantity(item.product.id, item.size, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100">-</button>
                      <span className="px-3 py-1">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product.id, item.size, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                    </div>
                  </div>
                  <button onClick={() => onRemove(item.product.id, item.size)} className="text-gray-400 hover:text-red-500" aria-label={`${t('cart_remove_item')} ${t(item.product.name as any)}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cartItems.length > 0 && (
            <footer className="p-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-black">{t('cart_subtotal')}</span>
                <span className="text-lg font-semibold text-black">${subtotal.toFixed(2)}</span>
                </div>
                <button className="w-full bg-black text-white py-3 tracking-widest text-sm font-semibold hover:bg-gray-800 transition-colors duration-300">
                {t('cart_checkout')}
                </button>
            </footer>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;