#!/usr/bin/env bash
BRANCH=$1
if BRANCH; then
  echo "BRANCH OVERRIDE: $BRANCH"
else
    BRANCH=master
fi
echo "Using branch $BRANCH"

echo "Removing Existing Install..."
rm -Rf /etc/picom
cd /etc/
echo "Downloading..."
git clone https://github.com/kdolan/picom -b ${BRANCH}
cd picom
rm -Rf .git

#Sim Link for Startup File
echo "Createing symlink for auto config..."
rm /etc/init.d/picom.auto.config.sh
ln -s /etc/picom/scripts/picom.auto.config.sh /etc/init.d/