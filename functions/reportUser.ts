import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId, reason, reporterProfileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    const [reportedProfile, reporterProfile] = await Promise.all([
      base44.asServiceRole.entities.Profile.get(profileId),
      reporterProfileId ? base44.asServiceRole.entities.Profile.get(reporterProfileId) : Promise.resolve(null),
    ]);

    if (!reportedProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const report = await base44.asServiceRole.entities.Report.create({
      reporter_email: user.email,
      reported_email: reportedProfile.created_by,
      reported_profile_id: profileId,
      reason: reason || 'No reason provided',
    });

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: 'topshelfhockeyapp@gmail.com',
      subject: `[TopShelf] User Report: ${reportedProfile.name}`,
      body: `A user has been reported on TopShelf.\n\nReporter:\n  Name: ${reporterProfile?.name || 'Unknown'}\n  Username: @${reporterProfile?.username || 'unknown'}\n  Email: ${user.email}\n\nReported User:\n  Name: ${reportedProfile.name}\n  Username: @${reportedProfile.username}\n  Email: ${reportedProfile.created_by}\n\nReason:\n${reason || 'No reason provided'}\n\nReport ID: ${report.id}`,
    });

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});