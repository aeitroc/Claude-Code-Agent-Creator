#!/usr/bin/env node

/**
 * Plugin-Aware Orchestration Engine for Claude
 * Enhanced orchestration engine that discovers and uses plugin agents from /Users/besi/.glm
 */

const fs = require('fs').promises;
const path = require('path');

class PluginAwareOrchestrationEngine {
  constructor() {
    // Claude's directories
    this.plansDir = path.join(process.env.HOME, '.claude/plans');
    this.contextDir = path.join(process.env.HOME, '.claude/context');
    this.todosDir = path.join(process.env.HOME, '.claude/todos');
    
    // Plugin discovery path
    this.pluginsDir = path.join(process.env.HOME, '.glm/plugins/marketplaces');
    
    this.activePlans = new Map();
    this.agentPool = new Map();
    this.executionHistory = [];
    this.discoveredAgents = null;
    this.agentDiscovery = null;
  }

  /**
   * Initialize the orchestration engine with plugin support
   */
  async initialize(forceRefresh = false) {
    try {
      await this.ensureDirectories();
      await this.loadActivePlans();
      
      // Load plugin discovery
      const PluginAgentDiscovery = require('./plugin-agent-discovery');
      this.agentDiscovery = new PluginAgentDiscovery();
      this.discoveredAgents = await this.agentDiscovery.discoverAgents(forceRefresh);
      
      await this.initializeAgentPool();
      
      console.log('✅ Plugin-aware orchestration engine initialized');
      console.log(`📊 Available agents: ${this.getTotalAgentCount()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize orchestration engine:', error);
      throw error;
    }
  }

  /**
   * Create and execute a new orchestration plan with plugin agents
   */
  async createPlan(request, options = {}) {
    const planId = this.generateId();
    const complexity = await this.analyzeComplexity(request);
    
    const plan = {
      id: planId,
      request: request,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      complexity: complexity,
      tasks: [],
      agents: [],
      dependencies: new Map(),
      context: {},
      results: {},
      options: {
        ...options,
        usePluginAgents: true,
        preferredModels: options.preferredModels || {}
      }
    };

    // Analyze request requirements
    const requirements = await this.analyzeRequirements(request);
    
    // Decompose request into tasks
    plan.tasks = await this.decomposeTask(request, complexity, requirements);

    // Select agents using plugin discovery
    plan.agents = await this.selectAgentsWithPlugins(plan.tasks, requirements);

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
   * Select agents using plugin discovery
   */
  async selectAgentsWithPlugins(tasks, requirements) {
    const selectedAgents = [];
    const usedAgentNames = new Set();

    for (const task of tasks) {
      const taskRequirements = {
        ...requirements,
        domains: task.domains || requirements.domains,
        capabilities: task.capabilities || requirements.capabilities,
        techStack: task.techStack || requirements.techStack
      };

      // Select agents for this task
      const agents = await this.agentDiscovery.selectAgentsForTask(
        task.description,
        taskRequirements
      );

      // Choose best agent for this task
      if (agents.length > 0) {
        const bestAgent = this.selectBestAgent(agents, task, taskRequirements);
        
        if (!usedAgentNames.has(bestAgent.name)) {
          selectedAgents.push({
            taskId: task.id,
            agent: bestAgent,
            reasoning: this.getAgentSelectionReasoning(bestAgent, task)
          });
          usedAgentNames.add(bestAgent.name);
        }
      }
    }

    return selectedAgents;
  }

  /**
   * Select the best agent for a task
   */
  selectBestAgent(agents, task, requirements) {
    // Score agents based on multiple factors
    let bestAgent = agents[0];
    let bestScore = 0;

    for (const agent of agents) {
      let score = 0;

      // Model preference (opus for architecture, sonnet for implementation)
      if (task.type === 'architecture' && agent.model === 'opus') {
        score += 3;
      } else if (task.type === 'implementation' && agent.model === 'sonnet') {
        score += 2;
      }

      // Capability match
      const capabilityMatches = task.capabilities?.filter(cap => 
        agent.capabilities.includes(cap)
      ).length || 0;
      score += capabilityMatches * 2;

      // Domain match
      if (task.domains?.some(domain => agent.domains.includes(domain))) {
        score += 2;
      }

      // Tech stack match
      if (requirements.techStack) {
        for (const [domain, tech] of Object.entries(requirements.techStack)) {
          if (agent.name.toLowerCase().includes(tech.toLowerCase())) {
            score += 3;
          }
        }
      }

      // Specialization match
      if (agent.name.includes('architect') && task.type === 'architecture') {
        score += 2;
      } else if (agent.name.includes('specialist') && task.type === 'implementation') {
        score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Get reasoning for agent selection
   */
  getAgentSelectionReasoning(agent, task) {
    const reasons = [];
    
    if (agent.model === 'opus' && task.type === 'architecture') {
      reasons.push('High-capability model for complex architectural decisions');
    }
    
    if (agent.domains.some(domain => task.domains?.includes(domain))) {
      reasons.push('Domain expertise matches task requirements');
    }
    
    const capabilityMatches = task.capabilities?.filter(cap => 
      agent.capabilities.includes(cap)
    );
    if (capabilityMatches?.length > 0) {
      reasons.push(`Has required capabilities: ${capabilityMatches.join(', ')}`);
    }
    
    return reasons.join('; ');
  }

  /**
   * Execute a plan with plugin agents
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
      console.log(`\n🚀 Executing plan: ${planId}`);
      console.log(`📋 Tasks: ${plan.tasks.length}`);
      console.log(`🤖 Agents: ${plan.agents.length}\n`);

      // Create shared context
      const contextFile = path.join(this.contextDir, `${planId}.json`);
      await this.createSharedContext(plan, contextFile);

      // Create coordination todo list
      const todoId = await this.createCoordinationTodo(plan);

      // Launch agents based on dependencies
      const executionQueue = this.buildExecutionQueue(plan);
      const agentPromises = [];

      for (let i = 0; i < executionQueue.length; i++) {
        const batch = executionQueue[i];
        console.log(`📍 Phase ${i + 1}: Executing ${batch.length} tasks`);
        
        // Show agents being used
        for (const task of batch) {
          const agentAssignment = plan.agents.find(a => a.taskId === task.id);
          if (agentAssignment) {
            console.log(`   → ${task.title}: ${agentAssignment.agent.name} (${agentAssignment.agent.model})`);
          }
        }

        const batchPromises = batch.map(async (task) => {
          return await this.launchAgentForTask(task, plan, todoId, contextFile);
        });

        // Wait for current batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        agentPromises.push(...batchResults);

        // Check for failures
        const failures = batchResults.filter(r => r.status === 'rejected');
        if (failures.length > 0 && !plan.options.continueOnFailure) {
          throw new Error(`Phase ${i + 1} failed: ${failures.length} tasks failed`);
        }
      }

      // Monitor execution and collect results
      const results = await this.monitorExecution(planId, agentPromises);

      // Complete the plan
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
      plan.results = results;

      // Move to completed
      await this.moveToCompleted(plan);

      console.log(`✅ Plan ${planId} completed successfully`);
      return plan;

    } catch (error) {
      plan.status = 'failed';
      plan.error = error.message;
      plan.failedAt = new Date().toISOString();
      await this.savePlan(plan);
      
      console.error(`❌ Plan ${planId} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Launch an agent for a specific task
   */
  async launchAgentForTask(task, plan, todoId, contextFile) {
    const agentAssignment = plan.agents.find(a => a.taskId === task.id);
    
    if (!agentAssignment) {
      throw new Error(`No agent assigned to task ${task.id}`);
    }

    const agent = agentAssignment.agent;
    
    // Prepare agent context
    const agentContext = {
      taskId: task.id,
      planId: plan.id,
      agent: agent,
      task: task,
      contextFile: contextFile,
      todoId: todoId
    };

    // Create agent-specific prompt
    const prompt = this.createAgentPrompt(task, agent, plan);

    // Launch agent (this would integrate with Claude's agent execution)
    console.log(`🤖 Launching ${agent.name} for task: ${task.title}`);
    
    // Execute agent using Claude's task tool
    const result = await this.executeClaudeAgent(agent, prompt, agentContext);
    
    // Update task status
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    
    return result;
  }

  /**
   * Execute agent using Claude's task system
   */
  async executeClaudeAgent(agent, prompt, context) {
    // This would integrate with Claude's actual agent execution system
    // For now, simulate the execution
    
    console.log(`   📝 Executing ${agent.name} (${agent.model})...`);
    
    // In a real implementation, this would call Claude with the specific agent
    // For example:
    // return await taskAgent({
    //   subagent_type: agent.name,
    //   model: agent.model,
    //   description: context.task.title,
    //   prompt: prompt
    // });
    
    // Simulate execution time
    const executionTime = agent.model === 'opus' ? 3000 : 1500;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Return mock result
    return {
      agent: agent.name,
      taskId: context.taskId,
      status: 'completed',
      output: `Task completed by ${agent.name}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create agent-specific prompt
   */
  createAgentPrompt(task, agent, plan) {
    const prompt = `
You are ${agent.name}, a specialized agent with the following capabilities:
${agent.capabilities.map(cap => `- ${cap}`).join('\n')}

Task: ${task.title}
Description: ${task.description}

Context:
${task.context || 'No additional context provided'}

Overall Plan: ${plan.request}

Requirements:
${task.requirements?.map(req => `- ${req}`).join('\n') || 'No specific requirements listed'}

Please complete this task following your specialized expertise. Focus on:
${agent.domains?.join(', ') || 'delivering high-quality results'}

Expected deliverables:
${task.deliverables?.map(del => `- ${del}`).join('\n') || 'Complete the task as described'}
    `.trim();
    
    return prompt;
  }

  /**
   * Analyze requirements from request
   */
  async analyzeRequirements(request) {
    const requirements = {
      domains: this.identifyDomains(request),
      capabilities: this.identifyCapabilities(request),
      techStack: this.identifyTechStack(request),
      complexity: await this.analyzeComplexity(request)
    };

    return requirements;
  }

  /**
   * Identify domains in request
   */
  identifyDomains(request) {
    const domains = [];
    const requestLower = request.toLowerCase();
    
    const domainKeywords = {
      'backend': ['api', 'backend', 'server', 'service', 'endpoint'],
      'frontend': ['frontend', 'ui', 'component', 'interface', 'user'],
      'database': ['database', 'data', 'schema', 'migration', 'query'],
      'security': ['security', 'auth', 'login', 'permission', 'access'],
      'infrastructure': ['deploy', 'cloud', 'docker', 'kubernetes', 'devops'],
      'testing': ['test', 'testing', 'validate', 'verify'],
      'performance': ['performance', 'optimize', 'scale', 'speed']
    };
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => requestLower.includes(keyword))) {
        domains.push(domain);
      }
    }
    
    return domains;
  }

  /**
   * Identify capabilities needed
   */
  identifyCapabilities(request) {
    const capabilities = [];
    const requestLower = request.toLowerCase();
    
    const capabilityMap = {
      'API design': ['api', 'endpoint', 'rest', 'graphql'],
      'Database design': ['database', 'schema', 'model'],
      'Security implementation': ['security', 'auth', 'encryption'],
      'UI components': ['ui', 'component', 'interface'],
      'Testing': ['test', 'testing', 'validate'],
      'Deployment': ['deploy', 'deployment', 'ci/cd']
    };
    
    for (const [capability, keywords] of Object.entries(capabilityMap)) {
      if (keywords.some(keyword => requestLower.includes(keyword))) {
        capabilities.push(capability);
      }
    }
    
    return capabilities;
  }

  /**
   * Identify tech stack
   */
  identifyTechStack(request) {
    const techStack = {};
    const requestLower = request.toLowerCase();
    
    const techPatterns = {
      'backend': ['fastapi', 'django', 'flask', 'express', 'nestjs', 'spring'],
      'frontend': ['react', 'vue', 'angular', 'nextjs', 'svelte'],
      'database': ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite'],
      'cloud': ['aws', 'azure', 'gcp', 'heroku', 'vercel']
    };
    
    for (const [domain, technologies] of Object.entries(techPatterns)) {
      for (const tech of technologies) {
        if (requestLower.includes(tech)) {
          techStack[domain] = tech;
          break;
        }
      }
    }
    
    return techStack;
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
      if (factor === 'high' || (Array.isArray(factor) && factor.length > 3)) return acc + 3;
      if (factor === 'medium' || (Array.isArray(factor) && factor.length > 1)) return acc + 2;
      return acc + 1;
    }, 0);

    return {
      score: Math.min(score / 10, 1.0), // Normalize to 0-1
      factors: complexityFactors
    };
  }

  /**
   * Decompose task into subtasks
   */
  async decomposeTask(request, complexity, requirements) {
    const tasks = [];
    
    // Based on domains identified
    if (requirements.domains.includes('backend')) {
      tasks.push({
        id: this.generateId(),
        title: 'Backend Development',
        description: 'Implement backend components',
        type: 'implementation',
        domains: ['backend'],
        capabilities: ['API design', 'Database design'],
        priority: 'high'
      });
    }
    
    if (requirements.domains.includes('frontend')) {
      tasks.push({
        id: this.generateId(),
        title: 'Frontend Development',
        description: 'Implement frontend components',
        type: 'implementation',
        domains: ['frontend'],
        capabilities: ['UI components'],
        priority: 'high'
      });
    }
    
    if (requirements.domains.includes('database')) {
      tasks.push({
        id: this.generateId(),
        title: 'Database Design',
        description: 'Design database schema',
        type: 'architecture',
        domains: ['database'],
        capabilities: ['Database design'],
        priority: 'high'
      });
    }
    
    if (requirements.domains.includes('security')) {
      tasks.push({
        id: this.generateId(),
        title: 'Security Implementation',
        description: 'Implement security measures',
        type: 'implementation',
        domains: ['security'],
        capabilities: ['Security implementation'],
        priority: 'high'
      });
    }
    
    return tasks.length > 0 ? tasks : [{
      id: this.generateId(),
      title: 'General Implementation',
      description: request,
      type: 'implementation',
      domains: ['general'],
      capabilities: [],
      priority: 'high'
    }];
  }

  /**
   * Calculate task dependencies
   */
  calculateDependencies(tasks) {
    const dependencies = new Map();
    
    // Simple dependency rules
    tasks.forEach(task => {
      const deps = [];
      
      if (task.type === 'implementation' && task.domains.includes('backend')) {
        const designTask = tasks.find(t => 
          t.type === 'architecture' && t.domains.includes('backend')
        );
        if (designTask) deps.push(designTask.id);
      }
      
      dependencies.set(task.id, deps);
    });
    
    return dependencies;
  }

  /**
   * Build execution queue based on dependencies
   */
  buildExecutionQueue(plan) {
    const queue = [];
    const processed = new Set();
    const inProgress = new Set();
    
    // Simple dependency resolution
    const processTask = (task) => {
      if (processed.has(task.id)) return;
      
      const deps = plan.dependencies.get(task.id) || [];
      for (const depId of deps) {
        const depTask = plan.tasks.find(t => t.id === depId);
        if (depTask && !processed.has(depTask.id)) {
          processTask(depTask);
        }
      }
      
      if (!inProgress.has(task.id)) {
        queue.push(task);
        inProgress.add(task.id);
      }
    };
    
    plan.tasks.forEach(processTask);
    
    // Group tasks that can run in parallel
    const batches = [];
    const batchMap = new Map();
    
    queue.forEach(task => {
      const batch = Math.max(...(plan.dependencies.get(task.id) || []).map(depId => 
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
   * Monitor execution
   */
  async monitorExecution(planId, agentPromises) {
    const results = await Promise.allSettled(agentPromises);
    
    return {
      planId: planId,
      totalTasks: results.length,
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      timestamp: new Date().toISOString()
    };
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
    await fs.mkdir(this.plansDir, { recursive: true });
    await fs.mkdir(this.contextDir, { recursive: true });
    await fs.mkdir(this.todosDir, { recursive: true });
  }

  async loadActivePlans() {
    // Implementation for loading active plans from plans directory
  }

  async initializeAgentPool() {
    // Initialize agent pool with discovered agents
    if (this.discoveredAgents) {
      for (const [category, agents] of this.discoveredAgents) {
        for (const agent of agents) {
          this.agentPool.set(agent.name, agent);
        }
      }
    }
  }

  async savePlan(plan) {
    const planPath = path.join(this.plansDir, 'active', `${plan.id}.json`);
    await fs.mkdir(path.dirname(planPath), { recursive: true });
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
  }

  async loadPlan(planId) {
    const planPath = path.join(this.plansDir, 'active', `${planId}.json`);
    try {
      const content = await fs.readFile(planPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async createSharedContext(plan, contextFile) {
    const context = {
      planId: plan.id,
      request: plan.request,
      agents: plan.agents,
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(contextFile, JSON.stringify(context, null, 2));
  }

  async createCoordinationTodo(plan) {
    // Create TodoWrite for coordination
    // This would integrate with Claude's TodoWrite system
    const todoId = plan.id;
    
    // In a real implementation, this would use TodoWrite tool
    // await TodoWrite({
    //   todos: plan.tasks.map(task => ({
    //     content: task.title,
    //     id: task.id,
    //     status: 'pending'
    //   }))
    // });
    
    return todoId;
  }

  async moveToCompleted(plan) {
    const activePath = path.join(this.plansDir, 'active', `${plan.id}.json`);
    const completedPath = path.join(this.plansDir, 'completed', `${plan.id}.json`);
    
    await fs.mkdir(path.dirname(completedPath), { recursive: true });
    await fs.rename(activePath, completedPath);
  }

  estimateDependencies(request) {
    const integrationKeywords = ['integrate', 'connect', 'combine', 'merge'];
    return integrationKeywords.some(keyword => request.toLowerCase().includes(keyword)) ? 'high' : 'low';
  }

  assessIntegrationNeeds(request) {
    const integrationKeywords = ['api', 'database', 'service', 'external'];
    const matches = integrationKeywords.filter(keyword => 
      request.toLowerCase().includes(keyword)
    ).length;
    
    return matches > 2 ? 'high' : matches > 0 ? 'medium' : 'low';
  }

  assessScale(request) {
    const scaleKeywords = ['large', 'scalable', 'enterprise', 'production'];
    return scaleKeywords.some(keyword => request.toLowerCase().includes(keyword)) ? 'high' : 'low';
  }
}

module.exports = PluginAwareOrchestrationEngine;
