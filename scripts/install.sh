#!/usr/bin/env bash
rm -Rf /etc/picom
cd /etc/
git clone https://github.com/kdolan/picom
cd picom
rm -Rf .git
