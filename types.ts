
import React from 'react';

export interface Review {
  author: string;
  rating: number; // 1-5
  comment: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string; // Added description
  price: number;
  imageUrls: string[];
  sizes?: string[];
  reviews?: Review[];
  stock?: { size: string, quantity: number }[];
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
  customization?: {
      isCustom: boolean;
      measurements?: Measurements;
      color?: string;
      notes?: string;
  };
}

export type UserRole = 'customer' | 'manager' | 'designer' | 'tailor';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  balance: number;
  phone?: string;
  joinedDate: Date;
}

export type DressPartCategory = 'front_neckline' | 'back_neckline' | 'fabrics' | 'skirt_styles' | 'train';

export interface DressPart {
  id: string;
  type: DressPartCategory;
  name: string;
  imageUrl?: string; 
}

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: Date;
  parts: {
    front_neckline?: DressPart;
    back_neckline?: DressPart;
    fabrics?: DressPart;
    skirt_styles?: DressPart;
    train?: DressPart;
  };
  selectedColor?: string;
  generatedImageUrl?: string;
}

export interface Measurements {
  bust: string;
  waist: string;
  hips: string;
  shoulder: string;
  length: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'customer' or 'tailor'
  text: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  customerId: string;
  design?: SavedDesign;
  tailorId: string;
  measurements?: Measurements;
  status: 'pending_quote' | 'quote_submitted' | 'quote_accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  price?: number;
  createdAt: Date;
  chatHistory?: ChatMessage[];
  designType?: string;
  notes?: string;
}

export interface PortfolioItem {
  id: string;
  tailorId: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[]; // Updated to array
  status: 'pending' | 'approved' | 'rejected';
  stock?: { size: string, quantity: number }[];
}

export interface Tailor {
  id: string;
  name: string;
  rating: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  bio?: string; 
}

export interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  isEnabled: boolean;
}

export interface ApiDressPart {
  id: number;
  name: string;
  category: string;
  part_type?: string;
  image_url?: string;
  filename?: string;
  is_active: boolean;
}

export interface ApiDesign {
  id: number;
  designer_id?: number;
  name: string;
  description?: string;
  design_type: string;
  image_url: string;
  is_public: boolean;
  price?: number;
  created_at?: string;
}

export interface ApiOrder {
  id: number;
  customer_id: number;
  tailor_id?: number;
  design_id?: number;
  status: string;
  design_type: string;
  total_price?: number;
  selected_parts?: Record<string, unknown>;
  notes?: string;
  created_at?: string;
}

export interface ApiPortfolioItem {
  id: number;
  tailor_id: number;
  title: string;
  description?: string;
  price?: number;
  image_urls?: string[];
  stock?: Array<{ size: string; quantity: number }>;
  status: string;
  created_at?: string;
}

export interface ApiPaymentMethod {
  id: number;
  name: string;
  translation_key?: string;
  is_active: boolean;
  img_url?: string;
  type?: string;
  details?: Record<string, unknown>;
}

export interface ApiSocialLink {
  id: number;
  name: string;
  href?: string;
  is_enabled: boolean;
  icon_svg?: string;
}
