import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return Response.json({ error: 'profileId required' }, { status: 400 });

    // Verify profile belongs to this user
    const profile = await base44.asServiceRole.entities.Profile.get(profileId);
    if (!profile || profile.created_by !== user.email) {
      return Response.json({ error: 'Profile not found or unauthorized' }, { status: 403 });
    }

    const [sessions, seasons, allFriends, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.Session.filter({ profile_id: profileId }, '-date', 10000),
      base44.asServiceRole.entities.Season.filter({ profile_id: profileId }, '-created_date', 10000),
      base44.asServiceRole.entities.Friend.list(null, 10000),
      base44.asServiceRole.entities.Profile.list(null, 10000),
    ]);

    const profileById = {};
    for (const p of allProfiles) profileById[p.id] = p;

    // Collect accepted friend records for this profile
    const friends = allFriends
      .filter(f => f.status === 'accepted' && (f.sender_profile_id === profileId || f.friend_profile_id === profileId))
      .map(f => {
        const otherProfileId = f.sender_profile_id === profileId ? f.friend_profile_id : f.sender_profile_id;
        const other = profileById[otherProfileId] || {};
        return { name: other.name || '', username: other.username || '', profile_id: otherProfileId };
      });

    const exportData = {
      exported_at: new Date().toISOString(),
      account_email: user.email,
      profile: {
        name: profile.name,
        username: profile.username,
        position: profile.position,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        created_date: profile.created_date,
      },
      seasons: seasons.map(s => ({
        season_year: s.season_year,
        team_name: s.team_name,
        is_active: s.is_active,
        selected_stats: s.selected_stats,
      })),
      sessions: sessions.map(s => ({
        date: s.date,
        type: s.type,
        opponent: s.opponent,
        result: s.result,
        duration: s.duration,
        goals: s.goals,
        assists: s.assists,
        shots: s.shots,
        plus_minus: s.plus_minus,
        hits: s.hits,
        blocked_shots: s.blocked_shots,
        takeaways: s.takeaways,
        giveaways: s.giveaways,
        penalty_minutes: s.penalty_minutes,
        power_play_goals: s.power_play_goals,
        power_play_points: s.power_play_points,
        shorthanded_goals: s.shorthanded_goals,
        shorthanded_points: s.shorthanded_points,
        time_on_ice: s.time_on_ice,
        faceoff_wins: s.faceoff_wins,
        faceoff_losses: s.faceoff_losses,
        rating: s.rating,
        notes: s.notes,
      })),
      friends,
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});