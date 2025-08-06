import { POST as checkoutHandler } from '../route';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('stripe', () => {
  const mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreate,
      },
    },
  }));
});

import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('POST /api/stripe/checkout', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStripeInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    
    const StripeConstructor = Stripe as unknown as jest.MockedClass<typeof Stripe>;
    mockStripeInstance = new StripeConstructor('test-key', { apiVersion: '2025-07-30.basil' });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it('should return 401 when user is not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ userId: null } as any);

    const response = await checkoutHandler();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle authentication errors', async () => {
    mockAuth.mockRejectedValue(new Error('Auth service down'));

    const response = await checkoutHandler();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create checkout session');
  });

  it('should attempt to create checkout session for authenticated user', async () => {
    const mockUserId = 'user_123';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);

    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    const response = await checkoutHandler();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
  });

  it('should handle Stripe API errors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockAuth.mockResolvedValue({ userId: 'user_123' } as any);
    
    mockStripeInstance.checkout.sessions.create.mockRejectedValue(
      new Error('Stripe API error')
    );

    const response = await checkoutHandler();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create checkout session');
  });
});