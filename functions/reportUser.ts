import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId, reason } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    const profile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const report = await base44.asServiceRole.entities.Report.create({
      reporter_email: user.email,
      reported_email: profile.created_by,
      reported_profile_id: profileId,
      reason: reason || 'No reason provided',
    });

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});