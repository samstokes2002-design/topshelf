import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { profileId, sessionData } = body;

    if (!profileId || !sessionData) {
      return Response.json({ error: 'Missing profileId or sessionData' }, { status: 400 });
    }

    // Create the session
    const session = await base44.entities.Session.create(sessionData);

    // Get the user's profile to extract username
    const profile = await base44.asServiceRole.entities.Profile.filter({ id: profileId });
    if (!profile || profile.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileData = profile[0];
    const actorUsername = profileData.username || user.email.split('@')[0];

    // Get all friends of this user who accepted the friend request
    const friendRequests = await base44.asServiceRole.entities.Friend.filter({
      sender_email: user.email,
      status: 'accepted'
    });

    // Notify all friends that this user logged a session
    for (const fr of friendRequests) {
      const notificationType = sessionData.type === 'game' ? 'friend_session_logged' : null;
      
      if (notificationType) {
        await base44.functions.invoke('createNotification', {
          recipient_email: fr.friend_email,
          type: notificationType,
          actor_username: actorUsername,
          actor_email: user.email,
          session_id: session.id
        });
      }
    }

    return Response.json({ success: true, session });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});