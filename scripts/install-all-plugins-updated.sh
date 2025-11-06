#!/bin/bash

# Complete Plugin Marketplace Setup and Bulk Installation
# This script will: 1) Add the marketplace, 2) Install all 63 plugins

echo "🚀 Setting up Claude Code Plugin Marketplace..."
echo "This will install all 63 plugins automatically"
echo ""

# Step 1: Add the marketplace
echo "📦 Adding plugin marketplace..."
if claude plugin marketplace add wshobson/agents 2>/dev/null; then
    echo "✅ Marketplace added successfully"
else
    echo "⚠️  Marketplace might already be added or command failed"
fi
echo ""

# Step 2: Define all 63 plugins from the documentation
plugins=(
    # Development Essentials
    "code-documentation"
    "debugging-toolkit"
    "git-pr-workflows"

    # Full-Stack Development
    "backend-development"
    "frontend-mobile-development"
    "full-stack-orchestration"

    # Testing & Quality
    "unit-testing"
    "code-review-ai"

    # Infrastructure & Operations
    "cloud-infrastructure"
    "incident-response"

    # Language Support
    "python-development"
    "javascript-typescript"

    # Development (Additional)
    "multi-platform-apps"

    # Documentation
    "documentation-generation"

    # Workflows
    "tdd-workflows"

    # Quality
    "comprehensive-review"
    "performance-testing-review"

    # Utilities
    "code-refactoring"
    "dependency-management"
    "error-debugging"
    "team-collaboration"

    # AI & ML
    "llm-application-dev"
    "agent-orchestration"
    "context-management"
    "machine-learning-ops"

    # Data
    "data-engineering"
    "data-validation-suite"

    # Database
    "database-design"
    "database-migrations"

    # Operations
    "error-diagnostics"
    "distributed-debugging"
    "observability-monitoring"

    # Performance
    "application-performance"
    "database-cloud-optimization"

    # Infrastructure
    "deployment-strategies"
    "deployment-validation"
    "kubernetes-operations"
    "cicd-automation"

    # Security
    "security-scanning"
    "security-compliance"
    "backend-api-security"
    "frontend-mobile-security"

    # Modernization
    "framework-migration"
    "codebase-cleanup"

    # API
    "api-scaffolding"
    "api-testing-observability"

    # Marketing
    "seo-content-creation"
    "seo-technical-optimization"
    "seo-analysis-monitoring"
    "content-marketing"

    # Business
    "business-analytics"
    "hr-legal-compliance"
    "customer-sales-automation"

    # Languages
    "systems-programming"
    "jvm-languages"
    "web-scripting"
    "functional-programming"
    "arm-cortex-microcontrollers"

    # Specialized
    "blockchain-web3"
    "quantitative-trading"
    "payment-processing"
    "game-development"
    "accessibility-compliance"
)

# Counters for tracking progress
total=${#plugins[@]}
current=0
success_count=0
failed_count=0
failed_plugins=()

echo "📋 Found $total plugins to install"
echo "⏱️  This may take several minutes..."
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
    echo ""
    echo "💡 You can try installing failed plugins individually:"
    echo "   /plugin install <plugin-name>"
fi

echo ""
echo "🔍 Check installed plugins with: /plugin"
echo "🚀 Enjoy your enhanced Claude Code experience with $success_count new plugins!"
echo ""
echo "💡 Pro tip: You can now use specialized agents for:"
echo "   • Python dev: /skill python-development"
echo "   • Backend APIs: /skill backend-development"
echo "   • Frontend UI: /skill frontend-mobile-development"
echo "   • Documentation: /skill code-documentation"
echo "   • And 59 more specialized skills!"