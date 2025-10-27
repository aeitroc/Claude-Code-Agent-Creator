#!/usr/bin/env node

/**
 * Subagent Template System
 * Provides templates for creating specialized agents based on project needs
 */

class AgentTemplates {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Frontend Specialists
    this.templates.set('frontend-architect', {
      name: 'frontend-architect',
      description: 'React/Vue/Angular specialist with deep expertise in modern frontend development, component architecture, and user experience implementation',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'React/Vue/Angular development',
        'TypeScript implementation',
        'Component architecture design',
        'State management (Redux, Vuex, NgRx)',
        'CSS/Styling solutions',
        'Frontend testing (Jest, React Testing Library)',
        'Build optimization and bundling',
        'Performance optimization',
        'Progressive Web Apps',
        'Frontend security best practices'
      ],
      focusAreas: [
        'Component design and implementation',
        'Frontend architecture',
        'User interface development',
        'Client-side performance',
        'Frontend testing strategies',
        'Build and deployment pipelines'
      ]
    });

    // Backend Specialists
    this.templates.set('backend-engineer', {
      name: 'backend-engineer',
      description: 'API and server development specialist with expertise in scalable backend systems, database design, and security implementation',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'API design (REST, GraphQL, gRPC)',
        'Database design and optimization',
        'Authentication and authorization',
        'Server security',
        'Performance optimization',
        'Microservices architecture',
        'Caching strategies',
        'Logging and monitoring',
        'Error handling and resilience',
        'Backend testing strategies'
      ],
      focusAreas: [
        'API development and documentation',
        'Database schema design',
        'Security implementation',
        'Server performance optimization',
        'Microservice communication',
        'Backend testing and validation'
      ]
    });

    // Testing Specialists
    this.templates.set('testing-expert', {
      name: 'testing-expert',
      description: 'Quality assurance specialist focused on comprehensive testing strategies, test automation, and quality metrics',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Unit testing strategies',
        'Integration testing',
        'End-to-end testing',
        'Performance testing',
        'Security testing',
        'Test automation frameworks',
        'Test-driven development (TDD)',
        'Behavior-driven development (BDD)',
        'Test reporting and metrics',
        'Continuous integration testing'
      ],
      focusAreas: [
        'Test strategy design',
        'Test automation setup',
        'Quality assurance processes',
        'Test coverage optimization',
        'Performance testing implementation',
        'Security testing procedures'
      ]
    });

    // Security Specialists
    this.templates.set('security-specialist', {
      name: 'security-specialist',
      description: 'Security-focused agent specializing in vulnerability assessment, secure coding practices, and compliance implementation',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Security audits and assessments',
        'Vulnerability scanning and analysis',
        'Secure coding practices',
        'Authentication and authorization design',
        'Encryption implementation',
        'Security testing',
        'Compliance management (GDPR, SOC2, etc.)',
        'Security documentation',
        'Incident response planning',
        'Security monitoring and logging'
      ],
      focusAreas: [
        'Security vulnerability identification',
        'Secure implementation review',
        'Compliance verification',
        'Security testing execution',
        'Security documentation',
        'Best practices enforcement'
      ]
    });

    // DevOps Specialists
    this.templates.set('devops-engineer', {
      name: 'devops-engineer',
      description: 'Infrastructure and deployment specialist focusing on CI/CD, containerization, and cloud-native architecture',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'CI/CD pipeline design and implementation',
        'Docker containerization',
        'Kubernetes orchestration',
        'Infrastructure as Code (Terraform, CloudFormation)',
        'Cloud platform management (AWS, GCP, Azure)',
        'Monitoring and logging',
        'Automated deployment strategies',
        'Configuration management',
        'Performance monitoring',
        'Backup and disaster recovery'
      ],
      focusAreas: [
        'CI/CD pipeline optimization',
        'Infrastructure automation',
        'Container orchestration',
        'Cloud resource management',
        'Monitoring implementation',
        'Deployment strategy design'
      ]
    });

    // Database Specialists
    this.templates.set('database-architect', {
      name: 'database-architect',
      description: 'Database design and optimization specialist with expertise in schema design, performance tuning, and data modeling',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Database schema design',
        'SQL and NoSQL optimization',
        'Data modeling',
        'Migration strategy',
        'Performance tuning',
        'Backup and recovery strategies',
        'Data security and privacy',
        'Database scaling',
        'Query optimization',
        'Data integrity enforcement'
      ],
      focusAreas: [
        'Database schema optimization',
        'Query performance tuning',
        'Data migration planning',
        'Backup strategy design',
        'Security implementation',
        'Scaling architecture'
      ]
    });

    // Performance Specialists
    this.templates.set('performance-optimizer', {
      name: 'performance-optimizer',
      description: 'Performance optimization specialist focusing on application speed, resource utilization, and user experience enhancement',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Application performance profiling',
        'Frontend optimization techniques',
        'Backend performance tuning',
        'Database query optimization',
        'Caching strategies',
        'Load balancing optimization',
        'Resource utilization analysis',
        'Performance monitoring setup',
        'Bottleneck identification',
        'Optimization implementation'
      ],
      focusAreas: [
        'Performance analysis',
        'Optimization strategy design',
        'Monitoring implementation',
        'Bottleneck resolution',
        'Resource optimization',
        'User experience enhancement'
      ]
    });

    // Documentation Specialists
    this.templates.set('documentation-writer', {
      name: 'documentation-writer',
      description: 'Technical documentation specialist focused on creating comprehensive, user-friendly documentation and guides',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Technical writing',
        'API documentation',
        'User guide creation',
        'Tutorial development',
        'Documentation architecture',
        'Documentation tools (Docusaurus, GitBook, etc.)',
        'Content organization',
        'Documentation maintenance',
        'User experience design',
        'Localization planning'
      ],
      focusAreas: [
        'Technical documentation creation',
        'API documentation maintenance',
        'User guide development',
        'Tutorial creation',
        'Documentation optimization',
        'Content strategy planning'
      ]
    });

    // Integration Specialists
    this.templates.set('integration-specialist', {
      name: 'integration-specialist',
      description: 'Third-party integration specialist focusing on API connections, service integrations, and data synchronization',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Third-party API integration',
        'Webhook implementation',
        'Data synchronization',
        'Service integration patterns',
        'API client development',
        'Authentication integration',
        'Error handling in integrations',
        'Rate limiting management',
        'Integration testing',
        'Monitoring integrations'
      ],
      focusAreas: [
        'API integration development',
        'Service connection implementation',
        'Data synchronization setup',
        'Integration testing',
        'Error handling optimization',
        'Monitoring implementation'
      ]
    });

    // Code Review Specialists
    this.templates.set('code-reviewer', {
      name: 'code-reviewer',
      description: 'Code quality specialist focused on code reviews, best practices enforcement, and maintaining coding standards',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'MultiEdit', 'Execute', 'WebSearch', 'FetchUrl', 'TodoWrite'],
      capabilities: [
        'Code review processes',
        'Best practices enforcement',
        'Coding standards maintenance',
        'Code quality analysis',
        'Refactoring recommendations',
        'Design pattern identification',
        'Code smell detection',
        'Technical debt assessment',
        'Security code review',
        'Performance code review'
      ],
      focusAreas: [
        'Code quality assessment',
        'Best practices implementation',
        'Standards enforcement',
        'Technical debt identification',
        'Security review',
        'Performance review'
      ]
    });
  }

  getTemplate(agentType) {
    return this.templates.get(agentType);
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  createAgent(agentType, customizations = {}) {
    const template = this.getTemplate(agentType);
    if (!template) {
      throw new Error(`Template not found for agent type: ${agentType}`);
    }

    return {
      ...template,
      ...customizations,
      id: this.generateAgentId(agentType),
      createdAt: new Date().toISOString(),
      status: 'active'
    };
  }

  generateAgentId(agentType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${agentType}-${timestamp}-${random}`;
  }

  generateAgentConfig(agent, projectPath) {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      tools: agent.tools,
      capabilities: agent.capabilities,
      focusAreas: agent.focusAreas,
      projectPath: projectPath,
      config: {
        workDirectory: `${projectPath}/.claude/agents/${agent.name}`,
        logDirectory: `${projectPath}/.claude/logs/${agent.name}`,
        status: 'initialized'
      }
    };
  }

  createSpecializedAgent(projectNeeds, projectPath) {
    const agentType = this.determineAgentType(projectNeeds);
    const customizations = this.applyCustomizations(projectNeeds);
    
    const agent = this.createAgent(agentType, customizations);
    return this.generateAgentConfig(agent, projectPath);
  }

  determineAgentType(projectNeeds) {
    const needMapping = {
      'frontend-development': 'frontend-architect',
      'backend-development': 'backend-engineer',
      'testing-required': 'testing-expert',
      'security-concerns': 'security-specialist',
      'deployment-needs': 'devops-engineer',
      'database-complexity': 'database-architect',
      'performance-issues': 'performance-optimizer',
      'documentation-gaps': 'documentation-writer',
      'integration-required': 'integration-specialist',
      'code-quality': 'code-reviewer'
    };

    for (const [need, agentType] of Object.entries(needMapping)) {
      if (projectNeeds.includes(need)) {
        return agentType;
      }
    }

    return 'frontend-architect'; // Default fallback
  }

  applyCustomizations(projectNeeds) {
    const customizations = {};

    if (projectNeeds.includes('typescript-required')) {
      customizations.capabilities = [...(customizations.capabilities || []), 'TypeScript expertise'];
    }

    if (projectNeeds.includes('react-specific')) {
      customizations.focusAreas = [...(customizations.focusAreas || []), 'React-specific optimization'];
    }

    if (projectNeeds.includes('high-security')) {
      customizations.priority = 'high';
      customizations.tools = [...(customizations.tools || []), 'Security scanning tools'];
    }

    return customizations;
  }
}

module.exports = { AgentTemplates };
