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

    // Prevent self-friending
    const myProfile = await base44.asServiceRole.entities.Profile.filter({ created_by: user.email });
    const myUsername = myProfile[0]?.username;
    
    if (myUsername && myUsername.toLowerCase() === username.toLowerCase()) {
      return Response.json(
        { error: 'You cannot send a friend request to yourself' },
        { status: 400 }
      );
    }

    // Find the profile with that username
    const targetProfiles = await base44.asServiceRole.entities.Profile.filter({ username: username.toLowerCase().trim() });
    
    if (!targetProfiles || targetProfiles.length === 0) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetProfile = targetProfiles[0];
    const targetEmail = targetProfile.created_by;

    // Check if friend request already exists
    const existingRequests = await base44.asServiceRole.entities.Friend.filter({
      created_by: user.email,
      friend_email: targetEmail
    });

    if (existingRequests && existingRequests.length > 0) {
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