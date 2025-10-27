#!/usr/bin/env node

/**
 * Dynamic Agent Creation System
 * Main workflow for creating and managing specialized agents
 */

const fs = require('fs');
const path = require('path');
const { ProjectAnalyzer } = require('./project-analyzer');
const { AgentTemplates } = require('./agent-templates');

class AgentCreator {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.analyzer = new ProjectAnalyzer(projectPath);
    this.templates = new AgentTemplates();
    this.createdAgents = new Map();
    this.agentWorkflows = new Map();
  }

  async createAgentTeam(options = {}) {
    console.log('🚀 Starting agent team creation process...');
    
    try {
      // 1. Analyze project
      const analysis = await this.analyzer.analyze();
      console.log('📊 Project analysis completed');
      
      // 2. Determine agent needs
      const agentNeeds = this.determineAgentNeeds(analysis, options);
      console.log(`🎯 Identified ${agentNeeds.length} agent needs`);
      
      // 3. Create agents
      const agents = await this.createAgents(agentNeeds);
      console.log(`✅ Created ${agents.length} specialized agents`);
      
      // 4. Setup agent workflows
      await this.setupAgentWorkflows(agents);
      console.log('⚙️ Agent workflows configured');
      
      // 5. Generate coordination plan
      const coordinationPlan = this.generateCoordinationPlan(agents);
      
      return {
        project: analysis,
        agents: agents,
        coordination: coordinationPlan,
        created: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Agent creation failed:', error.message);
      throw error;
    }
  }

  determineAgentNeeds(analysis, options) {
    const needs = [];
    const { technologies, patterns, complexity, trajectory } = analysis;
    
    // Frontend needs
    if (technologies.react || technologies.vue || technologies.angular) {
      needs.push({
        type: 'frontend-architect',
        priority: 'high',
        reason: `Frontend framework detected: ${Object.keys(technologies).filter(t => ['react', 'vue', 'angular'].includes(t)).join(', ')}`,
        scope: 'component-development, ui-implementation, frontend-architecture'
      });
    }

    // Backend needs
    if (technologies.node || technologies.python || technologies.java || technologies.go) {
      needs.push({
        type: 'backend-engineer',
        priority: 'high',
        reason: `Backend technologies detected: ${Object.keys(technologies).filter(t => ['node', 'python', 'java', 'go'].includes(t)).join(', ')}`,
        scope: 'api-development, server-logic, database-integration'
      });
    }

    // Database needs
    if (patterns['database-heavy'] || technologies.database) {
      needs.push({
        type: 'database-architect',
        priority: 'medium',
        reason: 'Database complexity detected',
        scope: 'schema-design, optimization, migrations'
      });
    }

    // Testing needs
    if (!technologies.testing || patterns['testing-missing']) {
      needs.push({
        type: 'testing-expert',
        priority: 'high',
        reason: 'Testing coverage gaps detected',
        scope: 'test-strategy, automation, quality-assurance'
      });
    }

    // Security needs
    if (patterns['security-concerns'] || options.securityFocus) {
      needs.push({
        type: 'security-specialist',
        priority: 'high',
        reason: 'Security concerns detected or security focus requested',
        scope: 'security-audit, vulnerability-assessment, secure-implementation'
      });
    }

    // DevOps needs
    if (technologies.docker || technologies.kubernetes || technologies.cicd) {
      needs.push({
        type: 'devops-engineer',
        priority: 'medium',
        reason: 'DevOps technologies detected',
        scope: 'deployment, ci-cd, infrastructure'
      });
    }

    // Performance needs
    if (patterns['performance-concerns'] || complexity > 4) {
      needs.push({
        type: 'performance-optimizer',
        priority: 'medium',
        reason: 'Performance concerns or high complexity detected',
        scope: 'performance-analysis, optimization, monitoring'
      });
    }

    // Documentation needs
    if (patterns['documentation-missing']) {
      needs.push({
        type: 'documentation-writer',
        priority: 'low',
        reason: 'Documentation gaps detected',
        scope: 'technical-docs, api-documentation, user-guides'
      });
    }

    // Integration needs
    if (patterns['api-heavy'] || options.integrationFocus) {
      needs.push({
        type: 'integration-specialist',
        priority: 'medium',
        reason: 'API-heavy project or integration focus requested',
        scope: 'third-party-integrations, api-connections, data-sync'
      });
    }

    // Code review needs (high activity projects)
    if (trajectory.activity > 15) {
      needs.push({
        type: 'code-reviewer',
        priority: 'medium',
        reason: 'High development activity detected',
        scope: 'code-quality, standards, best-practices'
      });
    }

    // Apply user preferences
    if (options.maxAgents) {
      needs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      return needs.slice(0, options.maxAgents);
    }

    return needs;
  }

  async createAgents(agentNeeds) {
    const agents = [];
    
    for (const need of agentNeeds) {
      try {
        const agent = await this.createSingleAgent(need);
        agents.push(agent);
        this.createdAgents.set(agent.id, agent);
        
        console.log(`  ✓ Created ${agent.name} agent (${agent.id})`);
      } catch (error) {
        console.error(`  ✗ Failed to create agent for ${need.type}:`, error.message);
      }
    }
    
    return agents;
  }

  async createSingleAgent(need) {
    const agentConfig = this.templates.createAgent(need.type);
    
    // Customize agent based on need
    agentConfig.priority = need.priority;
    agentConfig.reason = need.reason;
    agentConfig.scope = need.scope;
    agentConfig.projectPath = this.projectPath;
    
    // Create agent directory structure
    await this.createAgentDirectory(agentConfig);
    
    // Generate agent file
    await this.generateAgentFile(agentConfig);
    
    return agentConfig;
  }

  async createAgentDirectory(agentConfig) {
    const agentDir = path.join(this.projectPath, '.claude', 'agents');
    
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    agentConfig.directory = agentDir;
  }

  async generateAgentFile(agentConfig) {
    const agentContent = this.generateAgentMarkdown(agentConfig);
    const agentFile = path.join(agentConfig.directory, `${agentConfig.name}.md`);
    
    fs.writeFileSync(agentFile, agentContent, 'utf8');
    agentConfig.file = agentFile;
  }

  generateAgentMarkdown(agentConfig) {
    const template = this.templates.getTemplate(agentConfig.name);
    
    return `---
name: ${agentConfig.name}
description: ${agentConfig.description}
model: ${agentConfig.model}
tools: ["Read", "LS", "Grep", "Glob", "Create", "Edit", "MultiEdit", "Execute", "WebSearch", "FetchUrl", "TodoWrite"]
---

You are a ${agentConfig.name}, a specialized development agent created to address specific project needs.

## Primary Focus
${agentConfig.reason}

## Scope of Work
${agentConfig.scope}

## Priority Level
${agentConfig.priority}

## Capabilities
${agentConfig.capabilities.map(cap => `- ${cap}`).join('\n')}

## Focus Areas
${agentConfig.focusAreas.map(area => `- ${area}`).join('\n')}

## Workflow
1. **Analyze Project Context**: Understand the current state and immediate needs
2. **Execute Assigned Tasks**: Work on tasks within your defined scope
3. **Collaborate with Team**: Coordinate with other agents through shared task management
4. **Maintain Quality**: Ensure all work follows project standards and best practices
5. **Report Progress**: Provide regular updates on task completion and blockers

## Coordination Protocol
- Use TodoWrite for shared task management
- Coordinate with other agents when tasks overlap
- Escalate blockers through the established priority system
- Follow the project's coding standards and conventions

## Project Context
This agent was created for: ${this.projectPath}
Agent created: ${agentConfig.createdAt}
Priority: ${agentConfig.priority}
`;
  }

  async setupAgentWorkflows(agents) {
    // Create workflow coordination files
    const workflowDir = path.join(this.projectPath, '.claude', 'workflows');
    
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
    
    // Generate workflow coordination file
    const coordinationFile = path.join(workflowDir, 'agent-coordination.md');
    const coordinationContent = this.generateCoordinationContent(agents);
    
    fs.writeFileSync(coordinationFile, coordinationContent, 'utf8');
    
    // Setup individual agent workflows
    for (const agent of agents) {
      await this.setupAgentWorkflow(agent);
    }
  }

  generateCoordinationContent(agents) {
    const content = `# Agent Team Coordination

**Created:** ${new Date().toISOString()}
**Team Size:** ${agents.length}
**Project:** ${this.projectPath}

## Team Composition
${agents.map((agent, index) => `
${index + 1}. **${agent.name}** (${agent.priority})
   - Focus: ${agent.scope}
   - Reason: ${agent.reason}
`).join('')}

## Coordination Protocols

### Task Assignment
- Use TodoWrite for shared task management
- Assign tasks to specific agents with clear scope definitions
- Track dependencies between agents

### Communication
- Regular status updates through shared documentation
- Cross-agent collaboration for overlapping tasks
- Conflict resolution through priority-based decision making

### Workflow Integration
1. **Daily Planning:** Agents review and prioritize tasks
2. **Parallel Execution:** Agents work on independent tasks simultaneously
3. **Integration Points:** Coordinate when tasks overlap or depend on each other
4. **Quality Review:** Cross-agent review for critical components

### Priority Handling
- High priority agents take precedence in resource allocation
- Conflicts resolved based on project impact assessment
- Escalation protocol for blocking issues

## Monitoring and Optimization
- Track agent performance and contribution
- Adjust agent allocation based on project evolution
- Retire or repurpose agents as needs change

## Emergency Procedures
- Agent failure handling and task reassignment
- Critical issue escalation paths
- Backup agent activation protocols
`;

    return content;
  }

  async setupAgentWorkflow(agent) {
    const workflowFile = path.join(agent.directory, 'workflow.md');
    const workflowContent = this.generateAgentWorkflow(agent);
    
    fs.writeFileSync(workflowFile, workflowContent, 'utf8');
    this.agentWorkflows.set(agent.id, workflowFile);
  }

  generateAgentWorkflow(agent) {
    return `# ${agent.name} Workflow

**Agent ID:** ${agent.id}
**Created:** ${agent.createdAt}
**Priority:** ${agent.priority}

## Daily Workflow

### 1. Task Assessment (Start of Day)
- Review assigned tasks via TodoWrite
- Identify high-priority items
- Check for cross-agent dependencies
- Plan execution strategy

### 2. Execution Phase
- Work on tasks within defined scope
- Regular progress updates
- Cross-agent communication as needed
- Quality checks and validation

### 3. Coordination Activities
- Coordinate with other agents on overlapping tasks
- Resolve conflicts through established protocols
- Share progress updates and blockers

### 4. End-of-Day Review
- Complete status update
- Plan next day's priorities
- Identify areas needing cross-agent support

## Task Management
- Use TodoWrite for task tracking
- Update task status regularly
- Mark completed items appropriately
- Flag blockers and dependencies

## Communication Protocol
- Update shared documentation regularly
- Coordinate with other agents through established channels
- Escalate issues through priority system

## Quality Standards
- Follow project coding standards
- Ensure all work is tested and validated
- Document decisions and implementations
- Participate in cross-agent reviews
`;
  }

  generateCoordinationPlan(agents) {
    return {
      teamSize: agents.length,
      highPriorityAgents: agents.filter(a => a.priority === 'high').length,
      coordinationProtocol: 'TodoWrite-based task management',
      communicationChannels: ['shared-documentation', 'cross-agent-updates'],
      escalationPaths: ['priority-based', 'project-impact-assessment'],
      monitoringMetrics: [
        'task-completion-rate',
        'code-quality-improvements',
        'issue-resolution-speed',
        'team-collaboration-effectiveness'
      ]
    };
  }

  async monitorAgentPerformance() {
    const performance = {};
    
    for (const [agentId, agent] of this.createdAgents) {
      // Analyze agent's contribution and effectiveness
      const agentPerformance = await this.analyzeAgentPerformance(agent);
      performance[agentId] = agentPerformance;
    }
    
    return performance;
  }

  async analyzeAgentPerformance(agent) {
    // This would analyze the agent's actual work and contributions
    // For now, return a placeholder
    return {
      agentId: agent.id,
      tasksCompleted: 0,
      qualityScore: 0,
      collaborationScore: 0,
      efficiency: 0,
      lastActive: new Date().toISOString()
    };
  }

  async adaptAgentAllocation() {
    const performance = await this.monitorAgentPerformance();
    const adaptations = [];
    
    for (const [agentId, perf] of Object.entries(performance)) {
      if (perf.efficiency < 0.5) {
        // Consider repurposing or retiring this agent
        adaptations.push({
          agentId,
          action: 'review',
          reason: 'Low efficiency detected'
        });
      }
    }
    
    return adaptations;
  }
}

module.exports = { AgentCreator };
