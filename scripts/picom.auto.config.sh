#!/usr/bin/env bash
cd /
chown -R pi:pi /media/usb
mount /dev/sda1 /media/usb -o uid=pi,gid=pi

node /etc/picom/bin/auto-config.js