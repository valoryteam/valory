#!/bin/bash
source "$NVM_DIR/nvm.sh"
npm install
npm test
if [ $GIT_BRANCH == $DEPLOYMENT_BRANCH ]; then
    npm run release
else
    echo "Skipping publish on non-deployment branch: $GIT_BRANCH"
fi