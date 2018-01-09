#!/bin/bash
source "$NVM_DIR/nvm.sh"
npm install
npm test
npm run release