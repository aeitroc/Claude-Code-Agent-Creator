#!/usr/bin/env node

const { OrchestrationEngine } = require('./engine');

async function debugComplexity() {
  const engine = new OrchestrationEngine();
  await engine.initialize();

  const request = 'Build a complete web application with React frontend, Node.js backend, and PostgreSQL database';
  const complexity = await engine.analyzeComplexity(request);

  console.log('Request:', request);
  console.log('Complexity result:', JSON.stringify(complexity, null, 2));

  console.log('Domains:', complexity.factors.domains);
  console.log('Level:', complexity.level);
  console.log('Score:', complexity.score);
}

debugComplexity().catch(console.error);