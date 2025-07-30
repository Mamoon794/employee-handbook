import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/dbConfig/firebaseConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  console.log('Payment status:', session.payment_status);
  console.log('Session metadata:', session.metadata);
  
  if (session.payment_status === 'paid' && session.metadata?.userId) {
    const userId = session.metadata.userId;
    console.log('Processing subscription update for user:', userId);
    
    // Update user subscription status in database
    const userSnapshot = await db.collection('users')
      .where('clerkUserId', '==', userId)
      .get();

    console.log('Found users in database:', userSnapshot.size);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      console.log('Current user data:', userDoc.data());
      
      await userDoc.ref.update({
        isSubscribed: true,
        updatedAt: new Date(),
      });
      console.log(`✅ Successfully updated subscription for user ${userId}`);
    } else {
      console.log('❌ No user found in database with clerkUserId:', userId);
    }
  } else {
    console.log('❌ Payment not completed or no userId in metadata');
    console.log('Payment status:', session.payment_status);
    console.log('Metadata:', session.metadata);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  // Additional payment success handling if needed
} 