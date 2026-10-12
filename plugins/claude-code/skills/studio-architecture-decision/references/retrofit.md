# Retrofit mode (`retrofit <path>`)

Adds missing parts to an existing ADR. Never changes content that is already there.

1. Read the ADR in full.
2. Check what is present (header lines from `references/adr-template.md`, sections by heading):
   - `> **Status**:` line: BLOCKING if missing (story-readiness and acceptance cannot read it). If the ADR has a
     `## Status` section instead, the fix is to add the header line with the same value.
   - `## ADR Dependencies`: HIGH if missing (ordering and acceptance break).
   - `## Engine Compatibility`: HIGH if missing (Unity version risk unknown).
   - `## GDD Requirements Addressed`: MEDIUM if missing (traceability lost).
   - `> **Date**:` (or a `## Date` / `## Last Verified` section): MEDIUM if all are missing (stories cannot tell
     whether the ADR changed after they were written).
3. Show:

```
## Retrofit: <ADR title>
File: <path>

Present (will not be touched):
- Status: <value, or MISSING>
- <section>

Missing, to add:
- Status - BLOCKING
- ADR Dependencies - HIGH
- Engine Compatibility - HIGH
```

4. Ask: "Add the <N> missing parts? Existing content stays as it is." No → write nothing, list what is missing.
5. Yes:
   - Status: ask with `AskUserQuestion`: Proposed / Accepted / Deprecated / Superseded by ADR-XXXX. An `Accepted` answer is
     written as `Proposed`; after the other parts are added, run acceptance mode (`references/accept.md`) on this
     ADR so its dependency check, confirmation and story unblocking still apply.
   - ADR Dependencies: ask what it depends on, enables and blocks; "None" per field is fine.
   - Engine Compatibility: do step 1 of SKILL.md (Unity context) for its domain, confirm the domain with the user,
     then fill the table from verified data.
   - GDD Requirements Addressed: ask which GDD systems motivated it and which requirement each one covers.
   - Date: add `> **Date**:` with today's date and say it records the retrofit, not the original decision.
   Add header lines directly under the title; append sections at the end. Never edit an existing section.
6. Suggest studio-architecture-review (in a fresh session) to re-check coverage now that the ADR has its Status and
   Dependencies.
