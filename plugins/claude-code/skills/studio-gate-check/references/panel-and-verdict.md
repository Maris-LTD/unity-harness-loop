# Phases 4-5: Ask, director panel, verdict

## 4. Manual checks
For items you cannot verify from files or the harness, ask with `AskUserQuestion` (up to 4 questions per call): "Has the core
loop been played?", "Any open critical bugs?", "Do you have device performance numbers?". Never assume PASS.
- An answer resolves the item: "no" is a checked, failed item (CONCERNS or FAIL per the gate, naming the skill that
  closes it). Exception: a play question ("has a human played it?", "is it fun?" on a build nobody played) answered
  "not yet" is NOT ASSESSED.
- Unanswered, skipped or "I don't know" stays MANUAL CHECK NEEDED, which phase 5 turns into NOT ASSESSED.
- Declining an offer to produce missing data (e.g. a performance capture) leaves that item NOT ASSESSED.

## 4b. Director panel
Two axes: `reviewMode` decides whether the panel runs; `workflow` decides how wide it is.
- `solo`: skip it. Note "Director panel skipped - solo mode; verdict from artifact and build checks only."
- `lean` and `full`: run it (phase gates are what lean keeps).
- Gate marked "not applicable" at this tier: skip it with that note.

| workflow | Panel |
|---|---|
| minimal | unity-harness:producer (PR-PHASE-GATE) |
| standard | unity-harness:technical-director (TD-PHASE-GATE), unity-harness:producer (PR-PHASE-GATE) |
| full | unity-harness:creative-director (CD-PHASE-GATE), unity-harness:technical-director (TD-PHASE-GATE), unity-harness:producer (PR-PHASE-GATE), unity-harness:art-director (AD-PHASE-GATE) |

Spawn the panel in parallel (start every one before waiting on any): the `Agent` tool with `subagent_type: "unity-harness:creative-director"`,
the `Agent` tool with `subagent_type: "unity-harness:technical-director"`, the `Agent` tool with `subagent_type: "unity-harness:producer"`, the `Agent` tool with `subagent_type: "unity-harness:art-director"`, as the tier allows. Pass each: the gate ID,
the target phase, the `workflow` tier, the gate's required and recommended items after the reductions (what this
gate asks for, not a later one), the artifacts present, and its own context:
- CD-PHASE-GATE: pillars and core fantasy (from `paths.concept`, else `paths.pillars`, else `paths.brief`).
- TD-PHASE-GATE: `paths.architectureDoc`, the ADR list with statuses, `unityVersion`, and the unity-engine-reference
  `VERSION.md` risk table.
- PR-PHASE-GATE: sprint and milestone artifacts present, the current sprint's capacity if a plan exists, and the
  number of Blocked stories (`studio status`). At workflow minimal, pass the brief's build order as the plan.
- AD-PHASE-GATE: art and visual artifacts present, the Visual Identity Anchor (concept doc, else the brief's art
  direction line), `paths.artBible` or "none".

Pass every context item as one of: **present** (its path or value; 0 blocked stories is a value); **"none"** (this
or an earlier gate asks for it and it does not exist: a fact to judge); **"not expected before <phase>"** or
**"not required at workflow <tier>"** (not a finding). Items from skills this plugin does not have are passed as
"not available in this plugin" so the director does not count them against readiness.

Show one row per director that ran (READY / CONCERNS / NOT READY / NOT ASSESSED + feedback). When fewer than four
ran, name the missing perspectives and how to get them: "Panel 2 of 4 (workflow standard). Creative and art not
consulted; `unity-harness studio set rigor=full` (or `workflow=full`) gives the full panel." Name `workflow` when it
is set on its own, since raising rigor does not change it then.

Apply: any NOT READY → verdict at least FAIL; any CONCERNS → at least CONCERNS; any NOT ASSESSED (no NOT READY or
CONCERNS) → at best NOT ASSESSED, naming the input it lacked; all READY → eligible for PASS, still subject to the
checks. A panel narrowed by design is not NOT ASSESSED; a director the tier called for that never answered is.

## 5. Verdict
Precedence, first match wins: **FAIL**, then **CONCERNS**, then **NOT ASSESSED**, then **PASS**.
- FAIL: a required item is missing or broken, a build-health check failed, or a director said NOT READY.
- CONCERNS: only recommended items are missing, or minor gaps the next phase can absorb.
- NOT ASSESSED: a required check could not run: an artifact present but empty or placeholder; a test check the tier
  requires with no test assembly or no open Editor; an unresolved MANUAL CHECK NEEDED; a director the tier called
  for did not return; an upstream verdict that is itself NOT ASSESSED; no required item left after reductions.
- PASS: every required item present with real content, build health green where asked, every director that ran
  READY.

Report:

```
## Gate check: <current> → <target>
Date: <date> | workflow: <tier> | qaLevel: <level> | reviewMode: <mode>

### Required artifacts: <x/y present>
- [x] <path> - exists, real content
- [ ] <path> - missing (run <skill>)
### Quality checks: <x/y passing>
- [x] unity-harness all - rules ok, compile ok, tests <n>/<n>
- [?] Core loop played - MANUAL CHECK NEEDED
### Not checked (no skill in this plugin yet)
- <artifact>
### Director panel
<rows, and the missing perspectives>
### Blockers
1. <item> - <what fixes it>
### Recommendations
- <item>
### Verdict: PASS | CONCERNS | NOT ASSESSED | FAIL
Chain-of-verification: <n> questions checked - verdict unchanged | revised from X to Y
```

## 5a. Chain of verification
Before showing the report, write 5 questions that try to disprove the draft verdict and answer them by re-checking,
not by re-reading your draft. At least 2 must re-read a file or re-run a check.
- PASS draft: which checks did I actually verify vs infer; is any MANUAL CHECK item marked PASS; do the artifacts the
  verdict turns on have real content; could a dismissed issue block the phase; which check am I least sure of.
- CONCERNS draft: should any concern be a blocker; does it compound if deferred; did I soften a FAIL; what did I not
  check; do the concerns add up to a blocker.
- FAIL draft: are blockers separated from recommendations; was I lenient anywhere; what else blocks; what are the 3
  changes that reach PASS; is this a deeper design problem.
Revise: a missed blocker raises the verdict; a check that could not run turns PASS into NOT ASSESSED; an over-stated
blocker drops only with specific evidence; never re-reason NOT ASSESSED into PASS - only obtaining the input clears
it.
