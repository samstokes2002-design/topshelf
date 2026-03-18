import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;
    console.log(`Starting full account deletion for: ${email}`);

    // 1. Get all profiles belonging to this user
    const allProfiles = await base44.asServiceRole.entities.Profile.filter({ created_by: email }, null, 10000);
    const profileIds = allProfiles.map(p => p.id);
    console.log(`Found ${allProfiles.length} profiles`);

    // 2. Delete all sessions and seasons for each profile
    for (const profileId of profileIds) {
      const [sessions, seasons] = await Promise.all([
        base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, null, 10000),
        base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, null, 10000),
      ]);

      await Promise.all([
        ...sessions.map(s => base44.asServiceRole.entities.Session.delete(s.id)),
        ...seasons.map(s => base44.asServiceRole.entities.Season.delete(s.id)),
      ]);
      console.log(`Deleted ${sessions.length} sessions and ${seasons.length} seasons for profile ${profileId}`);
    }

    // 3. Delete subscription record (allows email reuse on Stripe)
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_email: email }, null, 100);
    await Promise.all(subscriptions.map(s => base44.asServiceRole.entities.Subscription.delete(s.id)));
    console.log(`Deleted ${subscriptions.length} subscription records`);

    // 4. Delete all profiles
    await Promise.all(allProfiles.map(p => base44.asServiceRole.entities.Profile.delete(p.id)));
    console.log(`Deleted ${allProfiles.length} profiles`);

    // 5. Delete the user account itself — this allows the same email to re-register fresh
    await base44.asServiceRole.entities.User.delete(user.id);
    console.log(`Deleted user account: ${email}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});