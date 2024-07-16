#!/bin/bash
export GIT_REPO_URL="$GIT_REPO_URL"  
# export git url 
git clone "$GIT_REPO_URL" /home/usr/app/output           
# clone it in the path

exec node script.js
# execute the command 

