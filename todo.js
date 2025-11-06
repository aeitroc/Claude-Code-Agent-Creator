#!/usr/bin/env node

// Simple TodoWrite functionality
const fs = require('fs');
const path = require('path');

const TODOS_DIR = '/Users/besi/.glm/todos';

function getTodoFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${id}.json`;
}

function TodoWrite(todos) {
  // Ensure todos is an array
  if (!Array.isArray(todos)) {
    console.error('TodoWrite expects an array of todos');
    return;
  }

  // Create todo file
  const todoFile = path.join(TODOS_DIR, getTodoFileName());
  const todoData = {
    todos: todos,
    created_at: new Date().toISOString(),
    status: 'active'
  };

  try {
    fs.writeFileSync(todoFile, JSON.stringify(todoData, null, 2));
    console.log(`📝 Todos saved to: ${todoFile}`);
  } catch (error) {
    console.error('Failed to save todos:', error);
  }
}

// Also export for use as module
module.exports = TodoWrite;

// If called directly, allow interactive todo creation
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const todos = [{
      content: args.join(' '),
      status: 'pending',
      activeForm: `Working on: ${args.join(' ')}`
    }];

    TodoWrite(todos);
    console.log('✅ Todo created');
  } else {
    console.log('Usage: node todo.js "your task description"');
    console.log('Example: node todo.js "enhance menu header"');
  }
}