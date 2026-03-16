import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { name, position, age, photo_url } = payload;

    if (!name || !position) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProfile = await base44.entities.Profile.create({
      name,
      position,
      age: age ? parseInt(age) : undefined,
      photo_url: photo_url || undefined,
    });

    return Response.json(newProfile, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});