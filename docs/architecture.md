# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components focused on rendering and load API data through the shared client, with accessible loading, error, and empty states.
- Logic tier decision: Keep Express routes thin and delegate validation and capability behavior to services; return deliberate 4xx responses for invalid input or missing records.
- Data tier decision: Use Mongoose models with required fields and references, and seed with idempotent upserts that preserve unrelated existing records.
- Activity tracking approach: Validate user and team IDs and confirm both records exist before creating an activity; compute points and occurrence time on the server.
- Team management approach: Validate the required team name, preserve the submitted name and mascot, and store member references in the team.
- Leaderboard approach: Sum activity points by team, sort totals descending, and assign 1-based ranks in the logic tier.
- Workout suggestions approach: Match the user by email, select suggestions based on their fitness goal or recent activities, include an explanatory reason, and return 4xx for an unknown user.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — failures indicate missing model validation/defaults or seed data that is incomplete, non-idempotent, or overwrites unrelated records.
- API command: `npm run test:api --prefix octofit-tracker/backend` — failures indicate that an endpoint does not meet its response, validation, relationship, ranking, or recommendation contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — failures indicate missing API data rendering or accessible loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — failures indicate TypeScript errors in the backend implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — failures indicate TypeScript errors or frontend assets that Vite cannot build.
