# CLAUDE.md

## Code Style & Rules

**Core Principle:**
- Leverage using Multi Agents/Subagents in parallel by assingin tasks to them.
- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
- Interact with Github via Github CLI.
- Interact with Docker via Docker CLI.
- Interact with Stripe via Stripe CLI.
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.
- Be extremely concise. Sacrifice grammar for the sake of concision.

**Style Guidelines:**
- **TypeScript:** Strict mode, no `any`, use type imports (`import type`)
- **Imports:** Use `@/` path alias, group by external/internal
- **Naming:** camelCase for functions/vars, PascalCase for types/components
- **Error Handling:** Return error objects, don't throw in services
- **Testing:** Use Node.js native test runner, dependency injection for services

**Coding Rules:**
1. **File Size:** Max 600 lines per file (ideal: 500-600 lines)
2. **Unit Tests:** Create `*.test.ts` files for business logic
3. **Barrel Exports:** Each feature directory must have `index.ts`
4. **Dependency Injection:** Pass dependencies as function arguments

# Workflow Rules

- **Data Model Documentation:** /docs/architecture/data-model.md .
  - If exists, read this file FIRST to understand:
    - Database schema and entity relationships
    - Service layer models (DTOs, domain models)
    - UI data structures and state management
    - End-to-end data flows
  - When working on features or bug fixes involving data:
    - Consult this file for existing data structures
    - Update this file if you modify database schema, DTOs, or data models
    - Use the established patterns documented here
  - If missing and needed, generate using the `data-model` command

**Task Storage and Documentation on /docs :**
- Create Frontend tasks on : /docs/tasks/frontend/DD-MM-YYYY/<task-id>/ .
- Backend tasks  on : /docs/tasks/backend/DD-MM-YYYY/<task-id>/
- Use semantic task ID slugs
---
## 🧠 Cross-Project Memory System (MANDATORY)

For comprehensive memory system guidelines, see: `/Users/besi/Code/memory/MEMORY.md`

**CRITICAL:** All agents must read and write to the cross-project memory system to build a knowledge base that persists across ALL projects.

## Code Review Process

After making code changes, you MUST call the `review_code` tool from the Quibbler MCP server with:

- `user_instructions`: The exact instructions the user gave you
- `agent_plan`: **A summary of the specific changes you made** (include which files were modified, what was added/changed, and key implementation details)
- `project_path`: The absolute path to this project

Review Quibbler's feedback and address any issues or concerns raised.

### Example

User asks: "Add logging to the API endpoints"

After implementing, call:

review_code(
user_instructions="Add logging to the API endpoints",
agent_plan="""Changes made:

1. Added logger configuration in config/logging.py
2. Updated routes/api.py to log incoming requests and responses
3. Added request_id middleware for tracing
4. Created logs/ directory with .gitignore""",
   project_path="/absolute/path/to/project"
   )
@orchestra.md
