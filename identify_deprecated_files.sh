#!/bin/bash

# ============================================================================
# Identify Deprecated Files Script
# Date: 2025-01-15
# 
# This script helps identify potentially deprecated or unused files
# Review the output carefully before deleting anything!
# ============================================================================

echo "🔍 Scanning for potentially deprecated files..."
echo ""

# ============================================================================
# 1. SQL Migration Scripts
# ============================================================================
echo "📄 SQL Migration Scripts:"
echo "========================"
find . -name "*.sql" -type f | grep -v node_modules | sort
echo ""
echo "❓ Questions to ask:"
echo "   - Are there multiple versions of the same migration?"
echo "   - Are there 'old', 'backup', or 'test' versions?"
echo "   - Which is the current/canonical version?"
echo ""

# ============================================================================
# 2. Potentially Unused TypeScript/React Files
# ============================================================================
echo "📦 Checking for files with no exports (potentially unused):"
echo "=========================================================="
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.d.ts" | while read file; do
    if ! grep -q "export" "$file" 2>/dev/null; then
        echo "⚠️  No exports found: $file"
    fi
done
echo ""

# ============================================================================
# 3. Files with 'old', 'backup', 'deprecated' in name
# ============================================================================
echo "🗑️  Files with suspicious names:"
echo "================================"
find . -type f \( -iname "*old*" -o -iname "*backup*" -o -iname "*deprecated*" -o -iname "*test*" -o -iname "*temp*" \) | grep -v node_modules | grep -v .git
echo ""

# ============================================================================
# 4. Duplicate SQL scripts (similar names)
# ============================================================================
echo "📋 Potential duplicate SQL scripts:"
echo "===================================="
find . -name "*.sql" -type f | grep -v node_modules | sed 's/_v[0-9]*.sql/.sql/' | sed 's/_[0-9]*.sql/.sql/' | sort | uniq -d
echo ""

# ============================================================================
# 5. Large files that might be test data
# ============================================================================
echo "📊 Large files (>100KB) - might be test data:"
echo "=============================================="
find . -type f -size +100k | grep -v node_modules | grep -v .git | grep -v .next
echo ""

# ============================================================================
# 6. Files not modified in last 30 days
# ============================================================================
echo "📅 Files not modified in last 30 days:"
echo "======================================"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -mtime +30 | head -20
echo "   (showing first 20 only)"
echo ""

# ============================================================================
# 7. Check for unused imports in package.json
# ============================================================================
echo "📦 Checking for potentially unused npm packages:"
echo "================================================"
if command -v depcheck &> /dev/null; then
    depcheck --ignores="@types/*,eslint-*,prettier"
else
    echo "⚠️  Install depcheck for this analysis: npm install -g depcheck"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "✅ Scan complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the output above"
echo "   2. Manually verify each file before deletion"
echo "   3. Check git history: git log --follow <file>"
echo "   4. Search for usage: grep -r 'filename' src/"
echo "   5. Create DEPRECATED_FILES.md to document removals"
echo "   6. Test application after cleanup: npm run build"
echo ""
echo "⚠️  IMPORTANT: Never delete files without:"
echo "   - Checking git history"
echo "   - Searching for usage in codebase"
echo "   - Testing application after removal"
echo "   - Committing to version control (so you can revert)"
