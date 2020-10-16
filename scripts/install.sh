#!/usr/bin/env bash
echo "Removing Existing Install..."
rm -Rf /etc/picom
cd /etc/
echo "Downloading..."
git clone https://github.com/kdolan/picom
cd picom
rm -Rf .git

#Sim Link for Startup File
echo "Createing symlink for auto config..."
ln -s scripts/picom.auto.config.sh /etc/init.d/