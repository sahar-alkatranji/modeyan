
const API_BASE = 'http://localhost:8000/api/v1';

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  profile_image?: string;
  bio?: string;
  balance: number;
  pending_balance: number;
  created_at?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem('modeya_token');
    } catch (e) {
      console.error("Storage access blocked", e);
      this.token = null;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
      clearTimeout(id);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('API Request timed out after 5 seconds');
      }
      throw error;
    }
  }

  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('modeya_token', token);
    } catch (e) {
      console.error("Failed to write token to storage", e);
    }
  }

  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('modeya_token');
      localStorage.removeItem('modeya_user');
    } catch (e) {
      console.error("Failed to clear token from storage", e);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const data = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    const userData = { ...data.user, joinedDate: data.user.created_at || new Date().toISOString() };
    try {
      localStorage.setItem('modeya_user', JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to write user to storage", e);
    }
    return data;
  }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: string;
  }): Promise<TokenResponse> {
    const result = await this.request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.access_token);
    const userData = { ...result.user, joinedDate: result.user.created_at || new Date().toISOString() };
    try {
      localStorage.setItem('modeya_user', JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to write user to storage", e);
    }
    return result;
  }

  async getMe(): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/me');
  }

  async updateMe(data: Record<string, unknown>): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(old_password: string, new_password: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  async getWallet() {
    return this.request<{ id: number; balance: number; pending_balance: number }>('/wallet');
  }

  async topUpWallet(amount: number) {
    return this.request<{ id: number; balance: number; pending_balance: number }>('/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getParts(category?: string): Promise<any[]> {
    const params = category ? `?category=${category}` : '';
    return this.request<any[]>(`/parts${params}`);
  }

  async getDesigns(isPublic: boolean = true): Promise<any[]> {
    return this.request<any[]>(`/designs?is_public=${isPublic}`);
  }

  async getMyDesigns(): Promise<any[]> {
    return this.request<any[]>('/designs?is_public=false');
  }

  async createDesign(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/designs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDesign(id: number): Promise<any> {
    return this.request<any>(`/designs/${id}`, { method: 'DELETE' });
  }

  async getOrders(): Promise<any[]> {
    return this.request<any[]>('/orders');
  }

  async createOrder(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: number | string, status: string): Promise<any> {
    return this.request<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getAdminStats(): Promise<any> {
    return this.request<any>('/admin/stats');
  }

  async updateUserWallet(userId: number, action: 'add' | 'deduct', amount: number): Promise<any> {
    return this.request<any>(`/admin/users/${userId}/wallet`, {
      method: 'PUT',
      body: JSON.stringify({ action, amount }),
    });
  }

  async getPaymentMethods(): Promise<any[]> {
    return this.request<any[]>('/admin/payment-methods');
  }

  async updatePaymentMethod(id: number, data: Record<string, unknown>): Promise<any> {
    return this.request<any>(`/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createPaymentMethod(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/admin/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: number): Promise<any> {
    return this.request<any>(`/admin/payment-methods/${id}`, { method: 'DELETE' });
  }

  async getSocialLinks(): Promise<any[]> {
    return this.request<any[]>('/admin/social-links');
  }

  async updateSocialLinks(links: Array<{ name: string; href?: string; is_enabled: boolean }>): Promise<any> {
    return this.request<any>('/admin/social-links', {
      method: 'PUT',
      body: JSON.stringify({ links }),
    });
  }

  async getPublicSettings(): Promise<any> {
    return this.request<any>('/admin/settings/public');
  }

  async getPortfolio(): Promise<any[]> {
    return this.request<any[]>('/portfolio');
  }

  async getPendingPortfolio(): Promise<any[]> {
    return this.request<any[]>('/portfolio/pending');
  }

  async createPortfolioItem(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePortfolioItem(id: number): Promise<any> {
    return this.request<any>(`/portfolio/${id}/approve`, { method: 'PUT' });
  }

  async rejectPortfolioItem(id: number): Promise<any> {
    return this.request<any>(`/portfolio/${id}/reject`, { method: 'PUT' });
  }

  async cancelOrder(orderId: number): Promise<any> {
    return this.request<any>(`/orders/${orderId}`, { method: 'DELETE' });
  }

  async getOrderDetail(orderId: number): Promise<any> {
    return this.request<any>(`/orders/${orderId}`);
  }

  async getAdminOrders(): Promise<any[]> {
    return this.request<any[]>('/admin/orders');
  }

  async getUsers(role?: string): Promise<any[]> {
    const params = role ? `?role=${role}` : '';
    return this.request<any[]>(`/users${params}`);
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request<any>(`/users/${userId}`, { method: 'DELETE' });
  }

  async getTransactions(): Promise<any[]> {
    return this.request<any[]>('/transactions');
  }

  // Products Management aliases mapped to /designs backend
  async createProduct(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/designs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: Record<string, unknown>): Promise<any> {
    return this.request<any>(`/designs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<any> {
    return this.request<any>(`/designs/${id}`, { method: 'DELETE' });
  }

  // Design Assets mapping to /parts backend
  async createDesignAsset(data: { name: string; type: string; image_url: string }): Promise<any> {
    const payload = {
      name: data.name,
      category: data.type, // Map 'type' from frontend to 'category' in backend
      image_url: data.image_url
    };
    return this.request<any>('/parts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteDesignAsset(id: number): Promise<any> {
    return this.request<any>(`/parts/${id}`, { method: 'DELETE' });
  }

  // User Management
  async createUser(data: Record<string, unknown>): Promise<any> {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Professional Portfolio mappings
  async createPortfolio(data: Record<string, unknown>): Promise<any> {
    return this.createPortfolioItem(data);
  }

  async updatePortfolioStatus(id: number, status: 'approved' | 'rejected'): Promise<any> {
    if (status === 'approved') {
      return this.approvePortfolioItem(id);
    } else {
      return this.rejectPortfolioItem(id);
    }
  }
}

export const api = new ApiClient();
export type { TokenResponse, ApiUser };
