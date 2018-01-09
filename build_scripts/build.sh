#!/bin/bash
source "$NVM_DIR/nvm.sh"
npm install
npm test
if ["$CODEBUILD_INITIATOR"=="$DEPLOYMENT_PIPELINE"]; then
    npm run release
else
    echo "Skipping publish on non-deployment build"
fi