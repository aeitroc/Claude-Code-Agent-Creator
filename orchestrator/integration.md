---
name: workflow-status
description: Check status of active orchestration workflows and monitor progress
type: prompt
aliases: [wfs, status]
progressMessage: checking workflow status
source: builtin
allowedTools: ["Read", "LS", "Grep", "Glob", "Execute", "Bash"]
disableNonInteractive: false
---

# Workflow Status Command

Check the status of active orchestration workflows and monitor progress.

## Usage

```bash
/workflow-status
/wfs
```

## What It Shows

- 🔄 **Active Workflows**: List of currently running orchestration workflows
- 📊 **Progress**: Completion status and phase information
- ⏱️ **Duration**: How long workflows have been running
- 🤝 **Agent Status**: Which agents are active and their tasks
- 📝 **Recent Results**: Latest workflow outcomes

## Manual Status Check

For detailed status information:

```bash
cd /Users/besi/.claude/orchestrator
./cli.js list
./cli.js status <workflow-id>
```

## Workflow Information

Each workflow status includes:
- **Workflow ID**: Unique identifier for tracking
- **Type**: Template type (web-app, api-development, etc.)
- **Status**: Current execution phase
- **Progress**: Percentage complete
- **Agents**: Number of active specialized agents
- **Duration**: Execution time so far

## Examples

```bash
# Check all active workflows
/workflow-status

# Quick status check
/wfs

# Get detailed CLI status
cd /Users/besi/.claude/orchestrator && ./cli.js list
```