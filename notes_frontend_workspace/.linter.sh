#!/bin/bash
cd /home/kavia/workspace/code-generation/notemaster-33134-e63b4bdb/notes_frontend_workspace/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

