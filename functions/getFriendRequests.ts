import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json().catch(() => ({}));
    if (!profileId) return Response.json({ error: 'profileId is required' }, { status: 400 });

    // Verify profile belongs to current user
    const myProfile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!myProfile || myProfile.created_by !== user.email) {
      return Response.json({ error: 'Invalid profile' }, { status: 403 });
    }

    const [allRecords, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileById = {};
    const profilesByEmail = {};
    for (const p of allProfiles) {
      profileById[p.id] = p;
      if (p.created_by) {
        if (!profilesByEmail[p.created_by]) profilesByEmail[p.created_by] = [];
        profilesByEmail[p.created_by].push(p);
      }
    }

    // Determine primary profile per email (oldest = first created)
    const primaryProfileIdByEmail = {};
    for (const [email, profiles] of Object.entries(profilesByEmail)) {
      profiles.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      primaryProfileIdByEmail[email] = profiles[0].id;
    }

    const isMyPrimaryProfile = primaryProfileIdByEmail[user.email] === profileId;

    const enrich = (record, otherProfileId) => {
      const profile = profileById[otherProfileId] || {};
      return {
        ...record,
        other_name: profile.name || '',
        other_username: profile.username || '',
        other_photo: profile.photo_url || null,
        other_profile_id: profile.id || null,
      };
    };

    const sent = [];
    const received = [];
    const seenRecordIds = new Set();

    for (const f of allRecords) {
      if (seenRecordIds.has(f.id)) continue;

      // --- Profile-level records (new system) ---
      if (f.sender_profile_id && f.friend_profile_id) {
        if (f.sender_profile_id === profileId) {
          seenRecordIds.add(f.id);
          sent.push(enrich(f, f.friend_profile_id));
        } else if (f.friend_profile_id === profileId) {
          seenRecordIds.add(f.id);
          received.push(enrich(f, f.sender_profile_id));
        }
        continue;
      }

      // --- Legacy email-only records — only shown for primary profile ---
      if (!isMyPrimaryProfile) continue;

      const senderEmail = f.sender_email || f.created_by;
      if (senderEmail === user.email) {
        // I sent it — find the recipient's primary profile
        const otherPrimaryId = primaryProfileIdByEmail[f.friend_email];
        if (otherPrimaryId) {
          seenRecordIds.add(f.id);
          sent.push(enrich(f, otherPrimaryId));
        }
      } else if (f.friend_email === user.email) {
        // They sent it to me — find the sender's primary profile
        const otherPrimaryId = primaryProfileIdByEmail[senderEmail];
        if (otherPrimaryId) {
          seenRecordIds.add(f.id);
          received.push(enrich(f, otherPrimaryId));
        }
      }
    }

    return Response.json({ sent, received });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});