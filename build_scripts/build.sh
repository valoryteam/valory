#!/bin/bash
source "$NVM_DIR/nvm.sh"
npm install
npm test
if [ $GIT_REF == $DEPLOYMENT_REF ]; then
    npm run release
else
    echo "Skipping publish on non-deployment ref: $GIT_REF"
fi