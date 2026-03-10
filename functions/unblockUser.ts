import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { blockId } = await req.json();
    if (!blockId) return Response.json({ error: 'blockId required' }, { status: 400 });

    const block = await base44.asServiceRole.entities.Block.get(blockId);
    if (!block) return Response.json({ error: 'Block record not found' }, { status: 404 });

    if (block.blocker_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Block.delete(blockId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});