import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendRecordId } = await req.json();

    const allRecords = await base44.asServiceRole.entities.Friend.list(null, 10000);
    const record = allRecords.find(f => f.id === friendRecordId);

    if (!record) return Response.json({ error: 'Friend record not found' }, { status: 404 });

    const senderEmail = record.sender_email || record.created_by;
    const recipientEmail = record.friend_email;

    if (user.email !== senderEmail && user.email !== recipientEmail) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const senderProfileId = record.sender_profile_id;
    const recipientProfileId = record.friend_profile_id;

    // Delete all records between these two profiles in either direction
    const toDelete = allRecords.filter(f => {
      if (senderProfileId && recipientProfileId) {
        // Profile-level matching (new records)
        return (
          (f.sender_profile_id === senderProfileId && f.friend_profile_id === recipientProfileId) ||
          (f.sender_profile_id === recipientProfileId && f.friend_profile_id === senderProfileId)
        );
      }
      // Fallback: email-level matching (legacy records without profile IDs)
      const fSender = f.sender_email || f.created_by;
      const fRecipient = f.friend_email;
      return (fSender === senderEmail && fRecipient === recipientEmail) ||
             (fSender === recipientEmail && fRecipient === senderEmail);
    });

    await Promise.all(toDelete.map(f => base44.asServiceRole.entities.Friend.delete(f.id)));

    return Response.json({ deleted: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});