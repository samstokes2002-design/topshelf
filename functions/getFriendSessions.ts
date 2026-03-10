import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json().catch(() => ({}));
    if (!profileId) return Response.json({ sessions: [], friendMap: {} });

    // Verify profile belongs to user
    const myProfile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!myProfile || myProfile.created_by !== user.email) {
      return Response.json({ error: 'Invalid profile' }, { status: 403 });
    }

    const [allRecords, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileById = {};
    const profilesByEmail = {};
    for (const p of allProfiles) {
      profileById[p.id] = p;
      if (p.created_by) {
        if (!profilesByEmail[p.created_by]) profilesByEmail[p.created_by] = [];
        profilesByEmail[p.created_by].push(p);
      }
    }

    // Determine primary profile per email (oldest by created_date)
    const primaryProfileIdByEmail = {};
    for (const [email, profiles] of Object.entries(profilesByEmail)) {
      profiles.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      primaryProfileIdByEmail[email] = profiles[0].id;
    }

    const isMyPrimaryProfile = primaryProfileIdByEmail[user.email] === profileId;

    const friendProfileIds = new Set();
    const friendMap = {}; // profileId -> username

    for (const f of allRecords) {
      if (f.status !== 'accepted') continue;

      // Profile-level records (new system)
      if (f.sender_profile_id && f.friend_profile_id) {
        if (f.sender_profile_id === profileId) {
          const other = profileById[f.friend_profile_id];
          if (other) {
            friendProfileIds.add(other.id);
            friendMap[other.id] = other.username || other.name;
          }
        } else if (f.friend_profile_id === profileId) {
          const other = profileById[f.sender_profile_id];
          if (other) {
            friendProfileIds.add(other.id);
            friendMap[other.id] = other.username || other.name;
          }
        }
        continue;
      }

      // Legacy email-only records — only associate with the primary profile
      if (!isMyPrimaryProfile) continue;

      const senderEmail = f.sender_email || f.created_by;
      if (senderEmail === user.email) {
        // I sent it — other side is friend_email
        const friendPrimaryId = primaryProfileIdByEmail[f.friend_email];
        if (friendPrimaryId) {
          const other = profileById[friendPrimaryId];
          if (other) {
            friendProfileIds.add(other.id);
            friendMap[other.id] = other.username || other.name;
          }
        }
      } else if (f.friend_email === user.email) {
        // They sent it — other side is senderEmail
        const friendPrimaryId = primaryProfileIdByEmail[senderEmail];
        if (friendPrimaryId) {
          const other = profileById[friendPrimaryId];
          if (other) {
            friendProfileIds.add(other.id);
            friendMap[other.id] = other.username || other.name;
          }
        }
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