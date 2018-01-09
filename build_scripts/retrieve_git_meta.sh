#!/bin/bash
echo "Retrieving git metadata from: $CODEBUILD_SOURCE_REPO_URL:$CODEBUILD_RESOLVED_SOURCE_VERSION"
#git status
git clone -n $CODEBUILD_SOURCE_REPO_URL --separate-git-dir ./.git tempclone
git checkout $CODEBUILD_RESOLVED_SOURCE_VERSION --detach --force
rm -rf tempclone