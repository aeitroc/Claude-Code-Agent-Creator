#!/usr/bin/env node

/**
 * Plugin-Aware Workflow Manager
 * Enhanced workflow management with dynamic plugin agent integration
 */

const { OrchestrationEngine } = require('./engine');
const { AgentCoordinator } = require('./coordination');
const PluginAgentDiscovery = require('./plugin-agent-discovery');

class PluginAwareWorkflowManager {
  constructor() {
    this.engine = new OrchestrationEngine();
    this.coordinator = new AgentCoordinator();
    this.agentDiscovery = new PluginAgentDiscovery();
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.pluginAgents = null;
    this.initializeTemplates();
  }

  /**
   * Initialize workflow templates with plugin support
   */
  initializeTemplates() {
    // Web Application Development Template
    this.workflowTemplates.set('web-app', {
      name: 'Web Application Development',
      description: 'Complete web application development with frontend, backend, and deployment',
      phases: [
        {
          name: 'requirements-analysis',
          domains: ['architecture'],
          agentType: 'backend-architect',
          estimatedTime: '30-60 min',
          dependencies: [],
          pluginPriority: true
        },
        {
          name: 'database-design',
          domains: ['database'],
          agentType: 'database-architect',
          estimatedTime: '30-45 min',
          dependencies: ['requirements-analysis'],
          pluginPriority: true
        },
        {
          name: 'backend-development',
          domains: ['backend'],
          agentType: null, // Will be dynamically selected
          estimatedTime: '2-4 hours',
          dependencies: ['requirements-analysis', 'database-design'],
          pluginPriority: true,
          techStackSpecific: true
        },
        {
          name: 'frontend-development',
          domains: ['frontend'],
          agentType: null, // Will be dynamically selected
          estimatedTime: '2-4 hours',
          dependencies: ['requirements-analysis'],
          pluginPriority: true,
          techStackSpecific: true
        },
        {
          name: 'integration-testing',
          domains: ['testing'],
          agentType: 'test-automator',
          estimatedTime: '1-2 hours',
          dependencies: ['backend-development', 'frontend-development'],
          pluginPriority: true
        },
        {
          name: 'security-review',
          domains: ['security'],
          agentType: 'security-auditor',
          estimatedTime: '30-45 min',
          dependencies: ['backend-development', 'frontend-development'],
          pluginPriority: true
        },
        {
          name: 'deployment-setup',
          domains: ['infrastructure'],
          agentType: 'deployment-engineer',
          estimatedTime: '1-2 hours',
          dependencies: ['integration-testing'],
          pluginPriority: true
        }
      ],
      estimatedDuration: '6-10 hours'
    });

    // API Development Template
    this.workflowTemplates.set('api-development', {
      name: 'RESTful API Development',
      description: 'Complete API development with documentation and testing',
      phases: [
        {
          name: 'api-design',
          domains: ['backend', 'architecture'],
          agentType: 'backend-architect',
          estimatedTime: '30-60 min',
          dependencies: [],
          pluginPriority: true
        },
        {
          name: 'database-schema',
          domains: ['database'],
          agentType: 'database-architect',
          estimatedTime: '30-45 min',
          dependencies: ['api-design'],
          pluginPriority: true
        },
        {
          name: 'endpoint-implementation',
          domains: ['backend'],
          agentType: null, // Tech stack specific
          estimatedTime: '2-3 hours',
          dependencies: ['api-design', 'database-schema'],
          pluginPriority: true,
          techStackSpecific: true
        },
        {
          name: 'authentication-authorization',
          domains: ['security'],
          agentType: null, // Could be auth-implementation-patterns
          estimatedTime: '1-2 hours',
          dependencies: ['endpoint-implementation'],
          pluginPriority: true
        },
        {
          name: 'testing',
          domains: ['testing'],
          agentType: 'test-automator',
          estimatedTime: '1-2 hours',
          dependencies: ['endpoint-implementation'],
          pluginPriority: true
        },
        {
          name: 'documentation',
          domains: ['backend'],
          agentType: null, // Could use general agent
          estimatedTime: '30-60 min',
          dependencies: ['endpoint-implementation'],
          pluginPriority: false
        }
      ],
      estimatedDuration: '5-8 hours'
    });

    // Frontend Component Template
    this.workflowTemplates.set('frontend-component', {
      name: 'React/Vue Component Development',
      description: 'Complete component development with testing and styling',
      phases: [
        {
          name: 'component-design',
          domains: ['frontend', 'architecture'],
          agentType: 'frontend-developer',
          estimatedTime: '30-45 min',
          dependencies: [],
          pluginPriority: true
        },
        {
          name: 'component-implementation',
          domains: ['frontend'],
          agentType: null, // Framework specific
          estimatedTime: '1-2 hours',
          dependencies: ['component-design'],
          pluginPriority: true,
          techStackSpecific: true
        },
        {
          name: 'styling',
          domains: ['frontend'],
          agentType: 'ui-ux-designer',
          estimatedTime: '45-60 min',
          dependencies: ['component-implementation'],
          pluginPriority: true
        },
        {
          name: 'testing',
          domains: ['testing', 'frontend'],
          agentType: 'test-automator',
          estimatedTime: '30-45 min',
          dependencies: ['component-implementation'],
          pluginPriority: true
        },
        {
          name: 'accessibility-review',
          domains: ['frontend'],
          agentType: 'ui-visual-validator',
          estimatedTime: '15-30 min',
          dependencies: ['styling'],
          pluginPriority: true
        }
      ],
      estimatedDuration: '3-5 hours'
    });

    // Database Migration Template
    this.workflowTemplates.set('database-migration', {
      name: 'Database Schema Migration',
      description: 'Plan and execute database schema changes with zero downtime',
      phases: [
        {
          name: 'schema-analysis',
          domains: ['database'],
          agentType: 'database-architect',
          estimatedTime: '30-45 min',
          dependencies: [],
          pluginPriority: true
        },
        {
          name: 'migration-planning',
          domains: ['database'],
          agentType: 'database-admin',
          estimatedTime: '45-60 min',
          dependencies: ['schema-analysis'],
          pluginPriority: true
        },
        {
          name: 'migration-script',
          domains: ['database'],
          agentType: 'sql-pro',
          estimatedTime: '1-2 hours',
          dependencies: ['migration-planning'],
          pluginPriority: true
        },
        {
          name: 'testing',
          domains: ['testing', 'database'],
          agentType: 'test-automator',
          estimatedTime: '1-2 hours',
          dependencies: ['migration-script'],
          pluginPriority: true
        },
        {
          name: 'deployment',
          domains: ['database', 'infrastructure'],
          agentType: 'database-admin',
          estimatedTime: '30-60 min',
          dependencies: ['testing'],
          pluginPriority: true
        }
      ],
      estimatedDuration: '4-6 hours'
    });
  }

