# Taskify

Taskify is a responsive React Kanban board built for the Next Play Games
software development assessment. It supports creating, editing, deleting,
searching, filtering, and dragging tasks between four workflow columns.

## Features

- Four-column drag-and-drop board
- Task details with priority, assignee, labels, due date, and description
- Interactive team roster with member creation, removal, search, and role filters
- Team members automatically become available as task assignees
- Search and priority filtering
- Due-soon and overdue indicators
- Live board totals and completion progress
- Automatic Supabase anonymous authentication and per-user RLS
- Browser-local demo fallback when Supabase variables are not configured
- Responsive sidebar, horizontal mobile board, empty/loading states, and toasts

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
4. In Supabase Authentication, enable anonymous sign-ins.
5. Add the project URL and public anon key to `.env.local`.
6. Run `npm run dev`.

Never add the Supabase service-role key to the frontend or repository.

## Data behavior

With Supabase configured, the app creates an anonymous guest session and uses
the included row-level-security policies so every guest sees only their own
tasks. Without environment variables, it remains fully interactive and stores
demo tasks in the current browser's local storage.

## Deployment

The production frontend is built and deployed through Cloudflare Workers Builds
from the `main` branch. Cloudflare runs `npm run build` and deploys the
generated Worker configuration at `dist/server/wrangler.json`.
