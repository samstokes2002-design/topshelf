import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { friendRequestId, status } = payload;

    if (!friendRequestId || !status || !['accepted', 'declined'].includes(status)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get the friend request
    const allRequests = await base44.asServiceRole.entities.Friend.list(null, 1000);
    const friendRequest = allRequests.find(f => f.id === friendRequestId);

    if (!friendRequest) {
      return Response.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Verify the current user is the recipient (friend_email matches)
    if (friendRequest.friend_email !== user.email) {
      return Response.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      );
    }

    // Update the original friend request status
    const updated = await base44.asServiceRole.entities.Friend.update(friendRequestId, { status });

    // If accepted, create a reciprocal accepted entry so both users see each other as friends
    if (status === 'accepted') {
      const senderEmail = friendRequest.sender_email || friendRequest.created_by;

      // Check if a reciprocal record already exists to avoid duplicates
      const reciprocalExists = allRequests.find(f =>
        (f.sender_email || f.created_by) === user.email &&
        f.friend_email === senderEmail &&
        f.status === 'accepted'
      );

      if (!reciprocalExists) {
        // Get the sender's profile to fetch their name
        const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);
        const senderProfile = allProfiles.find(p => p.created_by === senderEmail);

        await base44.asServiceRole.entities.Friend.create({
          sender_email: user.email,
          friend_email: senderEmail,
          friend_name: senderProfile?.name || '',
          status: 'accepted',
        });
      }
    }

    return Response.json(updated, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});