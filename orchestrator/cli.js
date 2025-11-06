#!/usr/bin/env node

/**
 * Orchestration CLI
 * Command-line interface for the orchestration system
 */

const { WorkflowManager } = require('./workflow');
const { OrchestrationEngine } = require('./engine');
const { AgentCoordinator } = require('./coordination');

class OrchestrationCLI {
  constructor() {
    this.workflowManager = new WorkflowManager();
    this.engine = new OrchestrationEngine();
  }

  /**
   * Main CLI handler
   */
  async run() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];

    try {
      switch (command) {
        case 'execute':
        case 'run':
          await this.executeWorkflow(args.slice(1));
          break;

        case 'status':
          await this.showStatus(args.slice(1));
          break;

        case 'list':
          await this.listWorkflows();
          break;

        case 'cancel':
          await this.cancelWorkflow(args.slice(1));
          break;

        case 'templates':
          await this.listTemplates();
          break;

        case 'test':
          await this.runTests();
          break;

        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;

        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(args) {
    if (args.length === 0) {
      console.error('❌ Please provide a request to execute');
      console.log('Usage: orchestrate execute "your request here"');
      return;
    }

    const request = args.join(' ');
    console.log(`🚀 Executing workflow for: "${request}"`);

    await this.engine.initialize();

    const result = await this.workflowManager.executeWorkflow(request, {
      autoStart: true
    });

    console.log('\n✅ Workflow completed successfully!');
    console.log(`📋 Workflow ID: ${result.workflowId}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`📊 Phases completed: ${result.phases ? result.phases.size : 0}`);

    // Show phase results
    if (result.phases && result.phases.size > 0) {
      console.log('\n📝 Phase Results:');
      for (const [phaseName, phaseResult] of result.phases) {
        console.log(`  ✅ ${phaseName} (${phaseResult.agentType})`);
      }
    }
  }

  /**
   * Show workflow status
   */
  async showStatus(args) {
    if (args.length === 0) {
      console.error('❌ Please provide a workflow ID');
      console.log('Usage: orchestrate status <workflow-id>');
      return;
    }

    const workflowId = args[0];

    try {
      const status = await this.workflowManager.getWorkflowStatus(workflowId);

      console.log(`📊 Workflow Status: ${workflowId}`);
      console.log(`🔄 Status: ${status.status}`);
      console.log(`⏱️  Duration: ${status.duration}ms`);
      console.log(`📋 Phases completed: ${status.phases.length}`);

      if (status.coordination) {
        console.log('\n🤝 Coordination Status:');
        console.log(`  Tasks: ${status.coordination.taskSummary.completed}/${status.coordination.taskSummary.total} completed`);
        console.log(`  Agents: ${status.coordination.agentSummary.completed}/${status.coordination.agentSummary.total} completed`);
      }

    } catch (error) {
      console.error(`❌ Failed to get status: ${error.message}`);
    }
  }

  /**
   * List active workflows
   */
  async listWorkflows() {
    const workflows = this.workflowManager.listActiveWorkflows();

    if (workflows.length === 0) {
      console.log('📭 No active workflows');
      return;
    }

    console.log('🔄 Active Workflows:');
    console.log('===================');

    for (const workflow of workflows) {
      console.log(`📋 ID: ${workflow.workflowId}`);
      console.log(`🏷️  Type: ${workflow.type}`);
      console.log(`🔄 Status: ${workflow.status}`);
      console.log(`⏱️  Started: ${workflow.startedAt}`);
      console.log(`📊 Phases: ${workflow.phaseCount}`);
      console.log(`📝 Template: ${workflow.templateName}`);
      console.log('---');
    }
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(args) {
    if (args.length === 0) {
      console.error('❌ Please provide a workflow ID');
      console.log('Usage: orchestrate cancel <workflow-id>');
      return;
    }

    const workflowId = args[0];

    try {
      const result = await this.workflowManager.cancelWorkflow(workflowId);
      console.log(`✅ Workflow ${workflowId} cancelled`);
      console.log(`⏰ Cancelled at: ${result.cancelledAt}`);
    } catch (error) {
      console.error(`❌ Failed to cancel workflow: ${error.message}`);
    }
  }

  /**
   * List available templates
   */
  async listTemplates() {
    const templates = this.workflowManager.getAvailableTemplates();

    console.log('📋 Available Workflow Templates:');
    console.log('===============================');

    for (const template of templates) {
      console.log(`🏷️  ${template.name} (${template.id})`);
      console.log(`📝 ${template.description}`);
      console.log(`⏱️  Estimated time: ${template.estimatedTotalTime}`);
      console.log(`📊 Phases: ${template.phaseCount}`);
      console.log('---');
    }
  }

  /**
   * Run tests
   */
  async runTests() {
    console.log('🧪 Running orchestration system tests...');

    const { OrchestrationTester } = require('./test');
    const tester = new OrchestrationTester();

    try {
      await tester.runAllTests();
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(`
🤖 Claude Code Orchestration CLI

Usage: orchestrate <command> [options]

Commands:
  execute <request>       Execute a workflow for the given request
  run <request>          Alias for execute

  status <workflow-id>   Show status of a specific workflow
  list                   List all active workflows
  cancel <workflow-id>   Cancel a running workflow

  templates              List available workflow templates
  test                   Run orchestration system tests

  help                   Show this help message

Examples:
  orchestrate execute "Build a React component with testing"
  orchestrate run "Create a REST API with Node.js"
  orchestrate status abc123-def456
  orchestrate list
  orchestrate templates
  orchestrate test

Workflow Templates:
  - web-app: Complete web application development
  - api-development: RESTful API development
  - frontend-component: React/Vue component development

For more information, see: /Users/besi/.claude/orchestrator/README.md
    `);
  }
}

/**
 * Main execution
 */
async function main() {
  const cli = new OrchestrationCLI();
  await cli.run();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI execution failed:', error);
    process.exit(1);
  });
}

module.exports = { OrchestrationCLI };