  /**
   * Initialize the workflow manager with plugin discovery
   */
  async initialize(forceRefresh = false) {
    try {
      // Discover plugin agents
      this.pluginAgents = await this.agentDiscovery.discoverAgents(forceRefresh);
      
      // Initialize engine and coordinator
      await this.engine.initialize();
      await this.coordinator.initialize();
      
      console.log('✅ Plugin-aware workflow manager initialized');
      console.log(`📊 Available templates: ${this.workflowTemplates.size}`);
      console.log(`🤖 Available agents: ${this.getTotalAgentCount()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize workflow manager:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow template with plugin agents
   */
  async executeWorkflow(templateName, request, options = {}) {
    const template = this.workflowTemplates.get(templateName);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateName}`);
    }

    // Analyze request requirements
    const requirements = await this.analyzeRequirements(request);
    
    console.log(`\n🎯 Executing workflow: ${template.name}`);
    console.log(`📋 Phases: ${template.phases.length}`);
    console.log(`⏱️  Estimated duration: ${template.estimatedDuration}\n`);

    // Create workflow execution plan
    const workflowId = this.generateId();
    const workflow = {
      id: workflowId,
      template: templateName,
      request: request,
      status: 'running',
      createdAt: new Date().toISOString(),
      phases: [],
      currentPhase: 0,
      completedPhases: [],
      failedPhases: [],
      options: options,
      requirements: requirements
    };

    // Process each phase
    for (let i = 0; i < template.phases.length; i++) {
      const phaseTemplate = template.phases[i];
      workflow.currentPhase = i;
      
      console.log(`\n📍 Phase ${i + 1}/${template.phases.length}: ${phaseTemplate.name}`);
      
      try {
        // Select agent for this phase
        const selectedAgent = await this.selectAgentForPhase(
          phaseTemplate,
          requirements,
          request
        );
        
        if (!selectedAgent) {
          throw new Error(`No suitable agent found for phase: ${phaseTemplate.name}`);
        }
        
        console.log(`   → Agent: ${selectedAgent.name} (${selectedAgent.model})`);
        
        // Execute phase
        const phaseResult = await this.executePhase(
          phaseTemplate,
          selectedAgent,
          request,
          workflow,
          requirements
        );
        
        // Mark phase as completed
        const phase = {
          ...phaseTemplate,
          id: this.generateId(),
          agent: selectedAgent,
          result: phaseResult,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };
        
        workflow.phases.push(phase);
        workflow.completedPhases.push(phase.id);
        
        console.log(`   ✅ Completed in ${phaseResult.duration || 'N/A'}`);
        
      } catch (error) {
        console.error(`   ❌ Phase failed: ${error.message}`);
        
        const phase = {
          ...phaseTemplate,
          id: this.generateId(),
          error: error.message,
          startedAt: new Date().toISOString(),
          failedAt: new Date().toISOString()
        };
        
        workflow.phases.push(phase);
        workflow.failedPhases.push(phase.id);
        
        if (!options.continueOnFailure) {
          workflow.status = 'failed';
          workflow.failedAt = new Date().toISOString();
          break;
        }
      }
    }

    // Complete workflow
    if (workflow.status === 'running') {
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
    }

    // Save workflow
    this.activeWorkflows.set(workflowId, workflow);
    
    console.log(`\n${workflow.status === 'completed' ? '✅' : '❌'} Workflow ${workflowId} ${workflow.status}`);
    
    return workflow;
  }

