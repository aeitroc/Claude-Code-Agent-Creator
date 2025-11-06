#!/usr/bin/env node

/**
 * Orchestration System Test
 * Test the complete orchestration system with sample workflows
 */

const { WorkflowManager } = require('./workflow');
const { OrchestrationEngine } = require('./engine');
const { AgentCoordinator } = require('./coordination');

class OrchestrationTester {
  constructor() {
    this.workflowManager = new WorkflowManager();
    this.testResults = [];
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Orchestration System Tests\n');

    try {
      await this.testOrchestrationEngine();
      await this.testAgentCoordinator();
      await this.testWorkflowManager();
      await this.testCompleteWorkflow();

      console.log('\n✅ All tests completed successfully!');
      this.printTestSummary();

    } catch (error) {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test orchestration engine
   */
  async testOrchestrationEngine() {
    console.log('📋 Testing Orchestration Engine...');

    try {
      const engine = new OrchestrationEngine();
      await engine.initialize();

      // Test complexity analysis
      const complexity = await engine.analyzeComplexity(
        'Build a complete web application with React frontend, Node.js backend, and PostgreSQL database'
      );

      this.assert(complexity.level === 'medium' || complexity.level === 'high', 'Complexity analysis should detect medium or high complexity');
      this.assert(complexity.factors.domains.includes('frontend'), 'Should detect frontend domain');
      this.assert(complexity.factors.domains.includes('backend'), 'Should detect backend domain');
      this.assert(complexity.factors.domains.includes('database'), 'Should detect database domain');

      // Test task decomposition
      const tasks = await engine.decomposeTask(
        'Build a web application',
        complexity
      );

      this.assert(tasks.length > 0, 'Should decompose request into tasks');
      this.assert(tasks.some(t => t.type === 'analysis'), 'Should include analysis task');

      // Test agent selection
      const agents = await engine.selectAgents(tasks);
      this.assert(agents.length === tasks.length, 'Should select agent for each task');

      this.recordTest('Orchestration Engine', '✅ Passed', {
        complexityLevel: complexity.level,
        taskCount: tasks.length,
        agentCount: agents.length
      });

      console.log('✅ Orchestration Engine tests passed\n');

    } catch (error) {
      this.recordTest('Orchestration Engine', '❌ Failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Test agent coordinator
   */
  async testAgentCoordinator() {
    console.log('🤝 Testing Agent Coordinator...');

    try {
      const coordinator = new AgentCoordinator('test-plan-123');

      // Test initialization
      const mockPlan = {
        id: 'test-plan-123',
        request: 'Test request',
        tasks: [
          {
            id: 'task1',
            description: 'Test task 1',
            agentType: 'senior-frontend-developer',
            priority: 'high',
            estimatedTime: '1 hour'
          },
          {
            id: 'task2',
            description: 'Test task 2',
            agentType: 'senior-backend-developer',
            priority: 'medium',
            estimatedTime: '2 hours',
            dependencies: ['task1']
          }
        ]
      };

      await coordinator.initialize(mockPlan);

      // Test task status updates
      await coordinator.updateTaskStatus('task1', 'in_progress', {
        startedAt: new Date().toISOString()
      });

      await coordinator.updateTaskStatus('task1', 'completed', {
        result: 'Task completed successfully',
        completedAt: new Date().toISOString()
      });

      // Test ready tasks detection
      const readyTasks = await coordinator.getReadyTasks();
      this.assert(readyTasks.length === 1, 'Should detect one ready task');
      this.assert(readyTasks[0].id === 'task2', 'Should detect task2 as ready');

      // Test agent status updates (only if agents exist in context)
      const context = await coordinator.readSharedContext();
      if (context.agents.length > 0) {
        await coordinator.updateAgentStatus(context.agents[0].agentType, 'completed', {
          completedAt: new Date().toISOString()
        });
      }

      // Test communication
      await coordinator.addCommunication(
        'senior-frontend-developer',
        'senior-backend-developer',
        'Frontend components are ready for integration',
        'info'
      );

      // Test data sharing
      await coordinator.shareData(
        'senior-frontend-developer',
        'components',
        { 'Header.js': 'React component code' }
      );

      // Test status
      const status = await coordinator.getStatus();
      this.assert(status.planId === 'test-plan-123', 'Status should return correct plan ID');
      this.assert(status.taskSummary.completed === 1, 'Should show 1 completed task');

      // Cleanup
      await coordinator.cleanup();

      this.recordTest('Agent Coordinator', '✅ Passed', {
        planId: 'test-plan-123',
        taskCount: mockPlan.tasks.length,
        readyTasksFound: readyTasks.length
      });

      console.log('✅ Agent Coordinator tests passed\n');

    } catch (error) {
      this.recordTest('Agent Coordinator', '❌ Failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Test workflow manager
   */
  async testWorkflowManager() {
    console.log('🔄 Testing Workflow Manager...');

    try {
      const manager = new WorkflowManager();

      // Test template availability
      const templates = manager.getAvailableTemplates();
      this.assert(templates.length > 0, 'Should have workflow templates');

      // Test workflow type selection
      const webAppType = manager.selectWorkflowType('Build a complete web application');
      this.assert(webAppType === 'web-app', 'Should select web-app workflow');

      const apiType = manager.selectWorkflowType('Create a RESTful API');
      this.assert(apiType === 'api-development', 'Should select api-development workflow');

      // Test workflow template structure
      const webAppTemplate = manager.workflowTemplates.get('web-app');
      this.assert(webAppTemplate.phases.length > 0, 'Web app template should have phases');
      this.assert(
        webAppTemplate.phases.some(p => p.agentType === 'senior-frontend-developer'),
        'Should include frontend development phase'
      );

      this.recordTest('Workflow Manager', '✅ Passed', {
        templateCount: templates.length,
        webAppPhases: webAppTemplate.phases.length
      });

      console.log('✅ Workflow Manager tests passed\n');

    } catch (error) {
      this.recordTest('Workflow Manager', '❌ Failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Test complete workflow execution
   */
  async testCompleteWorkflow() {
    console.log('🎯 Testing Complete Workflow Execution...');

    try {
      const manager = new WorkflowManager();

      // Execute a simple workflow
      const result = await manager.executeWorkflow(
        'Create a simple React component with testing',
        {
          autoStart: true,
          workflowType: 'frontend-component'
        }
      );

      // Verify results
      this.assert(result.workflowId, 'Should return workflow ID');
      this.assert(result.status === 'completed', 'Workflow should complete successfully');
      this.assert(result.phases, 'Should return phase results');

      // Test workflow status
      const status = await manager.getWorkflowStatus(result.workflowId);
      this.assert(status.workflowId === result.workflowId, 'Status should match workflow ID');
      this.assert(status.coordination, 'Should include coordination status');

      // Test active workflows listing
      const activeWorkflows = manager.listActiveWorkflows();
      this.assert(Array.isArray(activeWorkflows), 'Should return array of workflows');

      this.recordTest('Complete Workflow', '✅ Passed', {
        workflowId: result.workflowId,
        phaseCount: result.phases.size,
        duration: result.duration
      });

      console.log('✅ Complete Workflow tests passed\n');

    } catch (error) {
      this.recordTest('Complete Workflow', '❌ Failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, status, details) {
    this.testResults.push({
      test: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');

    for (const result of this.testResults) {
      console.log(`${result.status} ${result.test}`);
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    const passed = this.testResults.filter(r => r.status.includes('✅')).length;
    const failed = this.testResults.filter(r => r.status.includes('❌')).length;

    console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
    console.log(`⏱️  Total time: ${this.getTestDuration()}`);
  }

  /**
   * Calculate test duration
   */
  getTestDuration() {
    if (this.testResults.length === 0) return '0ms';

    const start = new Date(this.testResults[0].timestamp);
    const end = new Date(this.testResults[this.testResults.length - 1].timestamp);
    return `${end - start}ms`;
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new OrchestrationTester();

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Orchestration System Tester

Usage: node test.js [options]

Options:
  --help, -h     Show this help message
  --engine-only  Test orchestration engine only
  --coordinator-only  Test agent coordinator only
  --workflow-only     Test workflow manager only
  --verbose      Show detailed output

Examples:
  node test.js                    # Run all tests
  node test.js --engine-only       # Test engine only
  node test.js --verbose           # Show detailed output
    `);
    process.exit(0);
  }

  try {
    if (process.argv.includes('--engine-only')) {
      await tester.testOrchestrationEngine();
    } else if (process.argv.includes('--coordinator-only')) {
      await tester.testAgentCoordinator();
    } else if (process.argv.includes('--workflow-only')) {
      await tester.testWorkflowManager();
    } else {
      await tester.runAllTests();
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { OrchestrationTester };