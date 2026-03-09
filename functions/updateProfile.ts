import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { profileId, username, name, position, age, photo_url, height, weight } = payload;

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Check if username is being changed and if it's already taken
    if (username) {
      const normalizedUsername = username.toLowerCase().trim();
      const allProfiles = await base44.asServiceRole.entities.Profile.list(null, 10000);
      
      // Check if any OTHER profile has this username
      const existingUsername = allProfiles.find(
        p => p.id !== profileId && p.username && p.username.toLowerCase().trim() === normalizedUsername
      );

      if (existingUsername) {
        return Response.json(
          { error: 'That username is already taken' },
          { status: 409 }
        );
      }
    }

    // Update the profile
    const updateData = {
      ...(name && { name }),
      ...(position && { position }),
      ...(username && { username: username.toLowerCase().trim() }),
      ...(age && { age: parseInt(age) }),
      ...(photo_url && { photo_url }),
      ...(height && { height }),
      ...(weight && { weight: parseInt(weight) }),
    };

    const updatedProfile = await base44.entities.Profile.update(profileId, updateData);
    return Response.json(updatedProfile, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});