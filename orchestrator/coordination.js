#!/usr/bin/env node

/**
 * Agent Coordination System
 * Manages inter-agent communication, task coordination, and context synchronization
 */

const fs = require('fs').promises;
const path = require('path');

class AgentCoordinator {
  constructor(planId) {
    this.planId = planId;
    this.baseDir = path.join(process.env.HOME, '.claude');
    this.sharedContextFile = path.join(this.baseDir, 'context/shared', `${planId}.json`);
    this.todoFile = path.join(this.baseDir, 'todos', `${planId}.json`);
    this.coordinationLog = path.join(this.baseDir, 'orchestrator', `${planId}-coordination.log`);
  }

  /**
   * Initialize coordination for a plan
   */
  async initialize(plan) {
    try {
      await this.createSharedTasks(plan.tasks);
      await this.createSharedContext(plan);
      await this.log('info', 'Coordination initialized', { planId: this.planId });
    } catch (error) {
      await this.log('error', 'Failed to initialize coordination', { error: error.message });
      throw error;
    }
  }

  /**
   * Create shared task list for all agents
   */
  async createSharedTasks(tasks) {
    const todoData = {
      planId: this.planId,
      metadata: {
        totalTasks: tasks.length,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      tasks: tasks.map(task => ({
        id: task.id,
        content: task.description,
        status: 'pending',
        assignedTo: task.agentType,
        dependencies: task.dependencies || [],
        priority: task.priority,
        estimatedTime: task.estimatedTime,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        result: null,
        artifacts: [],
        notes: []
      })),
      globalStatus: {
        phase: 'initialization',
        completedTasks: 0,
        failedTasks: 0,
        activeTasks: 0
      }
    };

    await this.writeTodoFile(todoData);
    await this.log('info', 'Created shared task list', { taskCount: tasks.length });
  }

  /**
   * Create shared context for agents
   */
  async createSharedContext(plan) {
    const context = {
      planId: this.planId,
      request: plan.request,
      metadata: {
        createdAt: plan.createdAt,
        complexity: plan.complexity,
        agentCount: (plan.agents || []).length,
        lastUpdated: new Date().toISOString()
      },
      agents: (plan.agents || []).map(agent => ({
        taskId: agent.taskId,
        agentType: agent.agentType,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        heartbeat: null
      })),
      sharedData: {
        requirements: {},
        decisions: {},
        artifacts: {},
        dependencies: {},
        communications: []
      },
      workflow: {
        currentPhase: 'initialization',
        completedPhases: [],
        blockers: [],
        nextSteps: []
      }
    };

    await this.writeSharedContext(context);
    await this.log('info', 'Created shared context', { agentCount: (plan.agents || []).length });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status, updates = {}) {
    try {
      const todos = await this.readTodoFile();
      const task = todos.tasks.find(t => t.id === taskId);

      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Update task
      task.status = status;
      Object.assign(task, updates);

      // Add timestamps
      if (status === 'in_progress' && !task.startedAt) {
        task.startedAt = new Date().toISOString();
      }
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date().toISOString();
      }

      // Update global status
      todos.globalStatus = this.calculateGlobalStatus(todos.tasks);
      todos.metadata.lastUpdated = new Date().toISOString();

      await this.writeTodoFile(todos);
      await this.log('info', `Task ${taskId} status updated to ${status}`, { taskId, status, updates });

      // Check if this unblocks any dependent tasks
      if (status === 'completed') {
        await this.checkDependentTasks(taskId);
      }

    } catch (error) {
      await this.log('error', `Failed to update task status: ${taskId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentType, status, updates = {}) {
    try {
      const context = await this.readSharedContext();
      const agent = context.agents.find(a => a.agentType === agentType);

      if (!agent) {
        throw new Error(`Agent not found: ${agentType}`);
      }

      agent.status = status;
      Object.assign(agent, updates);
      agent.heartbeat = new Date().toISOString();

      context.metadata.lastUpdated = new Date().toISOString();

      await this.writeSharedContext(context);
      await this.log('info', `Agent ${agentType} status updated to ${status}`, { agentType, status, updates });

    } catch (error) {
      await this.log('error', `Failed to update agent status: ${agentType}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Add communication between agents
   */
  async addCommunication(from, to, message, type = 'info') {
    try {
      const context = await this.readSharedContext();

      const communication = {
        id: this.generateId(),
        from: from,
        to: to,
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        status: 'unread'
      };

      context.sharedData.communications.push(communication);
      context.metadata.lastUpdated = new Date().toISOString();

      await this.writeSharedContext(context);
      await this.log('info', `Communication added from ${from} to ${to}`, { from, to, type });

    } catch (error) {
      await this.log('error', 'Failed to add communication', { error: error.message });
      throw error;
    }
  }

  /**
   * Share data between agents
   */
  async shareData(agentType, dataType, data) {
    try {
      const context = await this.readSharedContext();

      if (!context.sharedData[dataType]) {
        context.sharedData[dataType] = {};
      }

      context.sharedData[dataType][agentType] = {
        data: data,
        timestamp: new Date().toISOString(),
        agentType: agentType
      };

      context.metadata.lastUpdated = new Date().toISOString();

      await this.writeSharedContext(context);
      await this.log('info', `Data shared by ${agentType}`, { agentType, dataType });

    } catch (error) {
      await this.log('error', `Failed to share data from ${agentType}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get tasks ready for execution (dependencies satisfied)
   */
  async getReadyTasks() {
    try {
      const todos = await this.readTodoFile();
      const readyTasks = [];

      for (const task of todos.tasks) {
        if (task.status === 'pending') {
          const dependenciesSatisfied = await this.checkDependencies(task, todos.tasks);
          if (dependenciesSatisfied) {
            readyTasks.push(task);
          }
        }
      }

      return readyTasks;

    } catch (error) {
      await this.log('error', 'Failed to get ready tasks', { error: error.message });
      return [];
    }
  }

  /**
   * Check if task dependencies are satisfied
   */
  async checkDependencies(task, allTasks) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Check and update dependent tasks when a task completes
   */
  async checkDependentTasks(completedTaskId) {
    try {
      const todos = await this.readTodoFile();
      const dependentTasks = [];

      for (const task of todos.tasks) {
        if (task.status === 'pending' &&
            task.dependencies &&
            task.dependencies.includes(completedTaskId)) {

          const dependenciesSatisfied = await this.checkDependencies(task, todos.tasks);
          if (dependenciesSatisfied) {
            dependentTasks.push(task);
          }
        }
      }

      if (dependentTasks.length > 0) {
        await this.log('info', `Tasks unblocked by completion of ${completedTaskId}`,
                      { unblockedTasks: dependentTasks.map(t => t.id) });
      }

    } catch (error) {
      await this.log('error', 'Failed to check dependent tasks', { error: error.message });
    }
  }

  /**
   * Calculate global status from task statuses
   */
  calculateGlobalStatus(tasks) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const active = tasks.filter(t => t.status === 'in_progress').length;

    let phase = 'initialization';
    if (completed === tasks.length) {
      phase = 'completed';
    } else if (failed > 0) {
      phase = 'error_recovery';
    } else if (active > 0) {
      phase = 'execution';
    } else if (completed > 0) {
      phase = 'continuing';
    }

    return {
      phase,
      completedTasks: completed,
      failedTasks: failed,
      activeTasks: active,
      totalTasks: tasks.length,
      progress: (completed / tasks.length) * 100
    };
  }

  /**
   * Get coordination status
   */
  async getStatus() {
    try {
      const todos = await this.readTodoFile();
      const context = await this.readSharedContext();

      return {
        planId: this.planId,
        globalStatus: todos.globalStatus,
        taskSummary: {
          total: todos.tasks.length,
          completed: todos.globalStatus.completedTasks,
          failed: todos.globalStatus.failedTasks,
          active: todos.globalStatus.activeTasks,
          pending: todos.tasks.filter(t => t.status === 'pending').length
        },
        agentSummary: {
          total: context.agents.length,
          active: context.agents.filter(a => a.status === 'in_progress').length,
          completed: context.agents.filter(a => a.status === 'completed').length
        },
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      await this.log('error', 'Failed to get coordination status', { error: error.message });
      return null;
    }
  }

  /**
   * File I/O operations
   */
  async readTodoFile() {
    try {
      const data = await fs.readFile(this.todoFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to read todo file: ${error.message}`);
    }
  }

  async writeTodoFile(data) {
    try {
      await fs.writeFile(this.todoFile, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to write todo file: ${error.message}`);
    }
  }

  async readSharedContext() {
    try {
      const data = await fs.readFile(this.sharedContextFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to read shared context: ${error.message}`);
    }
  }

  async writeSharedContext(data) {
    try {
      await fs.writeFile(this.sharedContextFile, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to write shared context: ${error.message}`);
    }
  }

  /**
   * Logging
   */
  async log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      planId: this.planId,
      metadata: metadata
    };

    try {
      await fs.appendFile(this.coordinationLog, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to coordination log:', error.message);
    }

    // Also log to console for immediate feedback
    console.log(`[${level.toUpperCase()}] [${this.planId}] ${message}`, metadata);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Cleanup coordination files
   */
  async cleanup() {
    try {
      await fs.unlink(this.todoFile);
      await fs.unlink(this.sharedContextFile);
      await this.log('info', 'Coordination cleanup completed');
    } catch (error) {
      await this.log('error', 'Failed to cleanup coordination files', { error: error.message });
    }
  }
}

module.exports = { AgentCoordinator };