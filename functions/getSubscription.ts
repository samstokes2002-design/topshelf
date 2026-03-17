import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
    const sub = subs[0];

    if (!sub) {
      return Response.json({ plan: 'free', status: 'none', isPro: false });
    }

    const isPro = sub.plan === 'pro' && sub.status === 'active';
    return Response.json({ 
      plan: sub.plan, 
      status: sub.status, 
      isPro,
      current_period_end: sub.current_period_end,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});