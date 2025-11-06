#!/bin/bash

# Bulk install all 63 plugins from the marketplace
# This script automates the installation of all available plugins

echo "🚀 Starting bulk installation of all 63 plugins..."
echo "This may take several minutes..."
echo ""

# Array of all 63 plugins from the marketplace
plugins=(
    "code-documentation"
    "debugging-toolkit"
    "git-pr-workflows"
    "backend-development"
    "frontend-mobile-development"
    "full-stack-orchestration"
    "unit-testing"
    "code-review-ai"
    "cloud-infrastructure"
    "incident-response"
    "python-development"
    "javascript-typescript"
    "multi-platform-apps"
    "documentation-generation"
    "tdd-workflows"
    "comprehensive-review"
    "performance-testing-review"
    "code-refactoring"
    "dependency-management"
    "error-debugging"
    "team-collaboration"
    "llm-application-dev"
    "agent-orchestration"
    "context-management"
    "machine-learning-ops"
    "data-engineering"
    "data-validation-suite"
    "database-design"
    "database-migrations"
    "error-diagnostics"
    "distributed-debugging"
    "observability-monitoring"
    "application-performance"
    "database-cloud-optimization"
    "deployment-strategies"
    "deployment-validation"
    "kubernetes-operations"
    "cicd-automation"
    "security-scanning"
    "security-compliance"
    "backend-api-security"
    "frontend-mobile-security"
    "framework-migration"
    "codebase-cleanup"
    "api-scaffolding"
    "api-testing-observability"
    "seo-content-creation"
    "seo-technical-optimization"
    "seo-analysis-monitoring"
    "content-marketing"
    "business-analytics"
    "hr-legal-compliance"
    "customer-sales-automation"
    "systems-programming"
    "jvm-languages"
    "web-scripting"
    "functional-programming"
    "arm-cortex-microcontrollers"
    "blockchain-web3"
    "quantitative-trading"
    "payment-processing"
    "game-development"
    "accessibility-compliance"
)

# Counter for tracking progress
total=${#plugins[@]}
current=0
success_count=0
failed_count=0
failed_plugins=()

echo "Found $total plugins to install"
echo ""

# Install each plugin
for plugin in "${plugins[@]}"; do
    current=$((current + 1))
    echo "[$current/$total] Installing $plugin..."

    if claude plugin install "$plugin" 2>/dev/null; then
        echo "✅ Successfully installed $plugin"
        success_count=$((success_count + 1))
    else
        echo "❌ Failed to install $plugin"
        failed_count=$((failed_count + 1))
        failed_plugins+=("$plugin")
    fi

    # Small delay to avoid overwhelming the system
    sleep 0.5
    echo ""
done

echo "🎉 Installation complete!"
echo "📊 Summary:"
echo "   ✅ Successfully installed: $success_count plugins"
echo "   ❌ Failed to install: $failed_count plugins"

if [ $failed_count -gt 0 ]; then
    echo ""
    echo "❌ Failed plugins:"
    for plugin in "${failed_plugins[@]}"; do
        echo "   - $plugin"
    done
fi

echo ""
echo "🔍 You can check installed plugins with: /plugin"
echo "🚀 Enjoy your enhanced Claude Code experience!"