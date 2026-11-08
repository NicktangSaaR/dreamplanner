# Shared code (website + future WeChat mini program)

Code here must run on both platforms, so it stays plain TypeScript:

- no React, no DOM (`window`, `document`, `localStorage`), no `@/` imports;
- data functions take the Supabase client as their first argument, so the
  mini program can pass a client whose `fetch` and auth storage use `wx.*`;
- permissions are enforced by the database (row-level security), never here.

| File | What |
| --- | --- |
| `planning.ts` | Quarters, academic year, stages, goal parsing, dates |
| `studentApi.ts` | Student-side reads and to-do writes: current plan, published reports, meeting notes with task status, upload requests, shared folder, quarter goals, to-dos |

The website uses these through `src/features/student-home` and
`src/features/counselor/plan/planData.ts`. A mini program (e.g. Taro) would
import the same files and add its own UI, WeChat login and file upload.
