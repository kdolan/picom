#!/usr/bin/env bash
BRANCH=$1

if [ -n "$BRANCH" ]; then
  echo "BRANCH OVERRIDE: ${BRANCH}"
else
    BRANCH=master
fi

echo "Removing Existing Install..."
rm -Rf /etc/picom
cd /etc/
echo "Downloading..."
echo "clone https://github.com/kdolan/picom -b ${BRANCH}"
git clone https://github.com/kdolan/picom -b ${BRANCH}
cd picom
rm -Rf .git