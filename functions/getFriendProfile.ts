import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    // Verify this is actually a friend before exposing data
    const allFriends = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const userFriends = allFriends.filter(f =>
      ((f.sender_email || f.created_by) === user.email || f.friend_email === user.email) &&
      f.status === 'accepted'
    );

    const [profile, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Profile.get(profileId),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Check that the profile owner is actually a friend
    const profileOwnerEmail = profile.created_by;
    const isFriend = userFriends.some(f =>
      (f.sender_email || f.created_by) === profileOwnerEmail ||
      f.friend_email === profileOwnerEmail
    );

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