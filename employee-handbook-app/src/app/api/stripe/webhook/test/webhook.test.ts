import { NextRequest } from 'next/server';
import { POST as webhookHandler } from '../route';

jest.mock('stripe', () => {
  const mockConstructEvent = jest.fn();
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/dbConfig/firebaseConfig', () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  },
}));

import { headers } from 'next/headers';
import Stripe from 'stripe';

const mockHeaders = headers as jest.MockedFunction<typeof headers>;

describe('POST /api/stripe/webhook', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStripeInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    
    const StripeConstructor = Stripe as unknown as jest.MockedClass<typeof Stripe>;
    mockStripeInstance = new StripeConstructor('test-key', { apiVersion: '2025-07-30.basil' });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('should handle missing stripe signature header', async () => {
    mockHeaders.mockResolvedValue({
      get: () => null,
    } as unknown as Headers);

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    const response = await webhookHandler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook handler failed');
  });

  it('should reject invalid webhook signature', async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) => name === 'stripe-signature' ? 'invalid-signature' : null,
    } as unknown as Headers);
    
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: { 'stripe-signature': 'invalid-signature' },
    });

    const response = await webhookHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature');
  });

  it('should accept valid webhook signature', async () => {
    const mockEvent = {
      id: 'evt_test',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } },
    };

    mockHeaders.mockResolvedValue({
      get: (name: string) => name === 'stripe-signature' ? 'valid-signature' : null,
    } as unknown as Headers);
    
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: { 'stripe-signature': 'valid-signature' },
    });

    const response = await webhookHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('should handle general errors gracefully', async () => {
    mockHeaders.mockRejectedValue(new Error('Headers error'));

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    const response = await webhookHandler(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook handler failed');
  });
});
