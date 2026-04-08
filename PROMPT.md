# Ralph Loop PROMPT — Cleanup & UI Polish

## Purpose
Follow a strict Ralph loop: pick the FIRST task in `prd.json` with `"done": false`, implement only that task, test it, update `prd.json` and `progress.txt`, then commit with the required message. Repeat.

## Rules (copy of essential rules)
1. Read `prd.json` and `progress.txt`.
2. Find the FIRST task where `"done": false`.
3. Implement ONLY that single task.
4. Test it (manual or automated as described by task).
5. Update `prd.json` and set that task's `"done": true`.
6. Update `progress.txt`:
   - Move the task into Completed Tasks (append).
   - Update `Current Phase` and `Current Task` to the next incomplete task.
7. Commit changes with message: `Complete task X.X: [task description]`.
8. KEEP CHANGES SMALL — one task per commit.
9. If the task requires DB schema changes, prefer frontend-only implementation first; only add DB migration when the PRD task explicitly asks for it.
10. When a phase completes (all tasks in that phase done), print the phase's `completion_promise` in your terminal/PR description.

## Commit & Tag policy
- Use the exact commit message pattern above.
- When ALL tasks across all phases are completed, make a release commit and add tag `v1.1.0` (or bump version as needed) and output `<promise>ALL_COMPLETE</promise>`.

## Testing & Acceptance
- Each task contains `test_instructions`. Follow them and include short evidence in the commit message or PR description (e.g., "Tested sign-in on Chrome, Firefox; focus states visible; sample screenshot attached").
- For env and build tasks, run both `npm run dev` and `npm run prod` locally and include a short note in the commit message which environment was tested.

## Quick tips
- Respect theming variables: use CSS variables for colors so changes are low-friction.
- Keep repository changes limited to the files necessary for the task.
- If uncertain about implementation detail, make a best-effort and note assumptions in the commit message.
