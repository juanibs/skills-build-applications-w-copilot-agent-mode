import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getJson<TeamsResponse>('/api/teams')
      .then((data) => {
        setTeams(data.teams);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
        setLoading(false);
      });
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {loading && <p role="status">Loading teams...</p>}
      {error && <div role="alert">Unable to load teams: {error}</div>}
      {!loading && !error && teams.length === 0 && <p>No teams</p>}
      {!loading && !error && teams.length > 0 && (
        <ul>
          {teams.map((team, i) => (
            <li key={i}>{team.name}</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
