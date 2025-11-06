#!/usr/bin/env node

/**
 * Plugin Agent Discovery System
 * Scans the plugins directory to discover all available specialized agents
 */

const fs = require('fs').promises;
const path = require('path');

class AgentDiscovery {
  constructor() {
    this.pluginsDir = path.join(__dirname, '../plugins/marketplaces');
    this.discoveredAgents = new Map();
  }

  /**
   * Discover all agents from installed plugins
   */
  async discoverAllAgents() {
    try {
      // Scan plugins directory
      const plugins = await this.scanPluginsDirectory();
      
      for (const plugin of plugins) {
        const agents = await this.scanPluginForAgents(plugin);
        if (agents.length > 0) {
          this.discoveredAgents.set(plugin.category, agents);
        }
      }
      
      return this.categorizeAgents();
    } catch (error) {
      console.error('Error discovering agents:', error);
      return this.getDefaultAgents();
    }
  }

  /**
   * Scan the plugins directory structure
   */
  async scanPluginsDirectory() {
    const plugins = [];
    
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginsDir, entry.name);
          const category = await this.determinePluginCategory(pluginPath, entry.name);
          plugins.push({
            name: entry.name,
            path: pluginPath,
            category: category
          });
        }
      }
    } catch (error) {
      console.error('Error scanning plugins directory:', error);
    }
    
    return plugins;
  }

  /**
   * Determine plugin category based on directory name and content
   */
  async determinePluginCategory(pluginPath, pluginName) {
    // Map known plugin names to categories
    const categoryMap = {
      'claude-code-workflows': 'comprehensive',
      'backend-development': 'backend',
      'frontend-development': 'frontend',
      'database-design': 'database',
      'cloud-infrastructure': 'infrastructure',
      'kubernetes-operations': 'infrastructure',
      'security': 'security',
      'testing': 'testing',
      'devops': 'infrastructure',
      'api-development': 'backend',
      'multi-platform-apps': 'frontend',
      'javascript-typescript': 'frontend',
      'python-development': 'backend',
      'systems-programming': 'backend',
      'jvm-languages': 'backend',
      'functional-programming': 'backend',
      'game-development': 'frontend',
      'web-scripting': 'backend',
      'database-migrations': 'database',
      'observability-monitoring': 'infrastructure',
      'incident-response': 'infrastructure',
      'team-collaboration': 'general',
      'accessibility-compliance': 'frontend',
      'api-scaffolding': 'backend',
      'comprehensive-review': 'testing',
      'error-debugging': 'testing',
      'llm-application-dev': 'backend',
      'performance-testing-review': 'testing',
      'agent-orchestration': 'general',
      'blockchain-web3': 'backend',
      'cicd-automation': 'infrastructure',
      'framework-migration': 'general',
      'payment-processing': 'backend'
    };
    
    // Check if plugin name matches known categories
    if (categoryMap[pluginName]) {
      return categoryMap[pluginName];
    }
    
    // Try to infer from directory structure
    try {
      const agentsPath = path.join(pluginPath, 'agents');
      if (await this.directoryExists(agentsPath)) {
        const agentFiles = await fs.readdir(agentsPath);
        const firstAgent = agentFiles.find(f => f.endsWith('.md'));
        
        if (firstAgent) {
          const agentContent = await fs.readFile(
            path.join(agentsPath, firstAgent), 
            'utf8'
          );
          
          // Look for keywords in agent description
          if (agentContent.includes('backend') || agentContent.includes('API')) {
            return 'backend';
          } else if (agentContent.includes('frontend') || agentContent.includes('UI')) {
            return 'frontend';
          } else if (agentContent.includes('database') || agentContent.includes('SQL')) {
            return 'database';
          } else if (agentContent.includes('security') || agentContent.includes('auth')) {
            return 'security';
          } else if (agentContent.includes('test') || agentContent.includes('QA')) {
            return 'testing';
          } else if (agentContent.includes('cloud') || agentContent.includes('devops')) {
            return 'infrastructure';
          }
        }
      }
    } catch (error) {
      // Ignore errors and fall back to general
    }
    
    return 'general';
  }

  /**
   * Scan a specific plugin for agent definitions
   */
  async scanPluginForAgents(plugin) {
    const agents = [];
    
    try {
      // Look for agents directory
      const agentsDir = path.join(plugin.path, 'agents');
      if (!(await this.directoryExists(agentsDir))) {
        return agents;
      }
      
      // Read all agent markdown files
      const agentFiles = await fs.readdir(agentsDir);
      
      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          const agent = await this.parseAgentFile(
            path.join(agentsDir, file),
            plugin.category
          );
          if (agent) {
            agents.push(agent);
          }
        }
      }
      
      // Also check for agent definitions in docs
      const docsDir = path.join(plugin.path, 'docs');
      if (await this.directoryExists(docsDir)) {
        const agentsDoc = path.join(docsDir, 'agents.md');
        if (await this.fileExists(agentsDoc)) {
          const docAgents = await this.parseAgentsDocument(agentsDoc, plugin.category);
          agents.push(...docAgents);
        }
      }
      
    } catch (error) {
      console.error(`Error scanning plugin ${plugin.name}:`, error);
    }
    
    return agents;
  }

  /**
   * Parse an individual agent markdown file
   */
  async parseAgentFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath, '.md');
      
      // Extract YAML frontmatter
      const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let metadata = {};
      if (yamlMatch) {
        // Simple YAML parsing (basic)
        yamlMatch[1].split('\n').forEach(line => {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            metadata[match[1]] = match[2].replace(/^["']|["']$/g, '');
          }
        });
      }
      
      // Extract agent information
      const agent = {
        name: fileName,
        category: category,
        model: metadata.model || 'sonnet',
        description: this.extractDescription(content),
        capabilities: this.extractCapabilities(content),
        focusAreas: this.extractFocusAreas(content),
        triggers: this.extractTriggers(content),
        filePath: filePath
      };
      
      return agent;
    } catch (error) {
      console.error(`Error parsing agent file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse agents from a markdown document
   */
  async parseAgentsDocument(filePath, category) {
    const agents = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Look for agent definitions in markdown tables
      const tableRows = content.match(/\|\s*([^\|]+)\s*\|\s*([^\|]+)\s*\|\s*([^\|]+)\s*\|/g);
      
      if (tableRows) {
        for (const row of tableRows) {
          const cols = row.split('|').map(c => c.trim()).filter(c => c);
          if (cols.length >= 3) {
            const agentName = cols[0].replace(/\[([^\]]+)\]\([^)]+\)/, '$1'); // Remove markdown links
            const model = cols[1].toLowerCase();
            const description = cols[2];
            
            agents.push({
              name: agentName,
              category: category,
              model: model,
              description: description,
              capabilities: [],
              focusAreas: [],
              triggers: [],
              filePath: filePath
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing agents document ${filePath}:`, error);
    }
    
    return agents;
  }

  /**
   * Extract description from agent content
   */
  extractDescription(content) {
    // Look for description in various patterns
    const patterns = [
      /^#\s*([^\n]+)/m,
      /description[:\s]*([^\n]+)/i,
      /purpose[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Specialized agent for specific domain expertise';
  }

  /**
   * Extract capabilities from agent content
   */
  extractCapabilities(content) {
    const capabilities = [];
    
    // Look for bullet points or numbered lists describing capabilities
    const listPattern = /(?:^[-*]\s+|^\d+\.\s+)([^\n]+)/gm;
    let match;
    
    while ((match = listPattern.exec(content)) !== null) {
      const capability = match[1].trim();
      if (capability.length > 5 && capability.length < 100) {
        capabilities.push(capability);
      }
    }
    
    return capabilities.slice(0, 5); // Limit to 5 capabilities
  }

  /**
   * Extract focus areas from agent content
   */
  extractFocusAreas(content) {
    const focusAreas = [];
    
    // Look for "focus", "specializes in", "expertise in" etc.
    const patterns = [
      /focus(?:es)?(?:\s+on)?[:\s]*([^\n]+)/i,
      /specializes?\s+in[:\s]*([^\n]+)/i,
      /expertise[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const areas = match[1].split(/[,;]/).map(a => a.trim());
        focusAreas.push(...areas.filter(a => a.length > 3));
      }
    }
    
    return focusAreas.slice(0, 3); // Limit to 3 focus areas
  }

  /**
   * Extract usage triggers from agent content
   */
  extractTriggers(content) {
    const triggers = [];
    
    // Look for "use when", "when to use", "activates when" etc.
    const patterns = [
      /use\s+when[:\s]*([^\n]+)/i,
      /when\s+to\s+use[:\s]*([^\n]+)/i,
      /activates?\s+when[:\s]*([^\n]+)/i,
      /trigger[s]?:\s*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        triggers.push(match[1].trim());
      }
    }
    
    return triggers.slice(0, 3); // Limit to 3 triggers
  }

  /**
   * Categorize discovered agents by domain
   */
  categorizeAgents() {
    const categorized = {
      'backend-development': [],
      'frontend-development': [],
      'database-design': [],
      'infrastructure': [],
      'security': [],
      'testing': [],
      'general': []
    };
    
    // Categorize based on agent properties
    for (const [category, agents] of this.discoveredAgents) {
      for (const agent of agents) {
        // Use the determined category or infer from description
        let targetCategory = agent.category;
        
        if (!targetCategory || targetCategory === 'comprehensive') {
          targetCategory = this.inferCategoryFromAgent(agent);
        }
        
        if (categorized[targetCategory]) {
          categorized[targetCategory].push(agent);
        } else {
          categorized['general'].push(agent);
        }
      }
    }
    
    return categorized;
  }

  /**
   * Infer agent category from its properties
   */
  inferCategoryFromAgent(agent) {
    const text = `${agent.name} ${agent.description} ${agent.capabilities.join(' ')}`.toLowerCase();
    
    if (text.includes('backend') || text.includes('api') || text.includes('server')) {
      return 'backend-development';
    } else if (text.includes('frontend') || text.includes('ui') || text.includes('react')) {
      return 'frontend-development';
    } else if (text.includes('database') || text.includes('sql') || text.includes('schema')) {
      return 'database-design';
    } else if (text.includes('security') || text.includes('auth') || text.includes('vulnerability')) {
      return 'security';
    } else if (text.includes('test') || text.includes('qa') || text.includes('testing')) {
      return 'testing';
    } else if (text.includes('cloud') || text.includes('devops') || text.includes('kubernetes')) {
      return 'infrastructure';
    }
    
    return 'general';
  }

  /**
   * Get default agents if discovery fails
   */
  getDefaultAgents() {
    return {
      'backend-development': [
        {
          name: 'backend-architect',
          category: 'backend-development',
          model: 'sonnet',
          description: 'Backend architecture and API design',
          capabilities: ['API design', 'Database design', 'Security'],
          focusAreas: ['Backend architecture', 'API development'],
          triggers: ['API design needed', 'Backend architecture'],
          filePath: null
        }
      ],
      'frontend-development': [
        {
          name: 'frontend-developer',
          category: 'frontend-development',
          model: 'sonnet',
          description: 'Frontend component and UI development',
          capabilities: ['React components', 'TypeScript', 'State management'],
          focusAreas: ['UI components', 'Frontend architecture'],
          triggers: ['UI implementation', 'Frontend development'],
          filePath: null
        }
      ],
      'database-design': [
        {
          name: 'database-architect',
          category: 'database-design',
          model: 'sonnet',
          description: 'Database schema design and optimization',
          capabilities: ['Schema design', 'Query optimization', 'Data modeling'],
          focusAreas: ['Database architecture', 'Performance'],
          triggers: ['Database design', 'Schema needed'],
          filePath: null
        }
      ],
      'infrastructure': [],
      'security': [],
      'testing': [],
      'general': []
    };
  }

  /**
   * Helper: Check if directory exists
   */
  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if file exists
   */
  async fileExists(filePath) {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Select best agents for a given feature
   */
  async selectAgentsForFeature(featureDescription, techStack = {}) {
    const allAgents = await this.discoverAllAgents();
    const selectedAgents = [];
    
    const description = featureDescription.toLowerCase();
    
    // Backend requirements
    if (description.includes('api') || description.includes('backend') || description.includes('server')) {
      // Check for technology-specific agents first
      if (techStack.backend === 'fastapi' || description.includes('fastapi')) {
        const fastapiAgent = allAgents['backend-development']
          .find(a => a.name.includes('fastapi'));
        if (fastapiAgent) selectedAgents.push(fastapiAgent);
      }
      
      if (techStack.backend === 'django' || description.includes('django')) {
        const djangoAgent = allAgents['backend-development']
          .find(a => a.name.includes('django'));
        if (djangoAgent) selectedAgents.push(djangoAgent);
      }
      
      // Add general backend architect
      const backendArchitect = allAgents['backend-development']
        .find(a => a.name.includes('architect'));
      if (backendArchitect && !selectedAgents.find(a => a.name === backendArchitect.name)) {
        selectedAgents.push(backendArchitect);
      }
    }
    
    // Frontend requirements
    if (description.includes('frontend') || description.includes('ui') || description.includes('react')) {
      const frontendDev = allAgents['frontend-development']
        .find(a => a.name.includes('frontend') || a.name.includes('react'));
      if (frontendDev) selectedAgents.push(frontendDev);
    }
    
    // Database requirements
    if (description.includes('database') || description.includes('schema') || description.includes('migration')) {
      const dbArchitect = allAgents['database-design']
        .find(a => a.name.includes('database') || a.name.includes('schema'));
      if (dbArchitect) selectedAgents.push(dbArchitect);
    }
    
    // Security requirements
    if (description.includes('security') || description.includes('auth') || description.includes('jwt')) {
      const securityAgent = allAgents['security']
        .find(a => a.name.includes('security') || a.name.includes('auth'));
      if (securityAgent) selectedAgents.push(securityAgent);
    }
    
    return selectedAgents;
  }
}

// Export for use in other modules
module.exports = AgentDiscovery;

// If run directly, perform discovery and output results
if (require.main === module) {
  const discovery = new AgentDiscovery();
  
  discovery.discoverAllAgents()
    .then(agents => {
      console.log('\n🔍 Discovered Plugin Agents:');
      console.log('================================');
      
      let totalAgents = 0;
      for (const [category, agentList] of Object.entries(agents)) {
        if (agentList.length > 0) {
          console.log(`\n${category.toUpperCase()} (${agentList.length} agents):`);
          agentList.forEach(agent => {
            console.log(`  - ${agent.name} (${agent.model}): ${agent.description}`);
            totalAgents++;
          });
        }
      }
      
      console.log(`\n✅ Total: ${totalAgents} specialized agents discovered`);
      
      // Test feature selection
      console.log('\n📋 Testing Agent Selection:');
      console.log('===========================');
      
      const testFeatures = [
        'FastAPI backend with user authentication',
        'React frontend with TypeScript',
        'Database schema for e-commerce',
        'Secure payment processing'
      ];
      
      testFeatures.forEach(async (feature, index) => {
        console.log(`\n${index + 1}. Feature: ${feature}`);
        const selected = await discovery.selectAgentsForFeature(feature);
        if (selected.length > 0) {
          console.log('   Selected agents:');
          selected.forEach(agent => {
            console.log(`   - ${agent.name} (${agent.model})`);
          });
        } else {
          console.log('   No specific agents found');
        }
      });
    })
    .catch(error => {
      console.error('Discovery failed:', error);
      process.exit(1);
    });
}
