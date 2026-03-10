import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendRequestId, status } = await req.json();

    if (!friendRequestId || !['accepted', 'declined'].includes(status)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch the friend request using service role
    const allRequests = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const request = allRequests.find(r => r.id === friendRequestId);

    if (!request) {
      return Response.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only the recipient can respond
    if (request.friend_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await base44.asServiceRole.entities.Friend.update(friendRequestId, { status });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});