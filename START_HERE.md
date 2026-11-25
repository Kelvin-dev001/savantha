# START HERE — building the Savantho site with Claude Code

Everything for this project lives in this folder:

```
Savantho/
├── START_HERE.md            ← this file (you read it; Claude Code doesn't need to)
├── CLAUDE.md                ← rules Claude Code loads automatically every session
└── docs/REDESIGN_BRIEF.md   ← the full build spec Claude Code works from
```

## 1. One-time setup (PowerShell)

You need Node.js 20+ and Git for Windows installed.

```powershell
cd C:\Users\Admin\Documents\project\Savantho

# Install the two design skills into this project (.claude\skills\)
npx claude-code-templates@latest --skill creative-design/frontend-design
npx claude-code-templates@latest --skill creative-design/premium-web-design

# Check both landed
dir .claude\skills

# Start Claude Code in this folder
claude
```

If Claude Code complains that it can't find Git Bash, set the path once and reopen PowerShell:

```powershell
setx CLAUDE_CODE_GIT_BASH_PATH "C:\Program Files\Git\bin\bash.exe"
```

## 2. Pick the model

In Claude Code, type `/model` and choose **Opus** for Phases 1–3, where the design system and homepage set the quality bar. Switch to **Sonnet** for Phases 4–8.

## 3. Paste this as your first message

```
Read CLAUDE.md and docs/REDESIGN_BRIEF.md in full, then read both design skills in .claude/skills/.

You're building the new Savantho Consultancy website in this folder, following the brief exactly. CLAUDE.md holds the rules that always apply: brand tokens, compliance wording, placeholders, conventions and quality budgets.

First, reply with:
1. A one-screen plan of the 8 phases.
2. Any conflicts you see between the brief and the design skills, and how you'll resolve them.
3. Anything you need from me before starting.

Then start Phase 1 (Foundation). Stop at the Phase 1 CHECKPOINT with desktop and mobile screenshots of /styleguide, and wait for my review.
```

## 4. Prompts for the later phases

Between phases, type `/clear` to start fresh. CLAUDE.md and its status log carry the context forward. In a long phase, run `/compact` every 20–30 minutes.

**Phase 2:**
```
Read CLAUDE.md (check the status log) and section 3 of docs/REDESIGN_BRIEF.md. Do Phase 2: the motion system and the homepage hero. Stop at the CHECKPOINT with screenshots.
```

**Phase 3:**
```
Read CLAUDE.md and docs/REDESIGN_BRIEF.md sections 3–4. Do Phase 3: complete the homepage, including the pinned "How we work" section. Judge every section against "who designed this?" and redesign anything that looks templated. Stop at the CHECKPOINT.
```

**Phases 4–7** (change the number each time):
```
Read CLAUDE.md (check the status log) and docs/REDESIGN_BRIEF.md. Do Phase 4 exactly as written. Run npm run build and npm run lint:copy before committing. Update the status log, then summarise what shipped.
```

**Phase 8:**
```
Read CLAUDE.md and docs/REDESIGN_BRIEF.md. Do Phase 8 (QA): Lighthouse mobile on every page, axe on every route, the responsive sweep at all 7 widths, lint:copy and the link check. Fix everything that falls short of the budgets in CLAUDE.md. Finalise PLACEHOLDERS.md, update the status log and open a PR from redesign/v1 to main. Stop at the FINAL CHECKPOINT with a scorecard.
```

## 5. Useful corrections mid-build

- Looks generic: `This section looks templated. Re-read the frontend-design and premium-web-design skills and redesign it with more editorial confidence. Show me two directions.`
- Too much gold: `Gold is over 8% of this screen. Pull it back to hairlines and accents only.`
- Compliance slip: `Run npm run lint:copy and fix every hit; re-read the compliance rules in CLAUDE.md.`
- Swap in real assets: `Savantho sent [files] — replace the matching placeholders listed in PLACEHOLDERS.md and update that file.`
