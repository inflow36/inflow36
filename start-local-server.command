#!/bin/zsh
# Run this file, then open http://localhost:4173 in Chrome.
cd "$(dirname "$0")"
python3 -m http.server 4173
