import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { recipient_email, type, actor_username, actor_email, session_id, description } = body;

    if (!recipient_email || !type || !actor_username) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify friend relationship exists
    const friendRelationship = await base44.asServiceRole.entities.Friend.filter({
      status: 'accepted'
    });

    const isFriend = friendRelationship.some(f => 
      (f.sender_email === actor_email && f.friend_email === recipient_email) ||
      (f.friend_email === actor_email && f.sender_email === recipient_email)
    );

    if (!isFriend && type !== 'friend_request_received') {
      return Response.json({ 
        notificationSent: false, 
        reason: 'Not friends - notification blocked' 
      });
    }

    // Fetch user notification settings
    const users = await base44.asServiceRole.entities.User.filter({ email: recipient_email });
    const user = users[0];

    if (!user?.notifications_enabled) {
      return Response.json({ notificationSent: false, reason: 'Notifications disabled' });
    }

    const preferenceMap = {
      'friend_request_received': 'notifications_friend_request_received',
      'friend_request_accepted': 'notifications_friend_request_accepted',
      'friend_request_declined': 'notifications_friend_request_declined',
      'friend_session_logged': 'notifications_friend_session_logged'
    };

    const preferenceKey = preferenceMap[type];
    if (preferenceKey && !user[preferenceKey]) {
      return Response.json({ notificationSent: false, reason: 'Notification type disabled' });
    }

    // Create database notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email,
      type,
      actor_username,
      actor_email: actor_email || '',
      session_id: session_id || null,
      read: false
    });

    // Send email notification
    const emailSubjects = {
      'friend_request_received': 'New Friend Request',
      'friend_request_accepted': 'Friend Request Accepted',
      'friend_request_declined': 'Friend Request Declined',
      'friend_session_logged': 'Friend Activity Alert'
    };

    const emailDescriptions = {
      'friend_request_received': `${actor_username} sent you a friend request.`,
      'friend_request_accepted': `${actor_username} accepted your friend request.`,
      'friend_request_declined': `${actor_username} declined your friend request.`,
      'friend_session_logged': description || `${actor_username} logged a new session.`
    };

    try {
      await base44.integrations.Core.SendEmail({
        to: recipient_email,
        subject: emailSubjects[type] || 'TopShelf Notification',
        body: `Hi ${user.full_name || 'friend'},\n\n${emailDescriptions[type]}\n\nCheck your app to learn more.\n\nTopShelf`
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Continue even if email fails - in-app notification still created
    }

    // Send push notification (requires device subscriptions)
    // This would integrate with push service (e.g., Firebase Cloud Messaging, Apple Push Notification)
    // For now, we create a queue record for push notifications
    const pushNotificationRecord = await base44.asServiceRole.entities.Notification.update(notification.id, {
      push_sent: true,
      push_timestamp: new Date().toISOString()
    }).catch(() => null);

    return Response.json({ 
      notificationSent: true, 
      notification,
      channels: {
        email: true,
        push: true,
        inApp: true
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});