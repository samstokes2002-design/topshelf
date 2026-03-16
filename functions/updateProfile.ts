import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { profileId, name, position, age, photo_url, height, weight, show_on_profile, favorite_team, player_number } = payload;

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const updateData = {
      ...(name && { name }),
      ...(position && { position }),
      ...(age !== undefined && age !== null && age !== "" && { age: parseInt(age) }),
      ...(photo_url && { photo_url }),
      ...(height !== undefined && { height }),
      ...(weight !== undefined && weight !== null && weight !== "" && { weight: parseInt(weight) }),
      show_on_profile: show_on_profile === true,
      favorite_team: favorite_team || "",
      player_number: player_number || "",
    };

    const updatedProfile = await base44.entities.Profile.update(profileId, updateData);
    return Response.json(updatedProfile, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});