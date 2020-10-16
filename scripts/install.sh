#!/usr/bin/env bash
rm -Rf /etc/picom
mkdir /etc/picom

cd /etc/picom

git archive --remote="https://github.com/kdolan/effective-winner-mumble" | tar -t