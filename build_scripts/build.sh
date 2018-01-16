#!/bin/bash
source "$NVM_DIR/nvm.sh"
npm install
npm test
if [ $GIT_REF == $DEPLOYMENT_REF ]; then
    npm run release
    npm run docgen
    aws s3 sync docs s3://valory-docs
else
    echo "Skipping publish on non-deployment ref: $GIT_REF"
fi