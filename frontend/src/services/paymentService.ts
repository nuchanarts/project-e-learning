import api from '../lib/api';

export interface CardInput {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
}

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentRef?: string;
  cardLast4?: string;
  cardBrand?: string;
  paidAt?: string;
  createdAt: string;
  course?: { id: string; title: string; category?: string };
}

export const paymentService = {
  async checkAccess(courseId: string): Promise<boolean> {
    const res = await api.get<{ hasAccess: boolean }>(`/payment/access/${courseId}`);
    return res.data.hasAccess;
  },

  async purchase(courseId: string, card: CardInput): Promise<Order> {
    const res = await api.post<Order>(`/payment/purchase/${courseId}`, { card });
    return res.data;
  },

  async myOrders(): Promise<Order[]> {
    const res = await api.get<Order[]>('/payment/my-orders');
    return res.data;
  },
};
