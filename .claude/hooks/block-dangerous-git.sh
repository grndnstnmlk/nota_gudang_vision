#!/usr/bin/env bash
# Intercept and block dangerous git commands

COMMAND="$1"

# Patterns of dangerous git commands
BLOCKED_PATTERNS=(
  "git push"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "git clean -f"
  "git clean -fd"
  "git branch -D"
  "git checkout \."
  "git restore \."
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -Eq "$pattern"; then
    echo "🚫 [Git Guardrail] Perintah '$COMMAND' diblokir untuk mencegah kehilangan data atau push yang tidak disengaja." >&2
    echo "💡 Lakukan perintah tersebut secara manual di terminal jika memang diperlukan." >&2
    exit 1
  fi
done

exit 0