  /**
   * Select the best agent for a workflow phase
   */
  async selectAgentForPhase(phase, requirements, request) {
    // If phase has a specific agent type and it's not null
    if (phase.agentType) {
      const agent = await this.agentDiscovery.getAgentByName(phase.agentType);
      if (agent) {
        return agent;
      }
    }

    // If phase needs tech stack specific agent
    if (phase.techStackSpecific && requirements.techStack) {
      // Look for tech-specific agents
      for (const [domain, tech] of Object.entries(requirements.techStack)) {
        if (phase.domains.includes(domain)) {
          const techAgents = await this.agentDiscovery.selectAgentsForTask(
            request,
            {
              domains: [domain],
              techStack: { [domain]: tech }
            }
          );
          
          if (techAgents.length > 0) {
            return techAgents[0];
          }
        }
      }
    }

    // Select agent based on domains
    const domainAgents = await this.agentDiscovery.selectAgentsForTask(
      request,
      {
        domains: phase.domains,
        capabilities: requirements.capabilities,
        techStack: requirements.techStack
      }
    );

    if (domainAgents.length > 0) {
      // Prefer plugin agents if phase has pluginPriority
      if (phase.pluginPriority) {
        return domainAgents[0];
      }
    }

    // Fallback to general agent
    const generalAgent = {
      name: 'general-purpose',
      model: 'sonnet',
      description: 'General purpose agent for completing tasks',
      capabilities: ['Task execution', 'Problem solving'],
      domains: phase.domains,
      plugin: 'default'
    };

    return generalAgent;
  }

  /**
   * Execute a single workflow phase
   */
  async executePhase(phase, agent, request, workflow, requirements) {
    const startTime = Date.now();
    
    // Create phase-specific context
    const phaseContext = {
      phase: phase.name,
      workflow: workflow.id,
      agent: agent,
      domains: phase.domains,
      requirements: requirements,
      previousPhases: workflow.completedPhases.map(id => 
        workflow.phases.find(p => p.id === id)
      )
    };

    // Create phase prompt
    const prompt = this.createPhasePrompt(phase, agent, request, phaseContext);
    
    // Execute agent (integrate with your agent execution system)
    console.log(`   📝 Executing ${phase.name}...`);
    
    const result = await this.executeAgent(agent, prompt, phaseContext);
    
    const duration = Date.now() - startTime;
    
    return {
      ...result,
      duration: this.formatDuration(duration),
      agent: agent.name
    };
  }

  /**
   * Create phase-specific prompt
   */
  createPhasePrompt(phase, agent, request, context) {
    const prompt = `
You are ${agent.name}, a specialized agent with expertise in:
${agent.capabilities.map(cap => `- ${cap}`).join('\n')}

Workflow Phase: ${phase.name}
Overall Request: ${request}

Phase Description: ${this.getPhaseDescription(phase.name)}

Context:
- Workflow ID: ${context.workflow}
- Domains: ${context.domains.join(', ')}
- Previous Phases: ${context.previousPhases.length}

Requirements:
${this.getPhaseRequirements(phase.name, context)}

Please complete this phase focusing on:
${agent.domains?.join(', ') || phase.domains.join(', ')}

Expected Deliverables:
${this.getPhaseDeliverables(phase.name)}
    `.trim();
    
    return prompt;
  }

  /**
   * Get phase-specific description
   */
  getPhaseDescription(phaseName) {
    const descriptions = {
      'requirements-analysis': 'Analyze and define requirements for the project',
      'database-design': 'Design database schema and relationships',
      'backend-development': 'Implement backend logic and APIs',
      'frontend-development': 'Implement user interface and interactions',
      'integration-testing': 'Test integration between components',
      'security-review': 'Review and implement security measures',
      'deployment-setup': 'Configure deployment infrastructure',
      'api-design': 'Design API endpoints and data contracts',
      'database-schema': 'Create detailed database schema',
      'endpoint-implementation': 'Implement API endpoints',
      'authentication-authorization': 'Implement auth and authorization',
      'testing': 'Create and run tests',
      'documentation': 'Create comprehensive documentation',
      'component-design': 'Design component architecture',
      'component-implementation': 'Implement the component',
      'styling': 'Apply styles and visual design',
      'accessibility-review': 'Ensure accessibility compliance',
      'schema-analysis': 'Analyze current database schema',
      'migration-planning': 'Plan migration strategy',
      'migration-script': 'Write migration scripts',
      'deployment': 'Deploy changes to production'
    };
    
    return descriptions[phaseName] || 'Complete the phase tasks';
  }

