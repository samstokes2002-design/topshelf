import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Find the target profile by username
    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);

    // Find my profile
    const myProfile = allProfiles.find(p => p.created_by === user.email);
    if (myProfile && myProfile.username.toLowerCase() === normalizedUsername) {
      return Response.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    const targetProfile = allProfiles.find(p => p.username && p.username.toLowerCase() === normalizedUsername);

    if (!targetProfile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetEmail = targetProfile.created_by;

    // Check for existing request in either direction (only pending ones)
    const allRequests = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const duplicate = allRequests.find(f =>
      f.status === 'pending' && (
        (f.created_by === user.email && f.friend_email === targetEmail) ||
        (f.created_by === targetEmail && f.friend_email === user.email)
      )
    );

    if (duplicate) {
      return Response.json({ error: 'A pending friend request already exists between you two' }, { status: 409 });
    }

    // Also check if already friends
    const alreadyFriends = allRequests.find(f =>
      f.status === 'accepted' && (
        (f.created_by === user.email && f.friend_email === targetEmail) ||
        (f.created_by === targetEmail && f.friend_email === user.email)
      )
    );

    if (alreadyFriends) {
      return Response.json({ error: 'You are already friends' }, { status: 409 });
    }

    const friendRequest = await base44.asServiceRole.entities.Friend.create({
      created_by: user.email,
      friend_email: targetEmail,
      friend_name: targetProfile.name,
      status: 'pending',
    });

    return Response.json(friendRequest, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});