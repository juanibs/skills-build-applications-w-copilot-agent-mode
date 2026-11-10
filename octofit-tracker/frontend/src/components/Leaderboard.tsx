import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((data) => {
        setLeaderboard(data.leaderboard);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setLoading(false);
      });
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <div role="alert">Unable to load leaderboard: {error}</div>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard</p>}
      {!loading && !error && leaderboard.length > 0 && (
        <ul>
          {leaderboard.map((entry, i) => (
            <li key={i}>
              {entry.teamName}: {entry.totalPoints}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
