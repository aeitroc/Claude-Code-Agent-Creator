# CLAUDE.md

## Code Style & Rules

**Core Principle:**
- Leverage using Multi Agents/Subagents in parallel by assigning tasks to them.
- Use agent manager to create specialized subagents: `./agent-manager create /project-folder --max-agents 3`
- Launch agents in parallel when tasks can be divided by expertise.
- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
- Interact with Github via Github CLI.
- Interact with Docker via Docker CLI.
- Interact with Stripe via Stripe CLI.
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.

## Feature Implementation System Guidelines

### Feature Implementation Priority Rules
- IMMEDIATE EXECUTION: Launch parallel Tasks immediately upon feature requests.
- NO CLARIFICATION: Skip asking what type of implementation unless absolutely critical.
- PARALLEL BY DEFAULT: Always use 7-parallel-Task method for efficiency.

**Style Guidelines:**
- **TypeScript:** Strict mode, no `any`, use type imports (`import type`)
- **Imports:** Use `@/` path alias, group by external/internal
- **Naming:** camelCase for functions/vars, PascalCase for types/components
- **Error Handling:** Return error objects, don't throw in services
- **Testing:** Use Node.js native test runner, dependency injection for services

**Coding Rules:**
1. **File Size:** Max 600 lines per file (ideal: 500-600 lines)
2. **Single Responsibility:** Each file must have one primary responsibility
3. **Documentation:** JSDoc required for all public APIs (`@param`, `@returns`)
4. **Unit Tests:** Create `*.test.ts` files for business logic
5. **Barrel Exports:** Each feature directory must have `index.ts`
6. **Dependency Injection:** Pass dependencies as function arguments

# Workflow Rules

**Data Model Changes:**
- Update `./docs/architecture/data-model.md` if schema changes required
- Create file if it doesn't exist

**Task Storage and Documentation:**
- Only create Documentation when necessary for complex features ONLY.
- Frontend tasks: `docs/tasks/frontend/DD-MM-YYYY/<task-id>/`
- Backend tasks: `docs/tasks/backend/DD-MM-YYYY/<task-id>/`
- Use semantic task ID slugs
---
## 🤖 Agent Management System (AVAILABLE)

**Agent Manager:** `@agents/agent-manager.md` - Ultra-intelligent agent that creates specialized subagents

**Use Agent Manager to:**
- Analyze project needs and create specialized subagents for parallel work
- Detect current requirements and anticipate future needs
- Create agents in `/project-folder/.claude/agents/` as `.md` files
- Orchestrate multiple agents working simultaneously

**Agent Types Available:**
- frontend-architect, backend-engineer, testing-expert, security-specialist
- devops-engineer, database-architect, performance-optimizer
- documentation-writer, integration-specialist, code-reviewer

**When to Use Agent Manager:**
- Complex tasks requiring multiple expertise areas
- Parallel development needed for speed
- Large codebases requiring specialized knowledge
- Tasks that can be divided by domain/technology

**Process:**
1. Use `@agents/agent-manager.md` to analyze project needs
2. Agent manager creates specialized subagents as `.md` files
3. Launch created agents in parallel for coordinated work
4. Agents coordinate via TodoWrite and shared documentation

## 🧠 Cross-Project Memory System (MANDATORY)

For comprehensive memory system guidelines, see: `/prompts/memory-system.md`

**CRITICAL:** All agents must read and write to the cross-project memory system to build a knowledge base that persists across ALL projects.