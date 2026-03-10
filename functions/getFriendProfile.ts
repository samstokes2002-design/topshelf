import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId, myProfileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });
    if (!myProfileId) return Response.json({ error: 'myProfileId required' }, { status: 400 });

    const [allFriends, profile, allBlocks] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.get(profileId),
      base44.asServiceRole.entities.Block.list(null, 10000),
    ]);

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const profileOwnerEmail = profile.created_by;

    // Check if either user has blocked the other
    const isBlocked = allBlocks.some(b =>
      (b.blocker_email === user.email && b.blocked_email === profileOwnerEmail) ||
      (b.blocker_email === profileOwnerEmail && b.blocked_email === user.email)
    );
    if (isBlocked) return Response.json({ error: 'Profile not available' }, { status: 403 });

    // Check friendship at the profile level
    const isFriend = allFriends.some(f => {
      if (f.status !== 'accepted') return false;
      // Profile-level check (new records)
      if (f.sender_profile_id && f.friend_profile_id) {
        return (
          (f.sender_profile_id === myProfileId && f.friend_profile_id === profileId) ||
          (f.sender_profile_id === profileId && f.friend_profile_id === myProfileId)
        );
      }
      // Fallback: email-level (legacy records)
      const senderEmail = f.sender_email || f.created_by;
      const recipientEmail = f.friend_email;
      return (
        (senderEmail === user.email && recipientEmail === profileOwnerEmail) ||
        (senderEmail === profileOwnerEmail && recipientEmail === user.email)
      );
    });

    if (!isFriend) return Response.json({ error: 'Not a friend' }, { status: 403 });

    const [seasons, sessions] = await Promise.all([
      base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, '-created_date', 100),
      base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, '-date', 200),
    ]);

    return Response.json({ profile, seasons, sessions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});