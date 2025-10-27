#!/usr/bin/env node

/**
 * Agent Manager CLI
 * Command-line interface for the intelligent agent management system
 */

const { AgentCreator } = require('./agent-creator');
const { PredictiveAnalyzer } = require('./predictive-analyzer');
const path = require('path');

class AgentManagerCLI {
  constructor() {
    this.commands = {
      'analyze': this.analyzeProject.bind(this),
      'create': this.createAgents.bind(this),
      'predict': this.predictNeeds.bind(this),
      'monitor': this.monitorAgents.bind(this),
      'team': this.createTeam.bind(this),
      'help': this.showHelp.bind(this)
    };
  }

  async run(args) {
    const command = args[2];
    
    if (!command || !this.commands[command]) {
      this.showHelp();
      return;
    }

    try {
      await this.commands[command](args.slice(3));
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async analyzeProject(args) {
    const projectPath = args[0] || process.cwd();
    
    console.log('🔍 Analyzing project:', projectPath);
    
    const { ProjectAnalyzer } = require('./project-analyzer');
    const analyzer = new ProjectAnalyzer(projectPath);
    
    const analysis = await analyzer.analyze();
    
    console.log('\n📊 Project Analysis Results:');
    console.log('=============================');
    
    console.log('\n🔧 Technologies Detected:');
    Object.entries(analysis.technologies).forEach(([tech, files]) => {
      console.log(`  • ${tech}: ${files.length} file(s)`);
    });
    
    console.log('\n🎯 Patterns Identified:');
    Object.entries(analysis.patterns).forEach(([pattern, count]) => {
      console.log(`  • ${pattern}: ${count} indicator(s)`);
    });
    
    console.log('\n📈 Complexity Score:', analysis.complexity);
    console.log('📅 Activity Level:', analysis.trajectory.activity, 'commits (30 days)');
    
    console.log('\n🚀 Immediate Agent Needs:');
    analysis.needs.forEach((need, index) => {
      console.log(`  ${index + 1}. ${need.type} (${need.priority})`);
      console.log(`     Reason: ${need.reason}`);
    });
    
    if (args.includes('--save')) {
      const fs = require('fs');
      const analysisDir = path.join(projectPath, '.claude');
      if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
      }
      const analysisFile = path.join(analysisDir, 'project-analysis.json');
      fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
      console.log(`\n💾 Analysis saved to: ${analysisFile}`);
    }
  }

  async createAgents(args) {
    const projectPath = args[0] || process.cwd();
    const options = this.parseOptions(args);
    
    console.log('🤖 Creating specialized agents for:', projectPath);
    
    const creator = new AgentCreator(projectPath);
    const result = await creator.createAgentTeam(options);
    
    console.log('\n✅ Agent Team Created Successfully!');
    console.log('===================================');
    
    console.log(`\n👥 Team Size: ${result.agents.length} agents`);
    console.log(`🎯 High Priority: ${result.coordination.highPriorityAgents} agents`);
    
    console.log('\n🤖 Agent Team Composition:');
    result.agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name} (${agent.priority})`);
      console.log(`     Focus: ${agent.scope}`);
      console.log(`     Reason: ${agent.reason}`);
      console.log(`     File: ${agent.file}`);
    });
    
    console.log('\n⚙️ Coordination Plan:');
    console.log(`  • Protocol: ${result.coordination.coordinationProtocol}`);
    console.log(`  • Communication: ${result.coordination.communicationChannels.join(', ')}`);
    
    if (args.includes('--start')) {
      console.log('\n🚀 Agents are now ready to begin parallel development tasks.');
    }
  }

  async predictNeeds(args) {
    const projectPath = args[0] || process.cwd();
    
    console.log('🔮 Predicting future project needs for:', projectPath);
    
    const predictor = new PredictiveAnalyzer(projectPath);
    const predictions = await predictor.analyzeFutureNeeds();
    
    console.log('\n🔮 Future Needs Predictions:');
    console.log('===========================');
    
    console.log('\n⚡ Short-term (1-2 weeks):');
    predictions.shortTerm.forEach((pred, index) => {
      console.log(`  ${index + 1}. ${pred.type} (${pred.urgency})`);
      console.log(`     ${pred.reason}`);
      console.log(`     Impact: ${pred.impact}`);
    });
    
    console.log('\n📅 Medium-term (1-3 months):');
    predictions.mediumTerm.forEach((pred, index) => {
      console.log(`  ${index + 1}. ${pred.type} (${pred.urgency})`);
      console.log(`     ${pred.reason}`);
      console.log(`     Impact: ${pred.impact}`);
    });
    
    console.log('\n🎯 Long-term (3+ months):');
    predictions.longTerm.forEach((pred, index) => {
      console.log(`  ${index + 1}. ${pred.type} (${pred.urgency})`);
      console.log(`     ${pred.reason}`);
      console.log(`     Impact: ${pred.impact}`);
    });
    
    if (args.includes('--detailed')) {
      console.log('\n📊 Technology Indicators:');
      Object.entries(predictor.indicators.technology).forEach(([indicator, value]) => {
        console.log(`  • ${indicator}:`, typeof value === 'object' ? JSON.stringify(value) : value);
      });
      
      console.log('\n📈 Complexity Indicators:');
      console.log(JSON.stringify(predictor.indicators.complexity, null, 2));
    }
  }

  async monitorAgents(args) {
    const projectPath = args[0] || process.cwd();
    
    console.log('📊 Monitoring agent performance for:', projectPath);
    
    const creator = new AgentCreator(projectPath);
    const performance = await creator.monitorAgentPerformance();
    
    console.log('\n📊 Agent Performance Report:');
    console.log('============================');
    
    Object.entries(performance).forEach(([agentId, perf]) => {
      console.log(`\n🤖 Agent: ${agentId}`);
      console.log(`  Tasks Completed: ${perf.tasksCompleted}`);
      console.log(`  Quality Score: ${perf.qualityScore}`);
      console.log(`  Collaboration Score: ${perf.collaborationScore}`);
      console.log(`  Efficiency: ${perf.efficiency}`);
      console.log(`  Last Active: ${perf.lastActive}`);
    });
    
    // Suggest adaptations
    const adaptations = await creator.adaptAgentAllocation();
    if (adaptations.length > 0) {
      console.log('\n🔄 Recommended Adaptations:');
      adaptations.forEach(adaptation => {
        console.log(`  • ${adaptation.agentId}: ${adaptation.action} (${adaptation.reason})`);
      });
    }
  }

  async createTeam(args) {
    const teamType = args[0] || 'auto';
    const projectPath = args[1] || process.cwd();
    const options = this.parseOptions(args);
    
    console.log(`👥 Creating ${teamType} team for:`, projectPath);
    
    const creator = new AgentCreator(projectPath);
    
    // Configure team based on type
    let teamOptions = { ...options };
    
    switch (teamType) {
      case 'startup':
        teamOptions = {
          ...teamOptions,
          maxAgents: 3,
          focus: ['frontend', 'backend', 'testing']
        };
        break;
      case 'enterprise':
        teamOptions = {
          ...teamOptions,
          maxAgents: 6,
          focus: ['frontend', 'backend', 'testing', 'security', 'devops', 'documentation']
        };
        break;
      case 'api-focused':
        teamOptions = {
          ...teamOptions,
          maxAgents: 4,
          focus: ['backend', 'testing', 'security', 'documentation']
        };
        break;
      case 'mobile':
        teamOptions = {
          ...teamOptions,
          maxAgents: 3,
          focus: ['frontend', 'backend', 'testing']
        };
        break;
      case 'auto':
        // Let the system decide based on project analysis
        break;
    }
    
    const result = await creator.createAgentTeam(teamOptions);
    
    console.log('\n✅ Team Created Successfully!');
    console.log(`Team Type: ${teamType}`);
    console.log(`Team Size: ${result.agents.length} agents`);
    
    console.log('\n👥 Team Members:');
    result.agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name} - ${agent.scope}`);
    });
    
    // Generate team workflow
    const workflowDir = path.join(projectPath, '.claude', 'workflows');
    const fs = require('fs');
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
    const workflowFile = path.join(workflowDir, 'team-workflow.md');
    this.generateTeamWorkflow(result, teamType, workflowFile);
    
    console.log(`\n📋 Team workflow saved to: ${workflowFile}`);
  }

  generateTeamWorkflow(result, teamType, workflowFile) {
    const fs = require('fs');
    const workflow = `# ${teamType.charAt(0).toUpperCase() + teamType.slice(1)} Team Workflow

**Created:** ${new Date().toISOString()}
**Team Size:** ${result.agents.length}

## Team Composition
${result.agents.map((agent, index) => `
${index + 1}. **${agent.name}** (${agent.priority})
   - Focus: ${agent.scope}
   - File: ${agent.file}
`).join('')}

## Agent Files
The following agent files have been created and can be used for parallel development:
${result.agents.map(agent => `- \`${agent.file}\``).join('\n')}

