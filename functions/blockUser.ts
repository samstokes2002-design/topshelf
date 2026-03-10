import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    const profile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const targetEmail = profile.created_by;

    if (targetEmail === user.email) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const existingBlocks = await base44.asServiceRole.entities.Block.list(null, 10000);
    const alreadyBlocked = existingBlocks.find(b => b.blocker_email === user.email && b.blocked_email === targetEmail);
    if (alreadyBlocked) {
      return Response.json({ error: 'User already blocked' }, { status: 409 });
    }

    // Remove all friend records between the two users in both directions
    const allFriends = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const toDelete = allFriends.filter(f => {
      const senderEmail = f.sender_email || f.created_by;
      const recipientEmail = f.friend_email;
      return (senderEmail === user.email && recipientEmail === targetEmail) ||
             (senderEmail === targetEmail && recipientEmail === user.email);
    });

    await Promise.all(toDelete.map(f => base44.asServiceRole.entities.Friend.delete(f.id)));

    // Create the block record
    const block = await base44.asServiceRole.entities.Block.create({
      blocker_email: user.email,
      blocked_email: targetEmail,
      blocked_name: profile.name,
      blocked_username: profile.username,
    });

    return Response.json({ block, friendsRemoved: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});