  /**
   * Get phase-specific requirements
   */
  getPhaseRequirements(phaseName, context) {
    const requirements = [];
    
    if (context.previousPhases.length > 0) {
      requirements.push('Build upon work from previous phases');
    }
    
    if (context.domains.includes('security')) {
      requirements.push('Ensure security best practices');
    }
    
    if (context.domains.includes('testing')) {
      requirements.push('Include comprehensive testing');
    }
    
    return requirements.join('\n- ') || 'Follow best practices for this domain';
  }

  /**
   * Get phase-specific deliverables
   */
  getPhaseDeliverables(phaseName) {
    const deliverables = {
      'requirements-analysis': '- Requirements document\n- Technical specifications',
      'database-design': '- Database schema\n- Migration scripts\n- Entity relationships',
      'backend-development': '- Working backend code\n- API endpoints\n- Tests',
      'frontend-development': '- Working UI components\n- State management\n- User interactions',
      'integration-testing': '- Test suite\n- Test results\n- Bug reports',
      'security-review': '- Security assessment\n- Recommendations\n- Implemented measures',
      'deployment-setup': '- Deployment configuration\n- CI/CD pipeline\n- Documentation'
    };
    
    return deliverables[phaseName] || '- Completed phase deliverables';
  }

  /**
   * Execute agent (integrate with your agent execution system)
   */
  async executeAgent(agent, prompt, context) {
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'completed',
      output: `Phase completed by ${agent.name}`,
      timestamp: new Date().toISOString(),
      artifacts: []
    };
  }

  /**
   * Analyze requirements from request
   */
  async analyzeRequirements(request) {
    const agentDiscovery = new PluginAgentDiscovery();
    
    return {
      domains: agentDiscovery.identifyDomains(request),
      capabilities: agentDiscovery.identifyCapabilities(request),
      techStack: agentDiscovery.identifyTechStack(request),
      complexity: await this.analyzeComplexity(request)
    };
  }

  /**
   * Analyze complexity
   */
  async analyzeComplexity(request) {
    const factors = {
      length: request.length > 1000 ? 'high' : request.length > 300 ? 'medium' : 'low',
      domains: this.identifyDomains(request),
      integration: this.assessIntegrationNeeds(request)
    };
    
    const score = Object.values(factors).reduce((acc, factor) => {
      if (factor === 'high' || (Array.isArray(factor) && factor.length > 3)) return acc + 3;
      if (factor === 'medium' || (Array.isArray(factor) && factor.length > 1)) return acc + 2;
      return acc + 1;
    }, 0);
    
    return Math.min(score / 10, 1.0);
  }

  /**
   * List available workflows
   */
  listWorkflows() {
    const workflows = [];
    
    for (const [name, template] of this.workflowTemplates) {
      workflows.push({
        name: name,
        displayName: template.name,
        description: template.description,
        phases: template.phases.length,
        duration: template.estimatedDuration
      });
    }
    
    return workflows;
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Get total agent count
   */
  getTotalAgentCount() {
    let total = 0;
    if (this.pluginAgents) {
      for (const agents of this.pluginAgents.values()) {
        total += agents.length;
      }
    }
    return total;
  }

  // Helper methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  identifyDomains(request) {
    // Implementation copied from engine
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

  assessIntegrationNeeds(request) {
    const integrationKeywords = ['api', 'database', 'service', 'external'];
    const matches = integrationKeywords.filter(keyword => 
      request.toLowerCase().includes(keyword)
    ).length;
    
    return matches > 2 ? 'high' : matches > 0 ? 'medium' : 'low';
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = PluginAwareWorkflowManager;

// If run directly, show available workflows
if (require.main === module) {
  const manager = new PluginAwareWorkflowManager();
  
  manager.initialize()
    .then(() => {
      console.log('\n📋 Available Workflow Templates:');
      console.log('===============================\n');
      
      const workflows = manager.listWorkflows();
      workflows.forEach(workflow => {
        console.log(`${workflow.name}: ${workflow.displayName}`);
        console.log(`  Description: ${workflow.description}`);
        console.log(`  Phases: ${workflow.phases}`);
        console.log(`  Duration: ${workflow.duration}\n`);
      });
    })
    .catch(error => {
      console.error('Failed to initialize:', error);
      process.exit(1);
    });
}
