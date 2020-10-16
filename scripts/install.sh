#!/usr/bin/env bash
BRANCH=$1
echo ${BRANCH}

if [[ -z "$BRANCH" ]]; then
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

#Sim Link for Startup File
echo "Createing symlink for auto config..."
rm /etc/init.d/picom.auto.config.sh
ln -s /etc/picom/scripts/picom.auto.config.sh /etc/init.d/