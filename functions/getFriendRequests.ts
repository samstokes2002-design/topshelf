import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json().catch(() => ({}));
    if (!profileId) return Response.json({ error: 'profileId is required' }, { status: 400 });

    // Verify the profile belongs to the current user
    const myProfile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!myProfile || myProfile.created_by !== user.email) {
      return Response.json({ error: 'Invalid profile' }, { status: 403 });
    }

    const [allRecords, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileById = {};
    for (const p of allProfiles) {
      profileById[p.id] = p;
    }

    // Filter by profile ID (sender or recipient)
    const profileRecords = allRecords.filter(f =>
      f.sender_profile_id === profileId || f.friend_profile_id === profileId
    );

    const enrich = (records, getOtherProfileId) => records.map(r => {
      const otherProfileId = getOtherProfileId(r);
      const profile = profileById[otherProfileId] || {};
      return {
        ...r,
        other_name: profile.name || '',
        other_username: profile.username || '',
        other_photo: profile.photo_url || null,
        other_profile_id: profile.id || null,
      };
    });

    const sent = profileRecords.filter(f => f.sender_profile_id === profileId);
    const received = profileRecords.filter(f => f.friend_profile_id === profileId);

    return Response.json({
      sent: enrich(sent, r => r.friend_profile_id),
      received: enrich(received, r => r.sender_profile_id),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});