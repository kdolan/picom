#!/usr/bin/env bash
cd /
if cat /proc/mounts | tail -n 1 | grep -q usb0; then
    echo "'/media/usb already mounted"
else
    echo "Mounting Drive"
    mount /dev/sda1 /mnt -o uid=pi,gid=pi
fi

echo "Running script.."
node /etc/picom/bin/auto-config.js