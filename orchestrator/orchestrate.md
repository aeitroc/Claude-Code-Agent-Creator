---
name: orchestrate
description: Orchestrate multi-agent workflows for complex development tasks. Launches parallel agents, manages dependencies, and coordinates work through intelligent task distribution.
type: prompt
aliases: [orch]
progressMessage: orchestrating workflow
source: builtin
allowedTools: ["Read", "LS", "Grep", "Glob", "Create", "Edit", "MultiEdit", "Execute", "WebSearch", "FetchUrl", "TodoWrite", "Bash"]
disableNonInteractive: false
---

# Orchestrate Command

Use the orchestration system to manage complex multi-agent workflows.

## Usage

Execute complex workflows with parallel agent coordination:

```bash
/orchestrate "Build a complete web application with React frontend and Node.js backend"
/orchestrate "Create a REST API with database design and testing"
/orchestrator "Develop a React component with comprehensive testing"
```

## Available Workflow Templates

1. **Web Application Development** (`web-app`)
   - Complete web application with frontend, backend, database, and deployment
   - Estimated time: 1-3 days
   - Phases: Requirements → Frontend → Backend → Database → Integration → Deployment

2. **API Development** (`api-development`)
   - RESTful API with documentation and testing
   - Estimated time: 4-8 hours
   - Phases: API design → Database schema → Implementation → Testing → Documentation

3. **Frontend Component** (`frontend-component`)
   - React/Vue component with testing and styling
   - Estimated time: 4-8 hours
   - Phases: Analysis → Implementation → Testing → Styling

## How It Works

1. **Analysis**: System analyzes request complexity and identifies required domains
2. **Planning**: Creates execution plan with task dependencies
3. **Agent Selection**: Chooses optimal specialized agents for each task
4. **Parallel Execution**: Launches multiple agents simultaneously
5. **Coordination**: Manages inter-agent communication and context sharing
6. **Integration**: Combines results and delivers final output

## Manual Commands

For advanced usage, you can also use the orchestration CLI directly:

```bash
cd /Users/besi/.claude/orchestrator
./cli.js execute "your request here"
./cli.js status <workflow-id>
./cli.js list
./cli.js templates
```

## Examples

```bash
# Complete web application
/orchestrate "Build an e-commerce site with React, Node.js, and PostgreSQL"

# API development
/orchestrate "Create a user management API with authentication"

# Frontend component
/orchestrate "Build a reusable data table component with sorting and filtering"

# Testing and QA
/orchestrate "Set up comprehensive testing for an existing React application"
```

The orchestration system automatically handles:
- ✅ Task decomposition and dependency management
- ✅ Parallel agent execution
- ✅ Real-time coordination and context sharing
- ✅ Error handling and recovery
- ✅ Progress monitoring and reporting