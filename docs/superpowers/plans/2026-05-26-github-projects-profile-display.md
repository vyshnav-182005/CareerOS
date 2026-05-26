# GitHub Projects Profile Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display all public GitHub repositories from the entered profile URL with LLM-generated ATS-friendly bullet points.

**Architecture:** Extend the existing GitHub project summary backend route to accept profile URLs and return LLM points merged with repository metadata. Keep the frontend GitHub summaries in `ProfileForm` state and render them through `ProfileResults` as a separate, verifiable GitHub Projects section.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Testing Library, OpenRouter, GitHub REST API.

---

## File Structure

- Modify `src/app/api/projects-summary/route.ts`: accept `githubUrl`, merge repo metadata into summaries, return `GitHubProjectSummary[]`.
- Create `src/app/api/projects-summary/route.test.ts`: route tests for username, URL, validation, GitHub error, and OpenRouter error.
- Modify `src/components/profile-form.tsx`: add GitHub projects state, fetch action, and pass projects to results.
- Modify `src/components/profile-results.tsx`: render GitHub project cards with repo metadata and ATS bullets.
- Create `src/components/profile-form.test.tsx`: verify the GitHub action calls the API and displays returned projects.

## Task 1: Backend Route Tests

- [ ] Write route tests mocking `fetchGitHubUserProjects` and `generateProjectSummaries`.
- [ ] Run `npm.cmd test -- src/app/api/projects-summary/route.test.ts` and confirm tests fail where current route does not meet the new contract.
- [ ] Update `src/app/api/projects-summary/route.ts`.
- [ ] Run the route tests and confirm they pass.

## Task 2: Frontend Tests

- [ ] Write `src/components/profile-form.test.tsx` to render the form, enter a GitHub URL, click the GitHub projects button, and assert rendered repo details and ATS points.
- [ ] Run `npm.cmd test -- src/components/profile-form.test.tsx` and confirm it fails before UI changes.
- [ ] Update `src/components/profile-form.tsx` and `src/components/profile-results.tsx`.
- [ ] Run the frontend test and confirm it passes.

## Task 3: Verification

- [ ] Run targeted new tests: `npm.cmd test -- src/app/api/projects-summary/route.test.ts src/components/profile-form.test.tsx`.
- [ ] Run `npm.cmd run build`.
- [ ] Run full `npm.cmd test` and report any unrelated pre-existing failures.

## Self-Review

Spec coverage: backend URL support, all repos, LLM summaries, UI display, and error states are covered.

Placeholder scan: no unresolved placeholders.

Type consistency: `GitHubProjectSummary` will include `title`, `url`, `description`, `language`, `topics`, `stars`, and `atsPoints` across backend and frontend.
