import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { username } = payload;

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Get current user's profile
    const myProfiles = await base44.asServiceRole.entities.Profile.list(null, 1000);
    const myProfile = myProfiles.find(p => p.created_by === user.email);
    
    if (myProfile && myProfile.username.toLowerCase() === normalizedUsername) {
      return Response.json(
        { error: 'You cannot send a friend request to yourself' },
        { status: 400 }
      );
    }

    // Find the target profile by username
    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 1000);
    const targetProfile = allProfiles.find(p => p.username.toLowerCase() === normalizedUsername);
    
    if (!targetProfile) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetEmail = targetProfile.created_by;

    // Check if request already exists
    const existingRequests = await base44.asServiceRole.entities.Friend.list(null, 1000);
    const duplicate = existingRequests.find(
      f => f.created_by === user.email && f.friend_email === targetEmail
    );

    if (duplicate) {
      return Response.json(
        { error: 'Friend request already sent' },
        { status: 409 }
      );
    }

    // Create the friend request
    const friendRequest = await base44.entities.Friend.create({
      friend_email: targetEmail,
      friend_name: targetProfile.name,
      status: 'pending',
    });

    return Response.json(friendRequest, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});