import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { username } = payload;

    if (!username) {
      return Response.json({ available: true });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);
    const exists = allProfiles.some(
      p => p.username && p.username.toLowerCase().trim() === normalizedUsername
    );

    return Response.json({ available: !exists });
  } catch (error) {
    return Response.json({ available: true }, { status: 500 });
  }
});