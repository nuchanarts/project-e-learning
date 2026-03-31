import prisma from '../../lib/prisma';

/**
 * Simulated payment service.
 * In production, replace `simulateCharge` with a real gateway call (Omise, Stripe, etc.).
 */

export type CardInput = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
};

/** Simulate a card charge — always succeeds unless card number starts with "4000000000000002" */
async function simulateCharge(
  amount: number,
  card: CardInput,
): Promise<{ success: boolean; ref: string; last4: string; brand: string }> {
  const last4 = card.number.replace(/\s/g, '').slice(-4);
  const brand = card.number.startsWith('4')
    ? 'VISA'
    : card.number.startsWith('5')
      ? 'MASTERCARD'
      : 'CARD';

  // Simulate decline for test card 4000000000000002
  if (card.number.replace(/\s/g, '') === '4000000000000002') {
    return { success: false, ref: '', last4, brand };
  }

  // Simulate 200ms network delay
  await new Promise((r) => setTimeout(r, 200));

  return {
    success: true,
    ref: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    last4,
    brand,
  };
}

export const paymentService = {
  /** Check if a user already has access to a course (free or already purchased) */
  async hasAccess(userId: string, courseId: string): Promise<boolean> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });
    if (!course) return false;
    if (!course.price) return true; // free course

    const paid = await prisma.order.findFirst({
      where: { userId, courseId, status: 'PAID' },
    });
    return !!paid;
  },

  /** Purchase a course with a credit card */
  async purchaseCourse(userId: string, courseId: string, card: CardInput) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, isActive: true },
    });
    if (!course || !course.isActive)
      throw Object.assign(new Error('Course not found'), { status: 404 });
    if (!course.price)
      throw Object.assign(new Error('Course is free — no payment needed'), { status: 400 });

    // Idempotency: if already paid, return existing order
    const existing = await prisma.order.findFirst({ where: { userId, courseId, status: 'PAID' } });
    if (existing) return existing;

    // Create pending order
    const order = await prisma.order.create({
      data: { userId, courseId, amount: course.price, status: 'PENDING' },
    });

    const charge = await simulateCharge(course.price, card);

    if (!charge.success) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      throw Object.assign(new Error('Payment declined'), { status: 402 });
    }

    return prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentRef: charge.ref,
        cardLast4: charge.last4,
        cardBrand: charge.brand,
        paidAt: new Date(),
      },
    });
  },

  /** List all paid orders for a user */
  async listUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId, status: 'PAID' },
      include: { course: { select: { id: true, title: true, category: true } } },
      orderBy: { paidAt: 'desc' },
    });
  },

  /** Admin: list all orders */
  async listAllOrders(search?: string) {
    return prisma.order.findMany({
      where: search
        ? {
            OR: [
              { user: { name: { contains: search } } },
              { user: { email: { contains: search } } },
              { course: { title: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, hospital: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
