import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [allRecords, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileByEmail = {};
    for (const p of allProfiles) {
      if (p.created_by) profileByEmail[p.created_by] = p;
    }

    // Get all accepted friendships in both directions
    const sent = allRecords.filter(f => (f.sender_email || f.created_by) === user.email && f.status === 'accepted');
    const received = allRecords.filter(f => f.friend_email === user.email && f.status === 'accepted');

    const friendProfileIds = new Set();
    const friendMap = {}; // profileId -> username

    for (const f of sent) {
      const profile = profileByEmail[f.friend_email];
      if (profile?.id) {
        friendProfileIds.add(profile.id);
        friendMap[profile.id] = profile.username || profile.name || f.friend_email;
      }
    }
    for (const f of received) {
      const senderEmail = f.sender_email || f.created_by;
      const profile = profileByEmail[senderEmail];
      if (profile?.id) {
        friendProfileIds.add(profile.id);
        friendMap[profile.id] = profile.username || profile.name || senderEmail;
      }
    }

    if (friendProfileIds.size === 0) {
      return Response.json({ sessions: [], friendMap: {} });
    }

    const allSessions = await base44.asServiceRole.entities.Session.list('-date', 500);
    const friendSessions = allSessions.filter(s => friendProfileIds.has(s.profile_id));

    return Response.json({ sessions: friendSessions, friendMap });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});