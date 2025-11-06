#!/usr/bin/env node

/**
 * Orchestration Engine
 * Core engine for managing multi-agent workflows, task distribution, and parallel execution
 */

const fs = require('fs').promises;
const path = require('path');

class OrchestrationEngine {
  constructor() {
    this.plansDir = {
      active: path.join(process.env.HOME, '.claude/plans/active'),
      completed: path.join(process.env.HOME, '.claude/plans/completed'),
      context: path.join(process.env.HOME, '.claude/context/shared')
    };
    this.activePlans = new Map();
    this.agentPool = new Map();
    this.executionHistory = [];
  }

  /**
   * Initialize the orchestration engine
   */
  async initialize() {
    try {
      await this.ensureDirectories();
      await this.loadActivePlans();
      await this.initializeAgentPool();
      console.log('Orchestration engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize orchestration engine:', error);
      throw error;
    }
  }

  /**
   * Create and execute a new orchestration plan
   */
  async createPlan(request, options = {}) {
    const planId = this.generateId();
    const plan = {
      id: planId,
      request: request,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      complexity: await this.analyzeComplexity(request),
      tasks: [],
      agents: [],
      dependencies: new Map(),
      context: {},
      results: {},
      options: options
    };

    // Decompose request into tasks
    plan.tasks = await this.decomposeTask(request, plan.complexity);

    // Select agents for each task
    plan.agents = await this.selectAgents(plan.tasks);

    // Setup dependencies
    plan.dependencies = this.calculateDependencies(plan.tasks);

    // Save plan
    await this.savePlan(plan);

    // Start execution if auto-start is enabled
    if (options.autoStart !== false) {
      await this.executePlan(planId);
    }

    return plan;
  }

