import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export interface PaymentFieldConfig {
  type: 'payment';
  amount: number; // in cents
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(config: PaymentFieldConfig, formId: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: config.currency,
        product_data: { name: config.description },
        unit_amount: config.amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: config.successUrl,
    cancel_url: config.cancelUrl,
    metadata: { formId },
  });
  
  return session.url;
}
