import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user's subscription
        const subscriptions = await base44.entities.Subscription.filter({ user_email: user.email });
        const subscription = subscriptions.find(s => s.status === 'active' && s.plan === 'pro');

        if (!subscription || !subscription.stripe_subscription_id) {
            return Response.json({ error: 'No active Pro subscription found' }, { status: 404 });
        }

        // Tell Stripe to cancel at end of current billing period
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        // Update entity status to reflect pending cancellation
        await base44.entities.Subscription.update(subscription.id, {
            status: 'cancelled',
        });

        console.log(`User ${user.email} cancelled subscription ${subscription.stripe_subscription_id} — active until period end.`);
        return Response.json({ success: true });

    } catch (error) {
        console.error('Error cancelling subscription:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});