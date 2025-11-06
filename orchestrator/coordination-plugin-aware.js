#!/usr/bin/env node

/**
 * Plugin-Aware Agent Coordinator
 * Enhanced coordination system with plugin agent management
 */

const fs = require('fs').promises;
const path = require('path');
const PluginAgentDiscovery = require('./plugin-agent-discovery');

class PluginAwareAgentCoordinator {
  constructor() {
    this.contextDir = path.join(process.env.HOME, '.claude/context/shared');
    this.todosDir = path.join(process.env.HOME, '.claude/todos');
    this.activeCoordinations = new Map();
    this.agentDiscovery = new PluginAgentDiscovery();
    this.discoveredAgents = null;
  }

  /**
   * Initialize the coordinator with plugin support
   */
  async initialize(forceRefresh = false) {
    try {
      await this.ensureDirectories();
      this.discoveredAgents = await this.agentDiscovery.discoverAgents(forceRefresh);
      
      console.log('✅ Plugin-aware agent coordinator initialized');
      console.log(`📊 Available agents: ${this.getTotalAgentCount()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize coordinator:', error);
      throw error;
    }
  }

  /**
   * Create coordination context for multiple agents
   */
  async createCoordination(planId, agents, tasks) {
    const coordinationId = this.generateId();
    
    const coordination = {
      id: coordinationId,
      planId: planId,
      status: 'created',
      createdAt: new Date().toISOString(),
      agents: agents,
      tasks: tasks,
      dependencies: this.calculateTaskDependencies(tasks),
      executionQueue: this.buildExecutionQueue(tasks),
      sharedContext: {},
      agentStatuses: new Map(),
      results: new Map(),
      communication: []
    };

    // Initialize agent statuses
    agents.forEach(agent => {
      coordination.agentStatuses.set(agent.name, {
        status: 'ready',
        startTime: null,
        endTime: null,
        lastUpdate: new Date().toISOString()
      });
    });

    // Save coordination
    await this.saveCoordination(coordination);
    this.activeCoordinations.set(coordinationId, coordination);

    // Create coordination todo list
    await this.createCoordinationTodo(coordination);

    console.log(`🤝 Created coordination: ${coordinationId}`);
    console.log(`📊 Coordinating ${agents.length} agents for ${tasks.length} tasks`);

    return coordinationId;
  }

  /**
   * Execute coordinated work with plugin agents
   */
  async executeCoordination(coordinationId) {
    const coordination = this.activeCoordinations.get(coordinationId);
    if (!coordination) {
      throw new Error(`Coordination not found: ${coordinationId}`);
    }

    coordination.status = 'executing';
    coordination.startedAt = new Date().toISOString();
    await this.saveCoordination(coordination);

    console.log(`\n🚀 Executing coordination: ${coordinationId}`);
    console.log(`📊 Execution batches: ${coordination.executionQueue.length}`);

    try {
      // Execute tasks in batches based on dependencies
      for (let i = 0; i < coordination.executionQueue.length; i++) {
        const batch = coordination.executionQueue[i];
        console.log(`\n📍 Batch ${i + 1}: Executing ${batch.length} tasks`);

        // Check for available plugin agents
        const batchResults = await this.executeBatch(coordination, batch);
        
        // Update coordination with batch results
        batchResults.forEach(result => {
          coordination.results.set(result.taskId, result);
        });

        // Check for failures
        const failures = batchResults.filter(r => r.status === 'failed');
        if (failures.length > 0) {
          console.warn(`⚠️  ${failures.length} tasks failed in batch ${i + 1}`);
          // Could implement retry logic here
        }
      }

      // Complete coordination
      coordination.status = 'completed';
      coordination.completedAt = new Date().toISOString();
      await this.saveCoordination(coordination);

      console.log(`\n✅ Coordination ${coordinationId} completed`);
      
      // Update todo list
      await this.updateCoordinationTodo(coordination);

      return coordination;

    } catch (error) {
      coordination.status = 'failed';
      coordination.error = error.message;
      coordination.failedAt = new Date().toISOString();
      await this.saveCoordination(coordination);
      
      console.error(`❌ Coordination ${coordinationId} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Execute a batch of tasks with plugin agents
   */
  async executeBatch(coordination, tasks) {
    const batchResults = [];

    for (const task of tasks) {
      try {
        // Select best agent for this task
        const agent = await this.selectAgentForTask(coordination, task);
        
        if (!agent) {
          throw new Error(`No suitable agent found for task: ${task.title}`);
        }

        console.log(`   → ${task.title}: ${agent.name} (${agent.model})`);

        // Update agent status
        const agentStatus = coordination.agentStatuses.get(agent.name);
        agentStatus.status = 'executing';
        agentStatus.startTime = new Date().toISOString();
        agentStatus.lastUpdate = new Date().toISOString();

        // Execute task with agent
        const result = await this.executeTaskWithAgent(coordination, task, agent);
        
        // Update agent status
        agentStatus.status = 'completed';
        agentStatus.endTime = new Date().toISOString();
        agentStatus.lastUpdate = new Date().toISOString();

        batchResults.push(result);

      } catch (error) {
        console.error(`   ❌ Task failed: ${error.message}`);
        batchResults.push({
          taskId: task.id,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return batchResults;
  }

  /**
   * Select the best agent for a task
   */
  async selectAgentForTask(coordination, task) {
    // Check if task has pre-assigned agent
    const preAssigned = coordination.agents.find(a => a.taskId === task.id);
    if (preAssigned) {
      return preAssigned.agent;
    }

    // Discover suitable agents based on task requirements
    const requirements = {
      domains: task.domains || [],
      capabilities: task.capabilities || [],
      techStack: task.techStack || {}
    };

    const agents = await this.agentDiscovery.selectAgentsForTask(
      task.description,
      requirements
    );

    if (agents.length > 0) {
      // Choose agent that's not currently busy
      for (const agent of agents) {
        const status = coordination.agentStatuses.get(agent.name);
        if (status && status.status !== 'executing') {
          return agent;
        }
      }
      
      // If all are busy, return the first one
      return agents[0];
    }

    // Fallback to available agents in coordination
    for (const agentAssignment of coordination.agents) {
      const status = coordination.agentStatuses.get(agentAssignment.agent.name);
      if (status && status.status !== 'executing') {
        if (this.isAgentSuitable(agentAssignment.agent, task)) {
          return agentAssignment.agent;
        }
      }
    }

    return null;
  }

  /**
   * Check if an agent is suitable for a task
   */
  isAgentSuitable(agent, task) {
    // Check domain match
    if (task.domains && agent.domains) {
      const domainMatch = task.domains.some(domain => 
        agent.domains.includes(domain)
      );
      if (!domainMatch) return false;
    }

    // Check capability match
    if (task.capabilities && agent.capabilities) {
      const capabilityMatch = task.capabilities.some(cap => 
        agent.capabilities.includes(cap)
      );
      if (!capabilityMatch) return false;
    }

    return true;
  }

  /**
   * Execute a task with a specific agent
   */
  async executeTaskWithAgent(coordination, task, agent) {
    // Prepare agent context
    const agentContext = {
      coordinationId: coordination.id,
      agent: agent,
      task: task,
      sharedContext: coordination.sharedContext,
      previousResults: Array.from(coordination.results.values()),
      dependencies: this.getTaskDependencies(task.id, coordination.dependencies)
    };

    // Create agent-specific prompt
    const prompt = this.createAgentPrompt(agent, task, agentContext);

    // Execute agent (integrate with your agent execution system)
    const result = await this.executeAgent(agent, prompt, agentContext);

    // Update shared context with results
    if (result.output) {
      coordination.sharedContext[`task_${task.id}_result`] = result.output;
    }

    // Add to communication log
    coordination.communication.push({
      timestamp: new Date().toISOString(),
      type: 'task_completion',
      agent: agent.name,
      task: task.id,
      message: `Completed task: ${task.title}`
    });

    return {
      taskId: task.id,
      agent: agent.name,
      status: 'completed',
      output: result.output,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create agent-specific prompt
   */
  createAgentPrompt(agent, task, context) {
    const prompt = `
You are ${agent.name}, a specialized agent with expertise in:
${agent.capabilities.map(cap => `- ${cap}`).join('\n')}

Current Task: ${task.title}
Description: ${task.description}

Coordination Context:
- Coordination ID: ${context.coordinationId}
- Shared Context Available: ${Object.keys(context.sharedContext).length} items

Task Dependencies:
${context.dependencies.length > 0 ? context.dependencies.map(dep => `- ${dep}`).join('\n') : 'No dependencies'}

Previous Results:
${context.previousResults.length > 0 ? context.previousResults.slice(-3).map(r => `- ${r.taskId}: ${r.status}`).join('\n') : 'No previous results'}

Please complete this task:
1. Use your specialized expertise
2. Leverage shared context when relevant
3. Follow dependencies requirements
4. Provide clear output for coordination

Expected Output:
${task.expectedOutput || 'Complete the task with clear deliverables'}
    `.trim();
    
    return prompt;
  }

  /**
   * Execute agent (integrate with your agent execution system)
   */
  async executeAgent(agent, prompt, context) {
    // This is where you would integrate with your actual agent execution
    // For example, using the Task tool or calling Claude with the specific agent
    
    console.log(`      📝 Executing ${agent.name} (${agent.model})...`);
    
    // Simulate execution time based on model
    const executionTime = agent.model === 'opus' ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Return mock result
    return {
      agent: agent.name,
      model: agent.model,
      output: `Task completed by ${agent.name} using ${agent.model} model`,
      artifacts: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate task dependencies
   */
  calculateTaskDependencies(tasks) {
    const dependencies = new Map();
    
    // Simple dependency calculation based on task types
    tasks.forEach(task => {
      const deps = [];
      
      if (task.type === 'implementation') {
        // Implementation tasks may depend on architecture tasks
        const archTasks = tasks.filter(t => 
          t.type === 'architecture' && t.id !== task.id
        );
        deps.push(...archTasks.map(t => t.id));
      }
      
      if (task.type === 'testing') {
        // Testing tasks depend on implementation tasks
        const implTasks = tasks.filter(t => 
          t.type === 'implementation' && t.id !== task.id
        );
        deps.push(...implTasks.map(t => t.id));
      }
      
      dependencies.set(task.id, deps);
    });
    
    return dependencies;
  }

  /**
   * Build execution queue based on dependencies
   */
  buildExecutionQueue(tasks) {
    const queue = [];
    const processed = new Set();
    const inProgress = new Set();
    
    // Simple dependency resolution
    const processTask = (task) => {
      if (processed.has(task.id)) return;
      
      const deps = this.dependencies?.get(task.id) || [];
      for (const depId of deps) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask && !processed.has(depTask.id)) {
          processTask(depTask);
        }
      }
      
      if (!inProgress.has(task.id)) {
        queue.push(task);
        inProgress.add(task.id);
      }
    };
    
    tasks.forEach(processTask);
    
    // Group tasks that can run in parallel
    const batches = [];
    const batchMap = new Map();
    
    queue.forEach(task => {
      const batch = Math.max(...(this.dependencies?.get(task.id) || []).map(depId => 
        batchMap.get(depId) || 0
      )) + 1;
      
      if (!batches[batch - 1]) {
        batches[batch - 1] = [];
      }
      batches[batch - 1].push(task);
      batchMap.set(task.id, batch);
    });
    
    return batches;
  }

  /**
   * Get task dependencies
   */
  getTaskDependencies(taskId, dependencies) {
    const deps = dependencies?.get(taskId) || [];
    return deps.map(depId => {
      return {
        taskId: depId,
        completed: Array.from(this.results || []).has(depId)
      };
    });
  }

  /**
   * Create coordination todo list
   */
  async createCoordinationTodo(coordination) {
    const todoPath = path.join(this.todosDir, `${coordination.id}-coordination.json`);
    
    const todoList = {
      id: coordination.id,
      type: 'coordination',
      title: `Coordination: ${coordination.planId}`,
      tasks: [],
      agents: coordination.agents.map(a => ({
        name: a.agent.name,
        status: 'pending',
        tasks: []
      })),
      createdAt: new Date().toISOString()
    };

    // Add tasks to todo
    coordination.tasks.forEach(task => {
      todoList.tasks.push({
        id: task.id,
        title: task.title,
        status: 'pending',
        dependencies: coordination.dependencies.get(task.id) || []
      });
    });

    await fs.writeFile(todoPath, JSON.stringify(todoList, null, 2));
    
    return coordination.id;
  }

  /**
   * Update coordination todo list
   */
  async updateCoordinationTodo(coordination) {
    const todoPath = path.join(this.todosDir, `${coordination.id}-coordination.json`);
    
    try {
      const todoList = JSON.parse(await fs.readFile(todoPath, 'utf8'));
      
      // Update task statuses
      coordination.results.forEach((result, taskId) => {
        const task = todoList.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = result.status;
          task.completedAt = result.timestamp;
        }
      });
      
      // Update todo
      await fs.writeFile(todoPath, JSON.stringify(todoList, null, 2));
      
    } catch (error) {
      console.warn('Failed to update coordination todo:', error.message);
    }
  }

  /**
   * Save coordination to file
   */
  async saveCoordination(coordination) {
    const coordPath = path.join(this.contextDir, `${coordination.id}.json`);
    await fs.writeFile(coordPath, JSON.stringify(coordination, null, 2));
  }

  /**
   * Load coordination from file
   */
  async loadCoordination(coordinationId) {
    const coordPath = path.join(this.contextDir, `${coordinationId}.json`);
    
    try {
      const content = await fs.readFile(coordPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Get coordination status
   */
  async getCoordinationStatus(coordinationId) {
    const coordination = this.activeCoordinations.get(coordinationId);
    
    if (!coordination) {
      // Try to load from file
      const loaded = await this.loadCoordination(coordinationId);
      if (loaded) {
        this.activeCoordinations.set(coordinationId, loaded);
        return loaded;
      }
    }
    
    return coordination;
  }

  /**
   * Get total agent count
   */
  getTotalAgentCount() {
    let total = 0;
    if (this.discoveredAgents) {
      for (const agents of this.discoveredAgents.values()) {
        total += agents.length;
      }
    }
    return total;
  }

  // Helper methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async ensureDirectories() {
    await fs.mkdir(this.contextDir, { recursive: true });
    await fs.mkdir(this.todosDir, { recursive: true });
  }
}

module.exports = PluginAwareAgentCoordinator;
