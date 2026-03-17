import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      if (!userEmail) return Response.json({ received: true });

      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          plan: 'pro',
          current_period_end: periodEnd,
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          plan: 'pro',
          current_period_end: periodEnd,
        });
      }
      console.log('Subscription activated for:', userEmail);
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const isActive = subscription.status === 'active';

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: isActive ? 'active' : subscription.status,
          plan: isActive ? 'pro' : 'free',
          current_period_end: periodEnd,
        });
        console.log('Subscription updated:', customerId, isActive ? 'active' : subscription.status);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'expired',
          plan: 'free',
        });
        console.log('Subscription expired for customer:', customerId);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'past_due',
          plan: 'free',
        });
        console.log('Payment failed for customer:', customerId);
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return Response.json({ received: true });
});