  /**
   * Execute a plan by launching and coordinating agents
   */
  async executePlan(planId) {
    const plan = await this.loadPlan(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    plan.status = 'executing';
    plan.startedAt = new Date().toISOString();
    await this.savePlan(plan);

    try {
      // Create shared context
      const contextFile = path.join(this.plansDir.context, `${planId}.json`);
      await this.createSharedContext(plan, contextFile);

      // Create coordination todo list
      const todoId = await this.createCoordinationTodo(plan);

      // Launch agents based on dependencies
      const executionQueue = this.buildExecutionQueue(plan);
      const agentPromises = [];

      for (const batch of executionQueue) {
        const batchPromises = batch.map(async (task) => {
          return await this.launchAgentForTask(task, plan, todoId, contextFile);
        });

        // Wait for current batch to complete before next batch
        const batchResults = await Promise.allSettled(batchPromises);
        agentPromises.push(...batchResults);
      }

      // Monitor execution and collect results
      const results = await this.monitorExecution(planId, agentPromises);

      // Complete the plan
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
      plan.results = results;

      // Move to completed
      await this.moveToCompleted(plan);

      return plan;

    } catch (error) {
      plan.status = 'failed';
      plan.error = error.message;
      plan.failedAt = new Date().toISOString();
      await this.savePlan(plan);
      throw error;
    }
  }

  /**
   * Analyze the complexity of a request
   */
  async analyzeComplexity(request) {
    const complexityFactors = {
      length: request.length > 1000 ? 'high' : request.length > 300 ? 'medium' : 'low',
      domains: this.identifyDomains(request),
      dependencies: this.estimateDependencies(request),
      integration: this.assessIntegrationNeeds(request),
      scale: this.assessScale(request)
    };

    const score = Object.values(complexityFactors).reduce((acc, factor) => {
      if (factor === 'high') return acc + 3;
      if (factor === 'medium') return acc + 2;
      return acc + 1;
    }, 0);

    // Add bonus points for multiple domains
    const domainBonus = complexityFactors.domains.length > 1 ? complexityFactors.domains.length : 0;
    const finalScore = score + domainBonus;

    return {
      score: finalScore,
      level: finalScore > 7 ? 'high' : finalScore > 4 ? 'medium' : 'low',
      factors: complexityFactors
    };
  }

  /**
   * Decompose a request into executable tasks
   */
  async decomposeTask(request, complexity) {
    const baseTasks = [
      {
        id: 'analysis',
        type: 'analysis',
        description: 'Analyze requirements and create implementation plan',
        priority: 'high',
        estimatedTime: '15-30 min',
        agentType: 'Plan'
      }
    ];

    // Add domain-specific tasks based on complexity
    if (complexity.factors.domains.includes('frontend')) {
      baseTasks.push({
        id: 'frontend',
        type: 'frontend',
        description: 'Implement frontend components and UI',
        priority: 'high',
        estimatedTime: '2-4 hours',
        agentType: 'senior-frontend-developer',
        dependencies: ['analysis']
      });
    }

    if (complexity.factors.domains.includes('backend')) {
      baseTasks.push({
        id: 'backend',
        type: 'backend',
        description: 'Implement backend APIs and business logic',
        priority: 'high',
        estimatedTime: '2-4 hours',
        agentType: 'senior-backend-developer',
        dependencies: ['analysis']
      });
    }

    if (complexity.factors.domains.includes('database')) {
      baseTasks.push({
        id: 'database',
        type: 'database',
        description: 'Design and implement database schema',
        priority: 'high',
        estimatedTime: '1-2 hours',
        agentType: 'database-specialist',
        dependencies: ['analysis']
      });
    }

    if (complexity.factors.domains.includes('devops')) {
      baseTasks.push({
        id: 'devops',
        type: 'devops',
        description: 'Setup deployment and CI/CD pipeline',
        priority: 'medium',
        estimatedTime: '1-2 hours',
        agentType: 'cloud-devops-specialist',
        dependencies: ['frontend', 'backend']
      });
    }

    // Add integration task if multiple domains
    if (complexity.factors.domains.length > 1) {
      baseTasks.push({
        id: 'integration',
        type: 'integration',
        description: 'Integrate all components and test complete system',
        priority: 'high',
        estimatedTime: '1-2 hours',
        agentType: 'general-purpose',
        dependencies: complexity.factors.domains
      });
    }

    return baseTasks;
  }

  /**
   * Select appropriate agents for each task
   */
  async selectAgents(tasks) {
    const assignments = [];

    for (const task of tasks) {
      assignments.push({
        taskId: task.id,
        agentType: task.agentType,
        task: task,
        estimatedDuration: task.estimatedTime
      });
    }

    return assignments;
  }

  /**
   * Calculate task dependencies
   */
  calculateDependencies(tasks) {
    const dependencies = new Map();

    for (const task of tasks) {
      dependencies.set(task.id, task.dependencies || []);
    }

    return dependencies;
  }

  /**
   * Build execution queue based on dependencies
   */
  buildExecutionQueue(plan) {
    const queue = [];
    const completed = new Set();
    const tasks = new Map(plan.tasks.map(t => [t.id, t]));

    // Continue until all tasks are scheduled
    while (completed.size < plan.tasks.length) {
      const currentBatch = [];

      // Find tasks whose dependencies are satisfied
      for (const [taskId, task] of tasks) {
        if (completed.has(taskId)) continue;

        const dependencies = plan.dependencies.get(taskId) || [];
        if (dependencies.every(dep => completed.has(dep))) {
          currentBatch.push(task);
        }
      }

      if (currentBatch.length === 0) {
        throw new Error('Circular dependency detected or missing dependencies');
      }

      queue.push(currentBatch);
      currentBatch.forEach(task => completed.add(task.id));
    }

    return queue;
  }

  /**
   * Launch an agent for a specific task
   */
  async launchAgentForTask(task, plan, todoId, contextFile) {
    const agentConfig = {
      subagent_type: task.agentType,
      description: task.description,
      prompt: this.generateAgentPrompt(task, plan, todoId, contextFile),
      run_in_background: true
    };

    // This would use the Task tool - for now, simulate the launch
    console.log(`Launching ${task.agentType} for task: ${task.description}`);

    return {
      taskId: task.id,
      agentType: task.agentType,
      status: 'launched',
      launchedAt: new Date().toISOString()
    };
  }

  /**
   * Generate prompt for agent
   */
  generateAgentPrompt(task, plan, todoId, contextFile) {
    return `
Task: ${task.description}
Plan ID: ${plan.id}
Todo List: ${todoId}
Shared Context: ${contextFile}

You are part of a multi-agent workflow. Please:
1. Read the shared context from ${contextFile}
2. Update your task status in the todo list ${todoId}
3. Complete your assigned task: ${task.description}
4. Update the shared context with your results
5. Mark your task as completed in the todo list

Coordinate with other agents through the shared context and todo list.
    `.trim();
  }

  /**
   * Monitor execution of all agents
   */
  async monitorExecution(planId, agentPromises) {
    const results = new Map();

    for (const promise of agentPromises) {
      try {
        const result = await promise;
        if (result.status === 'fulfilled') {
          results.set(result.value.taskId, result.value);
        }
      } catch (error) {
        console.error(`Agent execution failed:`, error);
      }
    }

    return results;
  }

  /**
   * Identify domains involved in the request
   */
  identifyDomains(request) {
    const domains = [];
    const lowerRequest = request.toLowerCase();

    if (lowerRequest.match(/frontend|ui|react|vue|angular|component|interface/)) {
      domains.push('frontend');
    }
    if (lowerRequest.match(/backend|api|server|endpoint|service/)) {
      domains.push('backend');
    }
    if (lowerRequest.match(/database|schema|sql|nosql|migration/)) {
      domains.push('database');
    }
    if (lowerRequest.match(/deploy|ci\/cd|docker|kubernetes|infrastructure/)) {
      domains.push('devops');
    }

    return domains;
  }

  /**
   * Estimate dependencies in the request
   */
  estimateDependencies(request) {
    const dependencyCount = (request.match(/integrat|connect|depend|require|link/gi) || []).length;
    return dependencyCount > 5 ? 'high' : dependencyCount > 2 ? 'medium' : 'low';
  }

  /**
   * Assess integration needs
   */
  assessIntegrationNeeds(request) {
    return request.toLowerCase().includes('integrat') ? 'high' : 'low';
  }

  /**
   * Assess scale of the request
   */
  assessScale(request) {
    const scale = request.length;
    return scale > 2000 ? 'large' : scale > 500 ? 'medium' : 'small';
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    for (const dir of Object.values(this.plansDir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load active plans from disk
   */
  async loadActivePlans() {
    try {
      const files = await fs.readdir(this.plansDir.active);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const planData = await fs.readFile(path.join(this.plansDir.active, file), 'utf8');
          const plan = JSON.parse(planData);
          this.activePlans.set(plan.id, plan);
        }
      }
    } catch (error) {
      console.log('No active plans found');
    }
  }

  /**
   * Initialize agent pool
   */
  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async initializeAgentPool() {
    // This would load available agents from the agent system
    const availableAgents = [
      'senior-frontend-developer',
      'senior-backend-developer',
      'cloud-devops-specialist',
      'database-specialist',
      'general-purpose',
      'Plan',
      'Explore'
    ];

    for (const agentType of availableAgents) {
      this.agentPool.set(agentType, {
        type: agentType,
        status: 'available',
        currentTasks: []
      });
    }
  }

  /**
   * Save plan to disk
   */
  async savePlan(plan) {
    const planFile = path.join(this.plansDir.active, `${plan.id}.json`);
    await fs.writeFile(planFile, JSON.stringify(plan, null, 2));
    this.activePlans.set(plan.id, plan);
  }

  /**
   * Load plan from disk
   */
  async loadPlan(planId) {
    if (this.activePlans.has(planId)) {
      return this.activePlans.get(planId);
    }

    try {
      const planFile = path.join(this.plansDir.active, `${planId}.json`);
      const planData = await fs.readFile(planFile, 'utf8');
      const plan = JSON.parse(planData);
      this.activePlans.set(planId, plan);
      return plan;
    } catch (error) {
      return null;
    }
  }

  /**
   * Move plan to completed
   */
  async moveToCompleted(plan) {
    const activeFile = path.join(this.plansDir.active, `${plan.id}.json`);
    const completedFile = path.join(this.plansDir.completed, `${plan.id}.json`);

    await fs.rename(activeFile, completedFile);
    this.activePlans.delete(plan.id);
  }

  /**
   * Create shared context file
   */
  async createSharedContext(plan, contextFile) {
    const context = {
      planId: plan.id,
      request: plan.request,
      tasks: plan.tasks,
      agents: plan.agents,
      createdAt: plan.createdAt,
      updatedAt: new Date().toISOString(),
      status: 'active',
      data: {}
    };

    await fs.writeFile(contextFile, JSON.stringify(context, null, 2));
  }

  /**
   * Create coordination todo list
   */
  async createCoordinationTodo(plan) {
    const todoData = {
      planId: plan.id,
      tasks: plan.tasks.map(task => ({
        id: task.id,
        content: task.description,
        status: 'pending',
        assignedTo: task.agentType,
        dependencies: task.dependencies || [],
        priority: task.priority,
        estimatedTime: task.estimatedTime
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const todoFile = path.join(process.env.HOME, '.claude/todos', `${plan.id}.json`);
    await fs.writeFile(todoFile, JSON.stringify(todoData, null, 2));

    return plan.id;
  }
}

module.exports = { OrchestrationEngine };