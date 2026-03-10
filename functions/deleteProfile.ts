import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // Fetch all related data
    const [sessions, seasons, allFriends, allBlocks, allReports] = await Promise.all([
      base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, null, 10000),
      base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, null, 10000),
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Block.list(null, 10000),
      base44.asServiceRole.entities.Report.list(null, 10000),
    ]);

    // Delete sessions
    for (const s of sessions) {
      await base44.asServiceRole.entities.Session.delete(s.id);
    }

    // Delete seasons
    for (const s of seasons) {
      await base44.asServiceRole.entities.Season.delete(s.id);
    }

    // Delete friend records involving this profile or this user's email
    const friendsToDelete = allFriends.filter(f =>
      f.sender_profile_id === profileId ||
      f.friend_profile_id === profileId ||
      (f.sender_email || f.created_by) === user.email ||
      f.friend_email === user.email
    );
    for (const f of friendsToDelete) {
      await base44.asServiceRole.entities.Friend.delete(f.id);
    }

    // Delete blocks involving this user's email
    const blocksToDelete = allBlocks.filter(b =>
      b.blocker_email === user.email || b.blocked_email === user.email
    );
    for (const b of blocksToDelete) {
      await base44.asServiceRole.entities.Block.delete(b.id);
    }

    // Delete reports involving this user's email
    const reportsToDelete = allReports.filter(r =>
      r.reporter_email === user.email || r.reported_email === user.email
    );
    for (const r of reportsToDelete) {
      await base44.asServiceRole.entities.Report.delete(r.id);
    }

    // Finally delete the profile itself
    await base44.asServiceRole.entities.Profile.delete(profileId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});