## Coordination Protocol
- Use TodoWrite for shared task management
- Coordinate between agents using the files above
- Each agent can work independently within their scope
- Cross-agent collaboration through shared documentation

## Getting Started
1. Each agent file can be used independently for parallel work
2. Agents coordinate through the shared project context
3. Use the team workflow document for coordination
4. Monitor progress through the workflow files
`;

    fs.writeFileSync(workflowFile, workflow, 'utf8');
  }

  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
        options[key] = value;
        if (value !== true) i++; // Skip next argument if it was a value
      }
    }
    
    return options;
  }

  showHelp() {
    console.log(`
🤖 Agent Manager CLI - Intelligent Subagent Creation System

USAGE:
  node agent-manager-cli.js <command> [options] [project-path]

COMMANDS:
  analyze [path]          Analyze project and detect current needs
  create [path]           Create specialized agents based on project analysis
  predict [path]          Predict future project needs
  monitor [path]          Monitor agent performance and suggest adaptations
  team <type> [path]      Create pre-configured team (startup|enterprise|api-focused|mobile|auto)
  help                    Show this help message

OPTIONS:
  --save                  Save analysis results to file
  --start                 Start agent workflows after creation
  --detailed              Show detailed analysis output
  --max-agents <n>        Limit maximum number of agents created
  --security-focus        Prioritize security-related agents
  --integration-focus     Prioritize integration specialists

