#!/bin/bash
echo "Retrieving git metadata from: $CODEBUILD_SOURCE_REPO_URL:$CODEBUILD_SOURCE_VERSION"
git clone -n $CODEBUILD_SOURCE_REPO_URL --separate-git-dir ./.git tempclone
git checkout $CODEBUILD_SOURCE_VERSION --detach --force
rm -rf tempclone