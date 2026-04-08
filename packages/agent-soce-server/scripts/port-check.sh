#!/bin/bash
# Check for port conflicts before deployment
echo "Checking Agent SOCE required ports..."
PORTS=(3090 5433 6381 11434)
CONFLICTS=0

for PORT in "${PORTS[@]}"; do
  if command -v netstat &>/dev/null; then
    if netstat -an 2>/dev/null | grep -q ":$PORT "; then
      echo "  ✗ Port $PORT is IN USE"
      CONFLICTS=$((CONFLICTS+1))
    else
      echo "  ✓ Port $PORT is free"
    fi
  elif command -v ss &>/dev/null; then
    if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
      echo "  ✗ Port $PORT is IN USE"
      CONFLICTS=$((CONFLICTS+1))
    else
      echo "  ✓ Port $PORT is free"
    fi
  else
    echo "  ? Port $PORT status unknown (install netstat or ss)"
  fi
done

if [ "$CONFLICTS" -gt 0 ]; then
  echo ""
  echo "⚠  $CONFLICTS port conflict(s) found. Resolve before deploying."
  exit 1
else
  echo ""
  echo "✓ All ports available. Ready to deploy."
fi
