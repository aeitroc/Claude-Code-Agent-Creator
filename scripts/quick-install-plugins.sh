#!/bin/bash
# Quick plugin installation - adds marketplace and installs all plugins

echo "🚀 Quick installing all plugins..."

# Add marketplace first
claude plugin marketplace add wshobson/agents 2>/dev/null || echo "Marketplace may already exist"

# All 63 plugins in one array
plugins=(code-documentation debugging-toolkit git-pr-workflows backend-development frontend-mobile-development full-stack-orchestration unit-testing code-review-ai cloud-infrastructure incident-response python-development javascript-typescript multi-platform-apps documentation-generation tdd-workflows comprehensive-review performance-testing-review code-refactoring dependency-management error-debugging team-collaboration llm-application-dev agent-orchestration context-management machine-learning-ops data-engineering data-validation-suite database-design database-migrations error-diagnostics distributed-debugging observability-monitoring application-performance database-cloud-optimization deployment-strategies deployment-validation kubernetes-operations cicd-automation security-scanning security-compliance backend-api-security frontend-mobile-security framework-migration codebase-cleanup api-scaffolding api-testing-observability seo-content-creation seo-technical-optimization seo-analysis-monitoring content-marketing business-analytics hr-legal-compliance customer-sales-automation systems-programming jvm-languages web-scripting functional-programming arm-cortex-microcontrollers blockchain-web3 quantitative-trading payment-processing game-development accessibility-compliance)

# Install with progress
success=0
total=${#plugins[@]}
for i in "${!plugins[@]}"; do
    plugin="${plugins[$i]}"
    echo "[$((i+1))/$total] $plugin..."
    if claude plugin install "$plugin" 2>/dev/null; then
        echo "✅"
        success=$((success + 1))
    else
        echo "❌"
    fi
    sleep 0.3
done

echo "🎉 Done! Installed $success/$total plugins"