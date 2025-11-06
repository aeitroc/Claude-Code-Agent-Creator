#!/usr/bin/env node

/**
 * Plugin-Aware CLI for Claude Orchestration System
 * Command-line interface with plugin agent discovery and management
 */

const PluginAwareOrchestrationEngine = require('./engine-plugin-aware');
const PluginAwareWorkflowManager = require('./workflow-plugin-aware');
const PluginAgentDiscovery = require('./plugin-agent-discovery');

class PluginAwareCLI {
  constructor() {
    this.engine = new PluginAwareOrchestrationEngine();
    this.workflowManager = new PluginAwareWorkflowManager();
    this.agentDiscovery = new PluginAgentDiscovery();
    this.commands = new Map();
    this.initializeCommands();
  }

  /**
   * Initialize available commands
   */
  initializeCommands() {
    this.commands.set('execute', this.executeCommand.bind(this));
    this.commands.set('workflow', this.workflowCommand.bind(this));
    this.commands.set('agents', this.agentsCommand.bind(this));
    this.commands.set('templates', this.templatesCommand.bind(this));
    this.commands.set('status', this.statusCommand.bind(this));
    this.commands.set('help', this.helpCommand.bind(this));
  }

  /**
   * Run the CLI
   */
  async run(args) {
    const [command, ...commandArgs] = args;
    
    if (!command) {
      this.showUsage();
      return;
    }
    
    const handler = this.commands.get(command);
    if (!handler) {
      console.error(`❌ Unknown command: ${command}`);
      this.showUsage();
      return;
    }
    
    try {
      await handler(commandArgs);
    } catch (error) {
      console.error(`❌ Error executing command:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Execute a plan with plugin agents
   */
  async executeCommand(args) {
    const [request, ...options] = args;
    
    if (!request) {
      console.error('❌ Please provide a request to execute');
      console.log('Usage: ./cli.js execute "your request here" [options]');
      return;
    }
    
    console.log('🚀 Initializing plugin-aware orchestration engine...');
    await this.engine.initialize();
    
    console.log('\n📋 Creating execution plan...');
    const planOptions = this.parseOptions(options);
    const plan = await this.engine.createPlan(request, planOptions);
    
    console.log(`✅ Plan created: ${plan.id}`);
    console.log(`📊 Complexity: ${(plan.complexity.score * 100).toFixed(0)}%`);
    console.log(`🤖 Agents selected: ${plan.agents.length}`);
    
    // Show selected agents
    if (plan.agents.length > 0) {
      console.log('\n🎯 Selected Agents:');
      plan.agents.forEach(assignment => {
        console.log(`   - ${assignment.agent.name} (${assignment.agent.model})`);
        console.log(`     ${assignment.reasoning}`);
      });
    }
    
    console.log('\n⚡ Executing plan...');
    const result = await this.engine.executePlan(plan.id);
    
    if (result.status === 'completed') {
      console.log('\n✅ Execution completed successfully!');
      console.log(`📊 Results: ${result.results.completed}/${result.results.total} tasks completed`);
    } else {
      console.log('\n❌ Execution failed');
      console.log(`💥 ${result.results.failed} tasks failed`);
    }
  }

  /**
   * Execute a workflow template
   */
  async workflowCommand(args) {
    const [templateName, request, ...options] = args;
    
    if (!templateName) {
      console.log('📋 Available workflow templates:');
      const workflows = this.workflowManager.listWorkflows();
      workflows.forEach(w => {
        console.log(`   ${w.name}: ${w.displayName}`);
        console.log(`      ${w.description}`);
        console.log(`      Duration: ${w.duration}\n`);
      });
      return;
    }
    
    if (!request) {
      console.error('❌ Please provide a request for the workflow');
      console.log('Usage: ./cli.js workflow <template> "your request here" [options]');
      return;
    }
    
    console.log('🚀 Initializing plugin-aware workflow manager...');
    await this.workflowManager.initialize();
    
    const workflowOptions = this.parseOptions(options);
    const result = await this.workflowManager.executeWorkflow(
      templateName,
      request,
      workflowOptions
    );
    
    if (result.status === 'completed') {
      console.log('\n✅ Workflow completed successfully!');
      console.log(`📊 Phases completed: ${result.completedPhases.length}/${result.phases.length}`);
    } else {
      console.log('\n❌ Workflow failed');
      console.log(`💥 ${result.failedPhases.length} phases failed`);
    }
  }

  /**
   * List and manage agents
   */
  async agentsCommand(args) {
    const [subcommand, ...subArgs] = args;
    
    if (!subcommand || subcommand === 'list') {
      await this.listAgents();
    } else if (subcommand === 'discover') {
      await this.discoverAgents(subArgs.includes('--force'));
    } else if (subcommand === 'details') {
      await this.showAgentDetails(subArgs[0]);
    } else {
      console.error(`❌ Unknown agents subcommand: ${subcommand}`);
      console.log('Available subcommands: list, discover, details <agent-name>');
    }
  }

  /**
   * List all available agents
   */
  async listAgents() {
    console.log('🔍 Discovering plugin agents...');
    const agents = await this.agentDiscovery.discoverAgents();
    
    console.log('\n🤖 Available Plugin Agents:');
    console.log('============================\n');
    
    let total = 0;
    for (const [category, agentList] of agents) {
      if (agentList.length > 0) {
        console.log(`${category.toUpperCase()} (${agentList.length} agents):`);
        agentList.forEach(agent => {
          console.log(`   📋 ${agent.name} (${agent.model})`);
          console.log(`      ${agent.description}`);
          if (agent.capabilities.length > 0) {
            console.log(`      Capabilities: ${agent.capabilities.slice(0, 3).join(', ')}`);
          }
          console.log('');
        });
        total += agentList.length;
      }
    }
    
    console.log(`✅ Total: ${total} specialized agents available`);
  }

  /**
   * Force refresh agent discovery
   */
  async discoverAgents(force = false) {
    console.log(`🔄 ${force ? 'Force ' : ''}discovering agents...`);
    const agents = await this.agentDiscovery.discoverAgents(force);
    
    console.log(`✅ Discovered ${this.getTotalAgentCount(agents)} agents`);
    
    // Show discovery summary
    const summary = {};
    for (const [category, agentList] of agents) {
      summary[category] = agentList.length;
    }
    
    console.log('\n📊 Discovery Summary:');
    for (const [category, count] of Object.entries(summary)) {
      console.log(`   ${category}: ${count} agents`);
    }
  }

  /**
   * Show detailed agent information
   */
  async showAgentDetails(agentName) {
    if (!agentName) {
      console.error('❌ Please provide an agent name');
      console.log('Usage: ./cli.js agents details <agent-name>');
      return;
    }
    
    const agent = await this.agentDiscovery.getAgentByName(agentName);
    
    if (!agent) {
      console.error(`❌ Agent not found: ${agentName}`);
      return;
    }
    
    console.log(`\n🤖 Agent Details: ${agent.name}`);
    console.log('========================\n');
    console.log(`Name: ${agent.name}`);
    console.log(`Plugin: ${agent.plugin}`);
    console.log(`Model: ${agent.model}`);
    console.log(`Category: ${agent.category}`);
    console.log(`\nDescription: ${agent.description}`);
    
    if (agent.capabilities.length > 0) {
      console.log(`\nCapabilities:`);
      agent.capabilities.forEach(cap => console.log(`   - ${cap}`));
    }
    
    if (agent.domains.length > 0) {
      console.log(`\nDomains:`);
      agent.domains.forEach(domain => console.log(`   - ${domain}`));
    }
    
    if (agent.triggers.length > 0) {
      console.log(`\nUse When:`);
      agent.triggers.forEach(trigger => console.log(`   - ${trigger}`));
    }
    
    if (agent.filePath) {
      console.log(`\nSource: ${agent.filePath}`);
    }
  }

  /**
   * List workflow templates
   */
  async templatesCommand() {
    console.log('🚀 Initializing workflow manager...');
    await this.workflowManager.initialize();
    
    const templates = this.workflowManager.listWorkflows();
    
    console.log('\n📋 Available Workflow Templates:');
    console.log('===============================\n');
    
    templates.forEach(template => {
      console.log(`${template.name}`);
      console.log(`  Name: ${template.displayName}`);
      console.log(`  Description: ${template.description}`);
      console.log(`  Phases: ${template.phases}`);
      console.log(`  Estimated Duration: ${template.duration}\n`);
    });
    
    console.log(`✅ Total: ${templates.length} templates available`);
  }

  /**
   * Show status of active executions
   */
  async statusCommand(args) {
    const [id] = args;
    
    if (id) {
      // Show specific workflow status
      const workflow = this.workflowManager.getWorkflowStatus(id);
      if (workflow) {
        console.log(`\n📊 Workflow Status: ${id}`);
        console.log('=======================\n');
        console.log(`Template: ${workflow.template}`);
        console.log(`Status: ${workflow.status}`);
        console.log(`Progress: ${workflow.completedPhases.length}/${workflow.phases.length} phases`);
        
        if (workflow.currentPhase !== undefined) {
          console.log(`Current Phase: ${workflow.phases[workflow.currentPhase]?.name || 'N/A'}`);
        }
        
        console.log(`Created: ${workflow.createdAt}`);
        if (workflow.completedAt) {
          console.log(`Completed: ${workflow.completedAt}`);
        }
        if (workflow.failedAt) {
          console.log(`Failed: ${workflow.failedAt}`);
        }
      } else {
        console.error(`❌ Workflow not found: ${id}`);
      }
    } else {
      // List all active workflows
      console.log('📊 Active Workflows:');
      console.log('===================\n');
      
      const workflows = Array.from(this.workflowManager.activeWorkflows.values());
      
      if (workflows.length === 0) {
        console.log('No active workflows');
      } else {
        workflows.forEach(workflow => {
          console.log(`${workflow.id}: ${workflow.template} (${workflow.status})`);
          console.log(`  Progress: ${workflow.completedPhases.length}/${workflow.phases.length} phases`);
          console.log(`  Created: ${workflow.createdAt}\n`);
        });
      }
    }
  }

  /**
   * Show help information
   */
  async helpCommand() {
    console.log(`
🤖 Plugin-Aware Claude Orchestration CLI
====================================

Usage: ./cli.js <command> [arguments...]

Commands:

  execute <request> [options]
    Execute a request with plugin agents
    Example: ./cli.js execute "Create a FastAPI backend with user authentication"

  workflow <template> <request> [options]
    Execute a predefined workflow template
    Templates: web-app, api-development, frontend-component, database-migration
    Example: ./cli.js workflow web-app "Build an e-commerce site"

  agents [subcommand] [options]
    Manage and discover plugin agents
    Subcommands:
      list           - List all available agents
      discover [--force] - Refresh agent discovery
      details <name> - Show detailed agent information

  templates
    List available workflow templates

  status [workflow-id]
    Show status of active workflows or specific workflow

  help
    Show this help message

Options:
  --continue-on-failure    Continue execution even if some tasks fail
  --model-preference <model>  Prefer specific model (opus/sonnet)
  --tech-stack <stack>     Specify technology stack

Examples:
  ./cli.js execute "Build a React dashboard with TypeScript"
  ./cli.js workflow api-development "Create a REST API for user management"
  ./cli.js agents list
  ./cli.js agents details fastapi-pro
  ./cli.js templates
`);
  }

  /**
   * Show usage information
   */
  showUsage() {
    console.log('Usage: ./cli.js <command> [arguments...]');
    console.log('Run "./cli.js help" for available commands');
  }

  /**
   * Parse command options
   */
  parseOptions(options) {
    const parsed = {};
    
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      
      if (option === '--continue-on-failure') {
        parsed.continueOnFailure = true;
      } else if (option === '--model-preference' && i + 1 < options.length) {
        parsed.preferredModels = { default: options[i + 1] };
        i++;
      } else if (option === '--tech-stack' && i + 1 < options.length) {
        // Parse tech stack (e.g., "backend=fastapi,frontend=react")
        const stack = {};
        options[i + 1].split(',').forEach(item => {
          const [domain, tech] = item.split('=');
          if (domain && tech) {
            stack[domain] = tech;
          }
        });
        parsed.techStack = stack;
        i++;
      }
    }
    
    return parsed;
  }

  /**
   * Get total agent count
   */
  getTotalAgentCount(agents) {
    let total = 0;
    for (const agentList of agents.values()) {
      total += agentList.length;
    }
    return total;
  }
}

// Main execution
if (require.main === module) {
  const cli = new PluginAwareCLI();
  const args = process.argv.slice(2);
  
  cli.run(args)
    .catch(error => {
      console.error('❌ CLI Error:', error);
      process.exit(1);
    });
}

module.exports = PluginAwareCLI;
