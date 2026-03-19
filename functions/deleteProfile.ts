import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    // Verify profile belongs to this user
    const profile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!profile || profile.created_by !== user.email) {
      return Response.json({ error: 'Profile not found or unauthorized' }, { status: 403 });
    }

    // Fetch profile-scoped data
    const [sessions, seasons] = await Promise.all([
      base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, null, 10000),
      base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, null, 10000),
    ]);

    // Delete sessions
    for (const s of sessions) {
      await base44.asServiceRole.entities.Session.delete(s.id);
    }

    // Delete seasons
    for (const s of seasons) {
      await base44.asServiceRole.entities.Season.delete(s.id);
    }

    // Delete the profile itself
    await base44.asServiceRole.entities.Profile.delete(profileId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});