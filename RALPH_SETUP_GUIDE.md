# How to Use Ralph Loops for This Project

## What You Need

1. **Claude Code** installed (`npm install -g @anthropic-ai/claude-code`)
2. **Ralph plugin** (optional but recommended)
3. These 3 files in your project root:
   - `prd.json` - The task list
   - `progress.txt` - Progress tracker  
   - `PROMPT.md` - Instructions for Claude

---

## Setup Steps

### Step 1: Copy Files to Your Project

```bash
# Copy prd.json, progress.txt, and PROMPT.md to your project root
cp prd.json /path/to/your/debate-project/
cp progress.txt /path/to/your/debate-project/
cp PROMPT.md /path/to/your/debate-project/
```

### Step 2: Set Up Google OAuth (Do This First!)

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Select "Web application"
6. Add Authorized JavaScript origins:
   - `http://localhost:3000` (for dev)
   - Your production URL later
7. Copy the Client ID

### Step 3: Create Your .env Files

**backend/.env:**
```
GOOGLE_CLIENT_ID=129949364227-j8udq4v7g4nv8664t9b6jvj6imgghd1t.apps.googleusercontent.com
JWT_SECRET_KEY=generate_a_random_string_here
FRONTEND_URL=http://localhost:3000
```

**frontend/.env:**
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_API_URL=http://localhost:8000
```

---

## Running Ralph Loops

### Option A: Using Ralph Plugin (Recommended)

If you have the ralph-wiggum plugin installed:

```bash
cd /path/to/your/project

# Run single phase at a time
/ralph-loop "Read PROMPT.md and complete tasks until PHASE1_DATABASE_DONE" --max-iterations 10

# Or run all phases
/ralph-loop "Read PROMPT.md and complete all tasks until ALL_COMPLETE" --max-iterations 50
```

### Option B: Simple Bash Loop (No Plugin Needed)

Create `ralph.sh` in your project:

```bash
#!/bin/bash

# Simple Ralph loop
while true; do
  # Run Claude Code with the prompt
  claude -p "$(cat PROMPT.md)"
  
  # Check if complete
  if grep -q "ALL_COMPLETE" progress.txt; then
    echo "All tasks complete!"
    break
  fi
  
  # Small delay between iterations
  sleep 2
done
```

Then run:
```bash
chmod +x ralph.sh
./ralph.sh
```

### Option C: Human-in-the-Loop (Safest for Learning)

Run one iteration at a time and review:

```bash
# Run once
claude -p "$(cat PROMPT.md)"

# Check what it did
git diff
git log -1

# If good, run again
claude -p "$(cat PROMPT.md)"
```

---

## Running Phase by Phase

For more control, run one phase at a time:

```bash
# Phase 1: Database
claude -p "Read PROMPT.md. Only work on Phase 1 tasks. Stop after PHASE1_DATABASE_DONE"

# Phase 2: Repositories  
claude -p "Read PROMPT.md. Only work on Phase 2 tasks. Stop after PHASE2_REPOS_DONE"

# Phase 3: Backend Auth
claude -p "Read PROMPT.md. Only work on Phase 3 tasks. Stop after PHASE3_AUTH_DONE"

# Phase 4: API Routes
claude -p "Read PROMPT.md. Only work on Phase 4 tasks. Stop after PHASE4_ROUTES_DONE"

# Phase 5: Frontend Auth Setup
claude -p "Read PROMPT.md. Only work on Phase 5 tasks. Stop after PHASE5_FRONTEND_AUTH_DONE"

# Phase 6: Auth UI
claude -p "Read PROMPT.md. Only work on Phase 6 tasks. Stop after PHASE6_AUTH_UI_DONE"

# Phase 7: History Sidebar
claude -p "Read PROMPT.md. Only work on Phase 7 tasks. Stop after PHASE7_SIDEBAR_DONE"

# Phase 8: Integration
claude -p "Read PROMPT.md. Only work on Phase 8 tasks. Stop after PHASE8_INTEGRATION_DONE"

# Phase 9: Polish
claude -p "Read PROMPT.md. Only work on Phase 9 tasks. Stop after ALL_COMPLETE"
```

---

## Tips

1. **Start with human-in-the-loop** - Watch the first few iterations to make sure it understands your codebase

2. **Set max-iterations** - Always limit iterations to prevent runaway loops
   ```bash
   /ralph-loop "..." --max-iterations 20
   ```

3. **Check progress.txt** - This shows what's been done and what's next

4. **Review commits** - Each task should be one commit, making it easy to review/revert

5. **If stuck** - Edit the task description in prd.json to be more specific

---

## Phase Summary

| Phase | Name | Tasks | What It Does |
|-------|------|-------|--------------|
| 1 | DATABASE_SETUP | 5 | Create SQLite tables |
| 2 | DATABASE_REPOSITORIES | 3 | CRUD functions |
| 3 | BACKEND_AUTH | 4 | JWT & Google OAuth |
| 4 | BACKEND_API_ROUTES | 4 | REST endpoints |
| 5 | FRONTEND_AUTH_SETUP | 4 | Auth context & client |
| 6 | FRONTEND_AUTH_UI | 4 | Sign in button (top right) |
| 7 | FRONTEND_HISTORY_SIDEBAR | 5 | Chat history (left side) |
| 8 | INTEGRATE_WITH_DEBATE_VIEWS | 4 | Wire everything together |
| 9 | POLISH_AND_TEST | 4 | Loading states, errors, mobile |

**Total: 37 tasks**

---

## Troubleshooting

**Claude keeps working on wrong task:**
- Check that prd.json has correct `"done": true/false` values
- Make sure progress.txt is being updated

**Loop never exits:**
- Make sure completion promises match exactly (e.g., `<promise>ALL_COMPLETE</promise>`)
- Set --max-iterations as a safety limit

**Code doesn't match project structure:**
- Add your existing file structure to PROMPT.md so Claude knows the layout
