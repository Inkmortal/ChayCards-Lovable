#!/bin/bash

# Script to migrate getService/getComponent calls from old to new plugin IDs
# Old: getService('core-theme/themeService')
# New: getService('chaycards/core-theme/themeService')

set -e

echo "🔄 Migrating service and component calls to new plugin IDs..."

# Define old → new plugin ID mappings
declare -A PLUGIN_MAPPINGS=(
  ["'core-settings/"]="'chaycards/core-settings/"
  ["'core-theme/"]="'chaycards/core-theme/"
  ["'core-ui/"]="'chaycards/core-ui/"
  ["'core-documents/"]="'chaycards/core-documents/"
  ["'core-flashcards/"]="'chaycards/core-flashcards/"
  ["'demo-plugin/"]="'chaycards/demo-plugin/"
  ["'theme-catppuccin/"]="'chaycards/theme-catppuccin/"
  ["'theme-dracula/"]="'chaycards/theme-dracula/"
  ["'theme-gruvbox/"]="'chaycards/theme-gruvbox/"
  ["'theme-tokyonight/"]="'chaycards/theme-tokyonight/"
  ["'theme-chay/"]="'chaycards/theme-chay/"

  # Double quote versions
  ['"core-settings/']='\"chaycards/core-settings/'
  ['"core-theme/']='\"chaycards/core-theme/'
  ['"core-ui/']='\"chaycards/core-ui/'
  ['"core-documents/']='\"chaycards/core-documents/'
  ['"core-flashcards/']='\"chaycards/core-flashcards/'
  ['"demo-plugin/']='\"chaycards/demo-plugin/'
  ['"theme-catppuccin/']='\"chaycards/theme-catppuccin/'
  ['"theme-dracula/']='\"chaycards/theme-dracula/'
  ['"theme-gruvbox/']='\"chaycards/theme-gruvbox/'
  ['"theme-tokyonight/']='\"chaycards/theme-tokyonight/'
  ['"theme-chay/']='\"chaycards/theme-chay/'
)

# Find all TypeScript/TSX files in plugins directory
FILES=$(find src/plugins -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.d.ts")

UPDATED_COUNT=0

for file in $FILES; do
  MODIFIED=false

  for OLD_ID in "${!PLUGIN_MAPPINGS[@]}"; do
    NEW_ID="${PLUGIN_MAPPINGS[$OLD_ID]}"

    # Check if file contains the old pattern
    if grep -q "$OLD_ID" "$file" 2>/dev/null; then
      # Replace in file
      sed -i "s|$OLD_ID|$NEW_ID|g" "$file"
      MODIFIED=true
    fi
  done

  if [ "$MODIFIED" = true ]; then
    echo "  ✅ Updated: $file"
    ((UPDATED_COUNT++))
  fi
done

echo ""
echo "✅ Migration complete!"
echo "   Updated $UPDATED_COUNT files"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff src/plugins"
echo "  2. Test: npm run dev"
