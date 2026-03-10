import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { recipient_email, type, actor_username, actor_email, session_id } = body;

    if (!recipient_email || !type || !actor_username) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check recipient's notification preferences
    const recipientUser = await base44.auth.getUserByEmail?.(recipient_email);
    if (!recipientUser) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Fetch user notification settings directly from User entity
    const users = await base44.asServiceRole.entities.User.filter({ email: recipient_email });
    const user = users[0];

    // Check if notifications are enabled
    if (!user?.notifications_enabled) {
      return Response.json({ notificationSent: false, reason: 'Notifications disabled' });
    }

    // Check specific notification type preference
    const preferenceMap = {
      'friend_request_accepted': 'notifications_friend_request_accepted',
      'friend_request_declined': 'notifications_friend_request_declined',
      'friend_session_logged': 'notifications_friend_session_logged'
    };

    const preferenceKey = preferenceMap[type];
    if (preferenceKey && !user[preferenceKey]) {
      return Response.json({ notificationSent: false, reason: 'Notification type disabled' });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email,
      type,
      actor_username,
      actor_email: actor_email || '',
      session_id: session_id || null,
      read: false
    });

    return Response.json({ notificationSent: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});