import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getJson<ActivitiesResponse>('/api/activities')
      .then((data) => {
        setActivities(data.activities);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
        setLoading(false);
      });
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading && <p role="status">Loading activities...</p>}
      {error && <div role="alert">Unable to load activities: {error}</div>}
      {!loading && !error && activities.length === 0 && <p>No activities</p>}
      {!loading && !error && activities.length > 0 && (
        <ul>
          {activities.map((activity, i) => (
            <li key={i}>{activity.type}</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
