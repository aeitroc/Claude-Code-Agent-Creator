#!/usr/bin/env node

/**
 * Project Need Detection System
 * Analyzes project structure and detects current/future development needs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.analysis = {
      technologies: {},
      patterns: {},
      needs: [],
      complexity: 0,
      trajectory: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing project structure...');
    
    // 1. Technology Stack Detection
    await this.detectTechnologies();
    
    // 2. Code Pattern Analysis
    await this.analyzeCodePatterns();
    
    // 3. Complexity Assessment
    await this.assessComplexity();
    
    // 4. Trajectory Analysis
    await this.analyzeTrajectory();
    
    // 5. Need Generation
    await this.generateNeeds();
    
    return this.analysis;
  }

  async detectTechnologies() {
    const techDetectors = {
      'javascript': ['package.json', '*.js', '*.jsx', '*.mjs'],
      'typescript': ['tsconfig.json', '*.ts', '*.tsx', 'package.json'],
      'react': ['src/App.*', 'package.json'],
      'vue': ['vue.config.js', '*.vue', 'package.json'],
      'angular': ['angular.json', 'package.json'],
      'node': ['package.json', 'server.js', 'app.js'],
      'python': ['requirements.txt', 'setup.py', '*.py', 'pyproject.toml'],
      'django': ['manage.py', 'settings.py'],
      'flask': ['app.py', 'wsgi.py'],
      'java': ['pom.xml', 'build.gradle', '*.java'],
      'spring': ['application.properties', 'spring-boot-starter'],
      'go': ['go.mod', '*.go'],
      'rust': ['Cargo.toml', '*.rs'],
      'docker': ['Dockerfile', 'docker-compose.yml'],
      'kubernetes': ['*.yaml', '*.yml', 'k8s/'],
      'database': ['*.sql', 'migrations/', 'seeds/'],
      'testing': ['*.test.*', '*spec*', '__tests__/', 'cypress/', 'jest.config.*'],
      'cicd': ['.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile', '.travis.yml']
    };

    for (const [tech, patterns] of Object.entries(techDetectors)) {
      const detected = await this.checkPatterns(patterns);
      if (detected.length > 0) {
        this.analysis.technologies[tech] = detected;
      }
    }
  }

  async checkPatterns(patterns) {
    const matches = [];
    
    for (const pattern of patterns) {
      try {
        const cmd = pattern.includes('*') 
          ? `find "${this.projectPath}" -name "${pattern}" | head -5`
          : `find "${this.projectPath}" -name "${pattern}" 2>/dev/null`;
        
        const result = execSync(cmd, { encoding: 'utf8', cwd: this.projectPath });
        if (result.trim()) {
          matches.push(...result.trim().split('\n').filter(f => f));
        }
      } catch (error) {
        // File not found or permission denied
      }
    }
    
    return matches;
  }

  async analyzeCodePatterns() {
    const patterns = {
      'microservices': ['docker-compose.yml', 'kubernetes/', 'grpc/', 'proto/'],
      'monolith': ['src/', 'lib/', 'models/', 'views/', 'controllers/'],
      'api-heavy': ['api/', 'routes/', 'controllers/', 'endpoints/'],
      'database-heavy': ['models/', 'schemas/', 'migrations/', 'seeds/'],
      'frontend-heavy': ['src/components/', 'src/pages/', 'public/', 'assets/'],
      'backend-heavy': ['server.js', 'app.js', 'lib/', 'services/'],
      'testing-missing': ['src/', 'lib/', 'app.js'],
      'documentation-missing': ['README.md'],
      'security-concerns': ['auth/', 'password', 'token', 'jwt'],
      'performance-concerns': ['cache', 'optimize', 'perf', 'benchmark']
    };

    for (const [pattern, files] of Object.entries(patterns)) {
      const detected = await this.checkPatterns(files);
      if (detected.length > 0) {
        this.analysis.patterns[pattern] = detected.length;
      }
    }
  }

  async assessComplexity() {
    let complexity = 0;
    
    // File count complexity
    try {
      const fileCount = execSync(`find "${this.projectPath}" -type f | wc -l`, { encoding: 'utf8' });
      complexity += Math.min(parseInt(fileCount.trim()) / 100, 5);
    } catch (error) {}

    // Technology complexity
    complexity += Object.keys(this.analysis.technologies).length * 0.5;

    // Pattern complexity
    complexity += Object.keys(this.analysis.patterns).length * 0.3;

    this.analysis.complexity = Math.round(complexity * 10) / 10;
  }

  async analyzeTrajectory() {
    try {
      // Git analysis for development trajectory
      const recentCommits = execSync('git log --oneline -10 --since="30 days ago"', 
        { encoding: 'utf8', cwd: this.projectPath });
      
      const commitMessages = recentCommits.trim().split('\n');
      
      // Analyze commit patterns
      const trajectory = {
        activity: commitMessages.length,
        patterns: this.analyzeCommitPatterns(commitMessages),
        velocity: this.calculateVelocity(commitMessages)
      };
      
      this.analysis.trajectory = trajectory;
    } catch (error) {
      // Not a git repo or git not available
      this.analysis.trajectory = { activity: 0, patterns: [], velocity: 0 };
    }
  }

  analyzeCommitPatterns(commits) {
    const patterns = {
      'feature-development': 0,
      'bug-fixes': 0,
      'refactoring': 0,
      'documentation': 0,
      'testing': 0,
      'dependencies': 0
    };

    commits.forEach(commit => {
      const message = commit.toLowerCase();
      if (message.includes('fix') || message.includes('bug')) patterns['bug-fixes']++;
      else if (message.includes('refactor') || message.includes('clean')) patterns['refactoring']++;
      else if (message.includes('doc') || message.includes('readme')) patterns['documentation']++;
      else if (message.includes('test') || message.includes('spec')) patterns['testing']++;
      else if (message.includes('update') || message.includes('upgrade')) patterns['dependencies']++;
      else patterns['feature-development']++;
    });

    return patterns;
  }

  calculateVelocity(commits) {
    // Simple velocity calculation based on commit frequency
    return commits.length / 30; // commits per day
  }

  async generateNeeds() {
    const needs = [];

    // Technology-specific needs
    if (this.analysis.technologies.react || this.analysis.technologies.vue) {
      needs.push({
        type: 'frontend-specialist',
        priority: 'high',
        reason: 'Frontend framework detected',
        skills: ['React/Vue', 'TypeScript', 'CSS', 'Testing']
      });
    }

    if (this.analysis.technologies.node || this.analysis.technologies.python) {
      needs.push({
        type: 'backend-engineer',
        priority: 'high',
        reason: 'Backend framework detected',
        skills: ['API Design', 'Database', 'Security', 'Performance']
      });
    }

    if (this.analysis.technologies.docker || this.analysis.technologies.kubernetes) {
      needs.push({
        type: 'devops-engineer',
        priority: 'medium',
        reason: 'Container/infrastructure as code detected',
        skills: ['Docker', 'CI/CD', 'Infrastructure', 'Monitoring']
      });
    }

    // Pattern-based needs
    if (this.analysis.patterns['microservices']) {
      needs.push({
        type: 'microservices-architect',
        priority: 'high',
        reason: 'Microservices architecture detected',
        skills: ['Service Design', 'API Gateway', 'Service Mesh', 'Distributed Systems']
      });
    }

    if (this.analysis.patterns['testing-missing'] && !this.analysis.technologies.testing) {
      needs.push({
        type: 'testing-expert',
        priority: 'high',
        reason: 'Testing coverage gaps detected',
        skills: ['Unit Testing', 'Integration Testing', 'TDD', 'Test Automation']
      });
    }

    if (this.analysis.patterns['documentation-missing']) {
      needs.push({
        type: 'documentation-writer',
        priority: 'medium',
        reason: 'Documentation gaps detected',
        skills: ['Technical Writing', 'API Documentation', 'User Guides']
      });
    }

    // Complexity-based needs
    if (this.analysis.complexity > 3) {
      needs.push({
        type: 'architecture-reviewer',
        priority: 'medium',
        reason: 'High project complexity detected',
        skills: ['System Architecture', 'Code Review', 'Best Practices']
      });
    }

    // Trajectory-based needs
    if (this.analysis.trajectory.activity > 20) {
      needs.push({
        type: 'code-reviewer',
        priority: 'medium',
        reason: 'High development activity detected',
        skills: ['Code Review', 'Quality Assurance', 'Standards Enforcement']
      });
    }

    // Security needs
    if (this.analysis.patterns['security-concerns']) {
      needs.push({
        type: 'security-specialist',
        priority: 'high',
        reason: 'Security-related code patterns detected',
        skills: ['Security Audits', 'Vulnerability Assessment', 'Secure Coding']
      });
    }

    // Sort by priority
    needs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.analysis.needs = needs;
  }

  generateAgentRecommendations() {
    const recommendations = [];

    this.analysis.needs.forEach(need => {
      const agentConfig = this.generateAgentConfig(need);
      if (agentConfig) {
        recommendations.push(agentConfig);
      }
    });

    return recommendations;
  }

  generateAgentConfig(need) {
    const agentTemplates = {
      'frontend-specialist': {
        name: 'frontend-architect',
        focus: 'React/Vue development',
        tools: ['React', 'TypeScript', 'CSS', 'Testing', 'Build Tools']
      },
      'backend-engineer': {
        name: 'backend-developer',
        focus: 'API and server development',
        tools: ['Node.js', 'Database', 'API Design', 'Security']
      },
      'testing-expert': {
        name: 'qa-specialist',
        focus: 'Testing strategy and automation',
        tools: ['Jest', 'Cypress', 'Testing Libraries', 'CI/CD']
      },
      'security-specialist': {
        name: 'security-auditor',
        focus: 'Security analysis and implementation',
        tools: ['Security Scanners', 'Auth Systems', 'Encryption', 'Best Practices']
      },
      'devops-engineer': {
        name: 'devops-automation',
        focus: 'Infrastructure and deployment',
        tools: ['Docker', 'CI/CD', 'Cloud Platforms', 'Monitoring']
      }
    };

    return agentTemplates[need.type] || null;
  }
}

module.exports = { ProjectAnalyzer };
