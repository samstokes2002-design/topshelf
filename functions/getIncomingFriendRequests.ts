import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all Friend records where this user is the recipient
    const allRequests = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const incoming = allRequests.filter(r => r.friend_email === user.email && r.status === 'pending');

    // Also get all profiles so we can look up sender names
    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);

    const enriched = incoming.map(r => {
      const senderProfile = allProfiles.find(p => p.created_by === r.created_by);
      return {
        ...r,
        sender_name: senderProfile?.name || 'Unknown',
        sender_username: senderProfile?.username || '',
      };
    });

    return Response.json({ requests: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});