# GitHub Copilot Instructions

This file provides instructions for the Copilot agent on how to manage and maintain the planning documentation in the `planning/` folder and ensure code quality.

---

## Scope

### Planning Files
Files in `planning/`:

* `spec.md` – detailed specification
* `prompt_plan.md` – series of LLM prompts
* `todo.md` – project checklist

### Documentation Files
All `.md` documentation files created by the Copilot agent must be placed in the `docs/` folder, including:
- Implementation guides
- Prompt summaries
- Architecture documentation
- Feature documentation
- Setup and configuration guides

On every change or commit, the agent must:

1. **Run linter and tests**

   * Execute `npm run lint` to ensure ESLint rules pass.
   * Execute `npm test` to ensure Vitest tests pass.

2. **Update `spec.md`**

   * Reflect any changes to design, architecture, or feature set.
   * Ensure spec.md is up-to-date with current implementation and any new requirements introduced by follow-up prompts.

3. **Update `prompt_plan.md`**

   * Reflect actual prompts used, including any refinements made during interactions.
   * Ensure each prompt is incremental, buildable, and safe to implement.

4. **Update `todo.md`**

   * Reflect current project state.
   * Convert completed tasks from `- [ ]` to `- [x]`.
   * Add any new tasks or adjustments resulting from new requirements or prompt updates.

---

## Workflow for the Agent

* On every code change or prompt update:

  1. Review current code and tests.
  2. Run linter and tests; fix any issues.
  3. Compare current implementation to spec.md; update spec.md to reflect any design or implementation changes.
  4. Review all prompts given; update prompt_plan.md to reflect the finalized prompts and step order.
  5. Review todo.md; mark completed tasks, add new ones if necessary, and ensure the checklist matches the current state of the project.
  6. Commit updated files with a descriptive message including which planning files were updated.

---

**Notes:**

* The agent should prioritize maintaining consistency between actual implementation and planning documentation.
* All updates must be clear, incremental, and safe to implement.
* The agent should always verify the system state before updating any planning documents.
