const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = localStorage.getItem('procureflow_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('procureflow_token', token);
    } else {
      localStorage.removeItem('procureflow_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = data?.error?.message || 'An unexpected error occurred';
      if (Array.isArray(data?.error?.details) && data.error.details.length > 0) {
        errorMsg = data.error.details.map((d: any) => d.message).join('. ');
      }
      const errorDetails = data?.error?.details;
      const err = new Error(errorMsg) as Error & { code?: string; details?: any; status?: number };
      err.code = data?.error?.code;
      err.details = errorDetails;
      err.status = response.status;
      throw err;
    }

    return data;
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<{ success: boolean; data: { user: any; token: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
  }

  async register(userData: any) {
    return this.request<{ success: boolean; data: { user: any; token: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  }

  async me() {
    return this.request<{ success: boolean; data: { user: any } }>('/auth/me');
  }

  // RFQs
  async getRFQs(params: { region?: string; category?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.region) query.append('region', params.region);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return this.request<{ success: boolean; data: { rfqs: any[]; count: number } }>(
      `/rfqs${queryString}`
    );
  }

  async getRFQById(id: string) {
    return this.request<{ success: boolean; data: { rfq: any } }>(`/rfqs/${id}`);
  }

  async createRFQ(rfqData: any) {
    return this.request<{ success: boolean; data: { rfq: any } }>('/rfqs', {
      method: 'POST',
      body: JSON.stringify(rfqData),
    });
  }

  async publishRFQ(id: string) {
    return this.request<{ success: boolean; data: { rfq: any } }>(`/rfqs/${id}/publish`, {
      method: 'PATCH',
    });
  }

  async cancelRFQ(id: string, reason?: string) {
    return this.request<{ success: boolean; data: { rfq: any } }>(`/rfqs/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async selectVendor(rfqId: string, quotationId: string) {
    return this.request<{ success: boolean; message: string; data: any }>(
      `/rfqs/${rfqId}/select`,
      {
        method: 'POST',
        body: JSON.stringify({ quotationId }),
      }
    );
  }

  async generatePO(rfqId: string) {
    return this.request<{ success: boolean; data: { order: any } }>(
      `/rfqs/${rfqId}/generate-po`,
      {
        method: 'POST',
      }
    );
  }

  async getRFQTimeline(rfqId: string) {
    return this.request<{ success: boolean; data: { timeline: any[] } }>(
      `/rfqs/${rfqId}/timeline`
    );
  }

  // Quotations
  async getQuotationsForRFQ(rfqId: string) {
    return this.request<{ success: boolean; data: { quotes: any[]; comparison: any } }>(
      `/quotes/rfq/${rfqId}`
    );
  }

  async submitQuotation(rfqId: string, quoteData: any) {
    return this.request<{ success: boolean; data: { quotation: any } }>(
      `/quotes/rfq/${rfqId}`,
      {
        method: 'POST',
        body: JSON.stringify(quoteData),
      }
    );
  }

  async previewPricing(quantity: number, slabs: any[]) {
    return this.request<{ success: boolean; data: any }>('/quotes/preview', {
      method: 'POST',
      body: JSON.stringify({ quantity, slabs }),
    });
  }

  // Orders
  async getOrders() {
    return this.request<{ success: boolean; data: { orders: any[]; count: number } }>(
      '/orders'
    );
  }

  async getOrderById(id: string) {
    return this.request<{ success: boolean; data: { order: any } }>(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<{ success: boolean; data: { order: any } }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient();
