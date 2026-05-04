
import React from 'react';
import { Product, DressPart, Tailor } from './types';

export const NAV_LINKS: {key: string; page: 'shop' | 'home'; anchor?: string}[] = [
  { key: 'header_shop', page: 'shop' },
  { key: 'header_about', page: 'home', anchor: '#about' },
  { key: 'header_contact', page: 'home', anchor: '#contact' },
];

export const SOCIAL_LINKS = [
  { 
    name: 'Instagram', 
    href: 'https://instagram.com/modeya', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="insta-gradient" cx="0.3" cy="1" r="1">
            <stop offset="0%" stopColor="#F9C942" />
            <stop offset="25%" stopColor="#F2A63C" />
            <stop offset="50%" stopColor="#E45244" />
            <stop offset="75%" stopColor="#C22A71" />
            <stop offset="100%" stopColor="#9A2299" />
          </radialGradient>
        </defs>
        <path fill="url(#insta-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668 0.014 15.259 0 12 0zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/>
      </svg>
    ) 
  },
  { 
    name: 'Pinterest', 
    href: 'https://pinterest.com/modeya', 
    icon: <svg className="w-5 h-5" fill="#E60023" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" /></svg> },
  { 
    name: 'Facebook', 
    href: 'https://facebook.com/modeya', 
    icon: <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.732 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg> },
  { 
    name: 'Twitter', 
    href: 'https://twitter.com/modeya', 
    icon: <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.223.085c.645 1.956 2.52 3.379 4.734 3.419-1.729 1.354-3.91 2.16-6.28 2.16-.405 0-.805-.023-1.2-.074 2.24 1.434 4.896 2.27 7.732 2.27 9.284 0 14.368-7.69 14.368-14.368 0-.219-.005-.436-.015-.652a10.375 10.375 0 002.548-2.648z" /></svg> },
];

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const PRODUCTS: Product[] = [
  { 
    id: 1, 
    name: 'product_crimson_name', 
    description: 'product_crimson_desc',
    price: 150.00, 
    imageUrls: [
      'https://raw.githubusercontent.com/boshrasaman/PHOTO_DESGAIN/refs/heads/main/08e15fff-5e15-41d1-86c7-5a5e8df2a37a.jpg',
      'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/Generated%20Image%20November%2013,%202025%20-%203_41AM%20(2).png?raw=true',
      'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/Generated%20Image%20November%2013,%202025%20-%203_56AM.png?raw=true',
      'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/Generated%20Image%20November%2013,%202025%20-%203_42AM.png?raw=true',
      'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/Generated%20Image%20November%2013,%202025%20-%203_42AM%20(1).png?raw=true'
    ],
    sizes: STANDARD_SIZES,
    reviews: [
      { author: 'Noor', rating: 5, comment: 'Absolutely stunning dress! The fabric is high quality and it fits perfectly. I received so many compliments.' },
      { author: 'Fatima', rating: 4, comment: 'Beautiful design and color. It\'s a little long for me, but nothing a small alteration can\'t fix. Overall, I love it.' },
      { author: 'Layla', rating: 5, comment: 'Perfect for special occasions. It feels very luxurious and comfortable to wear.' }
    ]
  },
  { 
      id: 2, 
      name: 'product_ember_name', 
      description: 'product_ember_desc',
      price: 80.00, 
      imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/8b1facb8-f876-4bb6-9434-1184d39783bc.jpg?raw=true'],
      sizes: STANDARD_SIZES,
  },
  { 
      id: 3, 
      name: 'product_pearl_name', 
      description: 'product_pearl_desc',
      price: 120.00, 
      imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/WhatsApp%20Image%202025-11-13%20at%202.22.11%20AM.jpeg?raw=true'],
      sizes: STANDARD_SIZES,
  },
  { 
      id: 4, 
      name: 'product_moonlit_name', 
      description: 'product_moonlit_desc',
      price: 250.00, 
      imageUrls: ['https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/9d86cb91-bae4-4c50-b229-260ea30b6827.jpg?raw=true'],
      sizes: STANDARD_SIZES,
  },
];

// Mock Data for Dress Parts with Visualization Images
export const DRESS_PARTS: DressPart[] = [
  // Front Neckline
  { id: 'front_neckline_1', type: 'front_neckline', name: 'part_v_neck', imageUrl: 'https://cdn-icons-png.flaticon.com/512/9281/9281147.png' },
  { id: 'front_neckline_2', type: 'front_neckline', name: 'part_off_shoulder', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2290/2290518.png' },
  { id: 'front_neckline_3', type: 'front_neckline', name: 'part_halter', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3365/3365457.png' },
  // Skirt Styles
  { id: 'skirt_styles_1', type: 'skirt_styles', name: 'part_a_line', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1867/1867631.png' },
  { id: 'skirt_styles_2', type: 'skirt_styles', name: 'part_mermaid', imageUrl: 'https://cdn-icons-png.flaticon.com/512/12462/12462992.png' },
  { id: 'skirt_styles_3', type: 'skirt_styles', name: 'part_ball_gown', imageUrl: 'https://cdn-icons-png.flaticon.com/512/9398/9398928.png' },
  // Back Neckline
  { id: 'back_neckline_1', type: 'back_neckline', name: 'part_long_lace', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5266/5266654.png' },
  { id: 'back_neckline_2', type: 'back_neckline', name: 'part_puff', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2290/2290495.png' },
  { id: 'back_neckline_3', type: 'back_neckline', name: 'part_sleeveless', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3109/3109804.png' },
  
  // Fabrics - Updated with specific fabrics and images
  { id: 'fab_tulle_glitter', type: 'fabrics', name: 'fabric_tulle_glitter', imageUrl: 'https://raw.githubusercontent.com/boshrasaman/PHOTO_DESGAIN/b5944f5905565306a22782e3fa5853cd3e8bedbb/71KtFxt74aL._AC_SX679_.jpg' },
  { id: 'fab_organza', type: 'fabrics', name: 'fabric_organza', imageUrl: 'https://raw.githubusercontent.com/boshrasaman/PHOTO_DESGAIN/b5944f5905565306a22782e3fa5853cd3e8bedbb/%D8%A3%D9%88%D8%B1%D8%BA%D9%86%D8%B2%D8%A7%20(Organza).webp' },
  { id: 'fab_tulle', type: 'fabrics', name: 'fabric_tulle', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D8%AA%D9%88%D9%84%20(Tulle).webp?raw=true' },
  { id: 'fab_georgette', type: 'fabrics', name: 'fabric_georgette', imageUrl: 'https://raw.githubusercontent.com/boshrasaman/PHOTO_DESGAIN/b5944f5905565306a22782e3fa5853cd3e8bedbb/%D8%AC%D9%88%D8%B1%D8%AC%D9%8A%D8%AA%20(Georgette).webp' },
  { id: 'fab_chiffon', type: 'fabrics', name: 'fabric_chiffon', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D8%B4%D9%8A%D9%81%D9%88%D9%86%20(Chiffon).webp?raw=true' },
  { id: 'fab_linen', type: 'fabrics', name: 'fabric_linen', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D9%84%D9%8A%D9%86%D9%8A%D9%86%20(Linen).webp?raw=true' },
  { id: 'fab_velvet', type: 'fabrics', name: 'fabric_velvet', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D9%85%D8%AE%D9%85%D9%84%20(Velvet).webp?raw=true' },
  { id: 'fab_crepe', type: 'fabrics', name: 'fabric_crepe', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D9%83%D8%B1%D9%8A%D8%A8%20(Crepe).webp?raw=true' },
  { id: 'fab_lace', type: 'fabrics', name: 'fabric_lace', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D8%AF%D8%A7%D9%86%D8%AA%D9%8A%D9%84%20(Lace).webp?raw=true' },
  { id: 'fab_silk', type: 'fabrics', name: 'fabric_silk', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D8%AD%D8%B1%D9%8A%D8%B1%20(Silk).webp?raw=true' },
  { id: 'fab_jersey', type: 'fabrics', name: 'fabric_jersey', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/%D8%AC%D9%8A%D8%B1%D8%B3%D9%8A%20(Jersey).webp?raw=true' },
  { id: 'fab_sequin', type: 'fabrics', name: 'fabric_sequin', imageUrl: 'https://github.com/boshrasaman/PHOTO_DESGAIN/blob/main/fluweel-paillet-oudroze%20(1).webp?raw=true' },

  // Train
  { id: 'train_1', type: 'train', name: 'Pearls', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2655/2655340.png' },
  { id: 'train_2', type: 'train', name: 'Swarovski Crystals', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3989/3989608.png' },
  { id: 'train_3', type: 'train', name: 'Embroidery', imageUrl: 'https://cdn-icons-png.flaticon.com/512/4298/4298032.png' },
];

export const TAILORS: Tailor[] = [
    { id: 't1', name: 'Sara Al-Ali', rating: 4.8 },
    { id: 't2', name: 'Layla Design Studio', rating: 4.9 },
    { id: 't3', name: 'Elegant Stitch', rating: 4.5 },
];

export const FOOTER_LINKS = {
    shop: [
        { key: 'footer_shop_dresses', href: '#' },
        { key: 'footer_shop_tops', href: '#' },
        { key: 'footer_shop_skirts', href: '#' },
        { key: 'footer_shop_jackets', href: '#' },
        { key: 'footer_shop_shoes', href: '#' },
    ],
    store: [
        { key: 'footer_store_hours_1', href: null },
        { key: 'footer_store_hours_2', href: null },
        { key: 'footer_store_hours_3', href: null },
    ],
    policy: [
        { key: 'footer_policy_shipping', href: '#' },
        { key: 'footer_policy_store', href: '#' },
        { key: 'footer_policy_payment', href: '#' },
        { key: 'footer_policy_faq', href: '#' },
    ]
};
