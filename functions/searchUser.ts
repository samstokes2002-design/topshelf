import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);
    const found = allProfiles.find(p => p.username && p.username.toLowerCase() === normalizedUsername);

    if (!found) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (found.created_by === user.email) {
      return Response.json({ error: 'That\'s your own profile' }, { status: 400 });
    }

    return Response.json({ profile: { name: found.name, username: found.username, photo_url: found.photo_url } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});