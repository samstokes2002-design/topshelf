import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return Response.json({ error: 'Username is required' }, { status: 400 });

    const normalizedUsername = username.toLowerCase().trim();

    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);

    // Prevent self-request
    const myProfile = allProfiles.find(p => p.created_by === user.email);
    if (myProfile && myProfile.username.toLowerCase() === normalizedUsername) {
      return Response.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    const targetProfile = allProfiles.find(p => p.username && p.username.toLowerCase() === normalizedUsername);
    if (!targetProfile) return Response.json({ error: 'User not found' }, { status: 404 });

    const targetEmail = targetProfile.created_by;

    // Check if either user has blocked the other
    const allBlocks = await base44.asServiceRole.entities.Block.list(null, 10000);
    const isBlocked = allBlocks.some(b =>
      (b.blocker_email === user.email && b.blocked_email === targetEmail) ||
      (b.blocker_email === targetEmail && b.blocked_email === user.email)
    );
    if (isBlocked) return Response.json({ error: 'Unable to send friend request to this user' }, { status: 403 });

    // Check for existing ACTIVE request in either direction (pending or accepted only)
    const existingRequests = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const duplicate = existingRequests.find(f =>
      (((f.sender_email || f.created_by) === user.email && f.friend_email === targetEmail) ||
       ((f.sender_email || f.created_by) === targetEmail && f.friend_email === user.email)) &&
      (f.status === 'pending' || f.status === 'accepted')
    );

    if (duplicate) {
      return Response.json({ error: 'Friend request already sent or you are already friends' }, { status: 409 });
    }

    const friendRequest = await base44.asServiceRole.entities.Friend.create({
      sender_email: user.email,
      friend_email: targetEmail,
      friend_name: targetProfile.name,
      status: 'pending',
    });

    return Response.json(friendRequest, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});