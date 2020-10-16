#!/usr/bin/env bash
rm -Rf /etc/picom
cd /etc/
git clone https://github.com/kdolan/picom
cd picom
rm -Rf .git

#Sim Link for Startup File
ln -s scripts/picom.auto.config.sh /etc/init.d/