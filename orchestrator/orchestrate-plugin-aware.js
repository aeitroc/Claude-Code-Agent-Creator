#!/usr/bin/env node

/**
 * Plugin-Aware Orchestration Runner for Claude
 * Entry point for orchestrating workflows with discovered plugin agents
 */

const PluginAwareOrchestrationEngine = require('./engine-plugin-aware');

class OrchestrateRunner {
  constructor() {
    this.engine = new PluginAwareOrchestrationEngine();
  }

  /**
   * Run orchestration with plugin agents
   */
  async run(request, options = {}) {
    console.log('🚀 Plugin-Aware Claude Orchestration');
    console.log('==================================\n');
    
    try {
      // Initialize the engine with plugin discovery
      console.log('🔍 Discovering plugin agents...');
      await this.engine.initialize();
      
      // Display discovered agents summary
      const agentCount = this.engine.getTotalAgentCount();
      console.log(`✅ Found ${agentCount} specialized agents\n`);
      
      // Create and execute plan
      console.log('📋 Creating orchestration plan...');
      const plan = await this.engine.createPlan(request, options);
      
      // Display plan summary
      console.log(`✅ Plan created: ${plan.id}`);
      console.log(`📊 Complexity: ${(plan.complexity.score * 100).toFixed(0)}%`);
      console.log(`🤖 Agents selected: ${plan.agents.length}\n`);
      
      // Show selected agents
      if (plan.agents.length > 0) {
        console.log('🎯 Selected Plugin Agents:');
        plan.agents.forEach((assignment, index) => {
          console.log(`   ${index + 1}. ${assignment.agent.name} (${assignment.agent.model})`);
          console.log(`      ${assignment.reasoning}`);
        });
        console.log('');
      }
      
      // The engine handles execution automatically
      console.log('⚡ Execution completed by orchestration engine');
      
      return plan;
      
    } catch (error) {
      console.error('❌ Orchestration failed:', error.message);
      throw error;
    }
  }
}

// Export for use in commands
module.exports = OrchestrateRunner;

// If run directly
if (require.main === module) {
  const runner = new OrchestrateRunner();
  const request = process.argv[2];
  
  if (!request) {
    console.log('Usage: node orchestrate-plugin-aware.js "your request here"');
    console.log('');
    console.log('Examples:');
    console.log('  node orchestrate-plugin-aware.js "Build a FastAPI backend with user authentication"');
    console.log('  node orchestrate-plugin-aware.js "Create a React dashboard with TypeScript"');
    console.log('  node orchestrate-plugin-aware.js "Design a database schema for e-commerce"');
    process.exit(1);
  }
  
  runner.run(request)
    .then(result => {
      console.log('\n✅ Orchestration completed successfully!');
      console.log(`Plan ID: ${result.id}`);
      console.log(`Status: ${result.status}`);
      if (result.results) {
        console.log(`Tasks: ${result.results.completed}/${result.results.total} completed`);
      }
    })
    .catch(error => {
      console.error('\n❌ Orchestration failed:', error.message);
      process.exit(1);
    });
}
