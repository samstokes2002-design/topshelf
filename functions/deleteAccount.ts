import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all profiles belonging to this user
    const allProfiles = await base44.asServiceRole.entities.Profile.filter({ created_by: user.email }, null, 10000);
    const profileIds = allProfiles.map(p => p.id);

    // Delete all sessions and seasons for this user's profiles
    for (const profileId of profileIds) {
      const [sessions, seasons] = await Promise.all([
        base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, null, 10000),
        base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, null, 10000),
      ]);
      for (const s of sessions) await base44.asServiceRole.entities.Session.delete(s.id);
      for (const s of seasons) await base44.asServiceRole.entities.Season.delete(s.id);
    }

    // Delete subscriptions for this user
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email }, null, 100);
    for (const s of subscriptions) await base44.asServiceRole.entities.Subscription.delete(s.id);

    // Delete all profiles
    for (const p of allProfiles) {
      await base44.asServiceRole.entities.Profile.delete(p.id);
    }

    // Attempt to delete the user account (may fail for app owner, which is fine)
    try {
      await base44.asServiceRole.entities.User.delete(user.id);
    } catch (userDeleteError) {
      console.log('Could not delete user record:', userDeleteError.message);
      // Non-fatal: all user data has already been deleted
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});