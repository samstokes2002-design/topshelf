import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { friendId, action } = body;

    if (!friendId || !action) {
      return Response.json({ error: 'Missing friendId or action' }, { status: 400 });
    }

    // Get the friend request record
    const friendRequest = await base44.asServiceRole.entities.Friend.filter({ id: friendId });
    if (!friendRequest || friendRequest.length === 0) {
      return Response.json({ error: 'Friend request not found' }, { status: 404 });
    }

    const fr = friendRequest[0];

    // Update friend request status
    await base44.entities.Friend.update(friendId, { status: action });

    // Send notification to the sender
    if (action === 'accepted' || action === 'declined') {
      const notificationType = action === 'accepted' ? 'friend_request_accepted' : 'friend_request_declined';
      
      // Get sender's profile to get username
      const senderProfiles = await base44.asServiceRole.entities.Profile.filter({ created_by: user.email });
      const senderUsername = senderProfiles[0]?.username || user.email.split('@')[0];

      await base44.functions.invoke('sendNotificationWithChannels', {
        recipient_email: fr.sender_email,
        type: notificationType,
        actor_username: senderUsername,
        actor_email: user.email
      });
    }

    return Response.json({ success: true, status: action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});