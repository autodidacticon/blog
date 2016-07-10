---
layout: post
title: "Redirection and /dev/null"
date: 2014-09-27 22:50:52 -0500
comments: true
categories: linux
---

Installed my favorite [IDE](http://www.jetbrains.com/idea/) on Fedora 20; installation was as simple as
```bash
tar xfz idea-13.tar.gz
```
However the executable script `idea.sh` remains in the foreground; fail. First solution:
```bash
idea.sh &
```
My process is in the background, yay, but apparently stdout is still appearing in the foreground (subprocesses?). Second solution:
```bash
nohup idea.sh &
```
All output is now appended to 'nohup.out'; less than ideal solution as the output file will be created wherever the executable is called and will continue to expand in size with program usage. Third solution: 
```bash
idea.sh > /dev/null 2>&1 &
```
All output is now sent to [/dev/null](http://en.wikipedia.org/wiki/Null_device) and the process runs in the background.

Okay, thats a lot to type. Lets put this in a script:
```bash
#!/usr/bin/env bash
. /opt/idea-IU-135.909/bin/idea.sh > /dev/null 2>&1 &
```
and symlink it to /usr/local/bin so I can call it anywhere:
```bash
sudo ln -s /opt/idea-IU-135.909/bin/intellij.sh /usr/local/bin/intellij
```