EXAMPLES:
  # Analyze current project
  node agent-manager-cli.js analyze
  
  # Create agents for specific project
  node agent-manager-cli.js create /path/to/project --max-agents 3
  
  # Predict future needs with detailed output
  node agent-manager-cli.js predict --detailed
  
  # Create startup team
  node agent-manager-cli.js team startup /path/to/project
  
  # Create agents with security focus
  node agent-manager-cli.js create --security-focus --start

AGENT TYPES:
  • frontend-architect     React/Vue/Angular development specialist
  • backend-engineer       API and server development expert
  • testing-expert         Quality assurance and testing automation
  • security-specialist    Security audits and vulnerability assessment
  • devops-engineer        CI/CD and infrastructure automation
  • database-architect     Database design and optimization
  • performance-optimizer  Performance analysis and optimization
  • documentation-writer   Technical documentation specialist
  • integration-specialist Third-party integration expert
  • code-reviewer         Code quality and standards enforcement

FEATURES:
  ✅ Intelligent project need detection
  ✅ Predictive future needs analysis
  ✅ Dynamic agent creation and management
  ✅ Parallel workflow coordination
  ✅ Performance monitoring and optimization
  ✅ Team-based collaboration support
`);
  }
}

// CLI Entry Point
if (require.main === module) {
  const cli = new AgentManagerCLI();
  cli.run(process.argv);
}

module.exports = { AgentManagerCLI };
