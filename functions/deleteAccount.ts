import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all profiles belonging to this user
    const allProfiles = await base44.asServiceRole.entities.Profile.filter({ created_by: user.email }, null, 10000);
    const profileIds = new Set(allProfiles.map(p => p.id));

    // Fetch all entity data in parallel
    const [allSessions, allSeasons, allFriends, allBlocks, allReports] = await Promise.all([
      base44.asServiceRole.entities.Session.list(null, 100000),
      base44.asServiceRole.entities.Season.list(null, 100000),
      base44.asServiceRole.entities.Friend.list(null, 100000),
      base44.asServiceRole.entities.Block.list(null, 100000),
      base44.asServiceRole.entities.Report.list(null, 100000),
    ]);

    // Delete all sessions for any of this user's profiles
    const sessionsToDelete = allSessions.filter(s => profileIds.has(s.profile_id));
    for (const s of sessionsToDelete) {
      await base44.asServiceRole.entities.Session.delete(s.id);
    }

    // Delete all seasons for any of this user's profiles
    const seasonsToDelete = allSeasons.filter(s => profileIds.has(s.profile_id));
    for (const s of seasonsToDelete) {
      await base44.asServiceRole.entities.Season.delete(s.id);
    }

    // Delete all friend records: profile-scoped or email-based (legacy)
    const friendsToDelete = allFriends.filter(f =>
      profileIds.has(f.sender_profile_id) ||
      profileIds.has(f.friend_profile_id) ||
      (f.sender_email || f.created_by) === user.email ||
      f.friend_email === user.email
    );
    for (const f of friendsToDelete) {
      await base44.asServiceRole.entities.Friend.delete(f.id);
    }

    // Delete all blocks involving this user's email
    const blocksToDelete = allBlocks.filter(b =>
      b.blocker_email === user.email || b.blocked_email === user.email
    );
    for (const b of blocksToDelete) {
      await base44.asServiceRole.entities.Block.delete(b.id);
    }

    // Delete all reports involving this user's email
    const reportsToDelete = allReports.filter(r =>
      r.reporter_email === user.email || r.reported_email === user.email
    );
    for (const r of reportsToDelete) {
      await base44.asServiceRole.entities.Report.delete(r.id);
    }

    // Delete all profiles
    for (const p of allProfiles) {
      await base44.asServiceRole.entities.Profile.delete(p.id);
    }

    // Delete the user account itself from the auth system
    await base44.asServiceRole.entities.User.delete(user.id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});