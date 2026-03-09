import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { username, name, position, age, photo_url } = payload;

    if (!username || !name || !position) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if username already exists (globally unique)
    const normalizedUsername = username.toLowerCase().trim();
    const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);
    const existingUsername = allProfiles.find(
      p => p.username && p.username.toLowerCase().trim() === normalizedUsername
    );

    if (existingUsername) {
      return Response.json(
        { error: 'That username is already taken.' },
        { status: 409 }
      );
    }

    // Create the profile
    const newProfile = await base44.entities.Profile.create({
      name,
      position,
      username: normalizedUsername,
      age: age ? parseInt(age) : undefined,
      photo_url: photo_url || undefined,
    });

    return Response.json(newProfile, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});