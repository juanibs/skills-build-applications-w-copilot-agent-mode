import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason: string };
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const userEmail = 'mona@example.com';
    getJson<WorkoutsResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((data) => {
        setSuggestions(data.suggestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
        setLoading(false);
      });
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {error && <div role="alert">Unable to load suggestions: {error}</div>}
      {!loading && !error && suggestions.length === 0 && <p>No suggestions</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul>
          {suggestions.map((workout, i) => (
            <li key={i}>{workout.title}</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
