import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [allRecords, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileByEmail = {};
    for (const p of allProfiles) {
      if (p.created_by) profileByEmail[p.created_by] = p;
    }

    const enrich = (records, getOtherEmail) => records.map(r => {
      const otherEmail = getOtherEmail(r);
      const profile = profileByEmail[otherEmail] || {};
      return {
        ...r,
        other_name: profile.name || otherEmail,
        other_username: profile.username || '',
        other_photo: profile.photo_url || null,
      };
    });

    const sent = allRecords.filter(f => (f.sender_email || f.created_by) === user.email);
    const received = allRecords.filter(f => f.friend_email === user.email);

    return Response.json({
      sent: enrich(sent, r => r.friend_email),
      received: enrich(received, r => r.sender_email || r.created_by),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});