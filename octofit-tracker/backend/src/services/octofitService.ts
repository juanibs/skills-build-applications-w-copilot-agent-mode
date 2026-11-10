import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const validId = (value: unknown) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  if (!validId(userId) || !validId(teamId)) throw badRequest('Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) throw badRequest('Activity userId and teamId must reference existing records');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Team input must be an object');
  }

  const { name, mascot, members: requestedMembers } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('Team mascot is required');

  const validId = (value: unknown) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  const members = requestedMembers === undefined ? [] : requestedMembers;
  if (!Array.isArray(members) || !members.every(validId)) {
    throw badRequest('Team members must be an array of valid user IDs');
  }
  const memberIds = [...new Set(members)];
  if (memberIds.length > 0 && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw badRequest('Team members must reference existing users');
  }

  const team = await Team.create({ name, mascot, members: memberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $ifNull: [{ $sum: '$activities.points' }, 0] },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map(({ teamName, totalPoints }, index) => ({ teamName, totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().sort({ title: 1 }).lean(),
  ]);
  if (workouts.length === 0) return [];

  const focusByActivityType: Record<string, string> = {
    bike: 'endurance',
    cycle: 'endurance',
    cycling: 'endurance',
    run: 'endurance',
    running: 'endurance',
    swim: 'endurance',
    walk: 'endurance',
    walking: 'endurance',
    resistance: 'strength',
    strength: 'strength',
    weightlifting: 'strength',
    weights: 'strength',
    mobility: 'mobility',
    stretch: 'mobility',
    stretching: 'mobility',
    yoga: 'mobility',
  };
  const availableFocuses = new Set(workouts.map(({ focus }) => focus.toLowerCase()));
  const recentActivity = activities.find((activity) => {
    const type = activity.type.trim().toLowerCase();
    const focus = focusByActivityType[type] ?? type;
    return availableFocuses.has(focus);
  });
  const activityType = recentActivity?.type.trim().toLowerCase();
  const activityFocus = activityType ? focusByActivityType[activityType] ?? activityType : undefined;
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const selectedFocus = activityFocus && availableFocuses.has(activityFocus)
    ? activityFocus
    : availableFocuses.has(goalFocus) ? goalFocus : undefined;
  const workout = selectedFocus
    ? workouts.find(({ focus }) => focus.toLowerCase() === selectedFocus)
    : workouts[0];

  if (!workout) return [];
  const reason = recentActivity && activityFocus === selectedFocus
    ? `Recommended because your recent ${recentActivity.type} activity aligns with the ${workout.focus} focus.`
    : `Recommended because the ${workout.focus} focus matches your ${user.fitnessGoal} fitness goal.`;
  return [{ ...workout, reason }];
}

export { User };
