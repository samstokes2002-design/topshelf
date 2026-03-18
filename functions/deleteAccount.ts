import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;
    console.log(`Starting full account deletion for: ${email}`);

    // 1. Get all profiles belonging to this user
    const allProfiles = await base44.asServiceRole.entities.Profile.filter({ created_by: email }, null, 10000);
    const profileIds = allProfiles.map(p => p.id);
    console.log(`Found ${allProfiles.length} profiles`);

    // 2. Delete all sessions and seasons for each profile (filtered by profile_id)
    for (const profileId of profileIds) {
      const [sessions, seasons] = await Promise.all([
        base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, null, 10000),
        base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, null, 10000),
      ]);

      await Promise.all([
        ...sessions.map(s => base44.asServiceRole.entities.Session.delete(s.id)),
        ...seasons.map(s => base44.asServiceRole.entities.Season.delete(s.id)),
      ]);
      console.log(`Deleted ${sessions.length} sessions and ${seasons.length} seasons for profile ${profileId}`);
    }

    // 3. Delete all friend records (check both sender and receiver sides)
    const [sentFriends, receivedFriends] = await Promise.all([
      base44.asServiceRole.entities.Friend.filter({ created_by: email }, null, 10000),
      base44.asServiceRole.entities.Friend.filter({ friend_email: email }, null, 10000),
    ]);
    const allFriends = [...sentFriends, ...receivedFriends];
    const uniqueFriendIds = [...new Set(allFriends.map(f => f.id))];
    await Promise.all(uniqueFriendIds.map(id => base44.asServiceRole.entities.Friend.delete(id)));
    console.log(`Deleted ${uniqueFriendIds.length} friend records`);

    // 4. Delete all blocks involving this user
    const [sentBlocks, receivedBlocks] = await Promise.all([
      base44.asServiceRole.entities.Block.filter({ blocker_email: email }, null, 10000),
      base44.asServiceRole.entities.Block.filter({ blocked_email: email }, null, 10000),
    ]);
    const allBlocks = [...sentBlocks, ...receivedBlocks];
    const uniqueBlockIds = [...new Set(allBlocks.map(b => b.id))];
    await Promise.all(uniqueBlockIds.map(id => base44.asServiceRole.entities.Block.delete(id)));
    console.log(`Deleted ${uniqueBlockIds.length} block records`);

    // 5. Delete all reports involving this user
    const [sentReports, receivedReports] = await Promise.all([
      base44.asServiceRole.entities.Report.filter({ reporter_email: email }, null, 10000),
      base44.asServiceRole.entities.Report.filter({ reported_email: email }, null, 10000),
    ]);
    const allReports = [...sentReports, ...receivedReports];
    const uniqueReportIds = [...new Set(allReports.map(r => r.id))];
    await Promise.all(uniqueReportIds.map(id => base44.asServiceRole.entities.Report.delete(id)));
    console.log(`Deleted ${uniqueReportIds.length} report records`);

    // 6. Delete subscription record
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_email: email }, null, 100);
    await Promise.all(subscriptions.map(s => base44.asServiceRole.entities.Subscription.delete(s.id)));
    console.log(`Deleted ${subscriptions.length} subscription records`);

    // 7. Delete all profiles
    await Promise.all(allProfiles.map(p => base44.asServiceRole.entities.Profile.delete(p.id)));
    console.log(`Deleted ${allProfiles.length} profiles`);

    // 8. Delete the user account itself (allows email reuse)
    await base44.asServiceRole.entities.User.delete(user.id);
    console.log(`Deleted user account: ${email}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});