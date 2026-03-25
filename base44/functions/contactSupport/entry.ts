import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, profileId } = await req.json();
    if (!message?.trim()) return Response.json({ error: 'Message required' }, { status: 400 });

    const profile = profileId ? await base44.asServiceRole.entities.Profile.get(profileId) : null;

    await base44.integrations.Core.SendEmail({
      to: 'topshelfhockeyapp@gmail.com',
      subject: `[TopShelf] Support Request from ${user.full_name || user.email}`,
      body: `A user has submitted a support request.\n\nUser Info:\n  Name: ${user.full_name || 'Unknown'}\n  Email: ${user.email}${profile ? `\n  Profile Name: ${profile.name}\n  Username: @${profile.username}` : ''}\n\nMessage:\n${message}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});