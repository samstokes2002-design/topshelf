import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const allBlocks = await base44.asServiceRole.entities.Block.list(null, 10000);
    const myBlocks = allBlocks.filter(b => b.blocker_email === user.email);

    return Response.json({ blocks: myBlocks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});