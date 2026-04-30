
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

export interface DressPart {
  id: string;
  type: 'top' | 'bottom' | 'sleeve' | 'fabric' | 'embellishment';
  name: string;
  imageUrl?: string; 
}

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: Date;
  parts: {
    top?: DressPart;
    bottom?: DressPart;
    sleeve?: DressPart;
    fabric?: DressPart;
    embellishment?: DressPart;
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
  design: SavedDesign;
  tailorId: string;
  measurements: Measurements;
  status: 'pending_quote' | 'priced' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  createdAt: Date;
  chatHistory?: ChatMessage[];
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
