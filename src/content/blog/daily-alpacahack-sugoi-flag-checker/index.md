---
title: "Daily AlpacaHack: Sugoi Flag Checker"
description: 'This is my write up solving daily challenge from AlpacaHack'
date: 2025-12-14
tags: ["Reverse Engineering", "AlpacaHack", "Writeup"]
image: 'https://pbs.twimg.com/media/G7Axcw8bIAE1vR5.jpg'
authors: ['chjwoo']
draft: false
---

Hello guys! This is my writeup for solving the daily AlpacaHack challenge (even though I missed this one).

## Description

```
A super flag checker that uses a super cryptographic algorithm.
Beginner Hint①

    chal is an ELF executable file. First, try decompiling it using reverse engineering tools like IDA Free, Ghidra, or Binary Ninja.
    Also, since this problem is rated Hard, beginners are encouraged to utilize AI as needed.
    For example, you can drag and drop the binary into ChatGPT, and it will assist with analysis.

Beginner Hint② (Spoiler Alert!)

    Actually, you can solve this problem without understanding much about the cryptographic processing.
    Focus on what strings the strcmp function is comparing.
```

### Initial Analysis

Let's start by checking what kind of file we're dealing with:

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/rev/sugoi_flag_checker/sugoi-flag-checker]
└─$ file chal     
chal: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=3b15c69aae76a5e1439592c86a2483231f792c39, for GNU/Linux 3.2.0, not stripped                                                                          
```

This chall is ELF 64-bit, PIE (Position Independent Executable) enabled, Not stripped - symbols are still present (helpful!).

Opening the binary in Ghidra and examining the `main` function reveals the program's logic:

```c

undefined8 main(void)

{
  char cVar1;
  int iVar2;
  undefined8 uVar3;
  long in_FS_OFFSET;
  long output_length;
  ulong local_180;
  undefined1 local_178 [176];
  char enc_flag [48];
  char input_flag [136];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  output_length = 0;
  printf("flag: ");
  cVar1 = read_flag_input(input_flag,0x80,&output_length);
  if (cVar1 == '\x01') {
    if (output_length == 0x20) {
      enc_flag[0] = -0x52;
      enc_flag[1] = '=';
      enc_flag[2] = '\x10';
      enc_flag[3] = 'l';
      enc_flag[4] = -0x4c;
      enc_flag[5] = -0x7e;
      enc_flag[6] = '\x10';
      enc_flag[7] = -0x75;
      enc_flag[8] = -0x61;
      enc_flag[9] = 'z';
      enc_flag[10] = -0x37;
      enc_flag[0xb] = '\x01';
      enc_flag[0xc] = -0x52;
      enc_flag[0xd] = -0x69;
      enc_flag[0xe] = -0x5e;
      enc_flag[0xf] = -0x50;
      enc_flag[0x10] = '@';
      enc_flag[0x11] = '/';
      enc_flag[0x12] = 'J';
      enc_flag[0x13] = -0x5b;
      enc_flag[0x14] = -0x2a;
      enc_flag[0x15] = '+';
      enc_flag[0x16] = 'B';
      enc_flag[0x17] = '<';
      enc_flag[0x18] = -0x34;
      enc_flag[0x19] = '~';
      enc_flag[0x1a] = -0x41;
      enc_flag[0x1b] = -0x5c;
      enc_flag[0x1c] = '\x14';
      enc_flag[0x1d] = -0x7d;
      enc_flag[0x1e] = -0x7d;
      enc_flag[0x1f] = '3';
      init_cipher(local_178,key);
      for (local_180 = 0; local_180 < 0x20; local_180 = local_180 + 0x10) {
        decrypt_block(local_178,enc_flag + local_180);
      }
      enc_flag[0x20] = 0;
      iVar2 = strcmp(input_flag,enc_flag);
      if (iVar2 == 0) {
        puts("correct!");
      }
      else {
        puts("wrong...");
      }
      uVar3 = 0;
    }
    else {
      puts("wrong...");
      uVar3 = 0;
    }
  }
  else {
    uVar3 = 1;
  }
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return uVar3;
}

```

- **Input Validation**: The program checks if the input is exactly 32 characters (`0x20`)
- **Encrypted Flag**: There's a hardcoded encrypted flag in the binary
- **Decryption Process**: The program uses cryptographic functions (`init_cipher`, `decrypt_block`)
- **Comparison**: After decryption, it uses `strcmp` to compare user input with the **decrypted flag**

I was stuck and don’t know what to do, and then I remember the hint says: `*"Focus on what strings the strcmp function is comparing."`*  This is key! The program **decrypts the flag at runtime** before comparing it with our input. This means we don't need to reverse the crypto - we just need to intercept the decrypted flag in memory!

## Solution

Instead of reversing the cryptographic algorithm, we can simply run the program in a debugger and inspect the memory at the point where `strcmp` is called.

```bash
┌──(chjwoo㉿hackbox)-[/mnt/…/alpacahack/rev/sugoi_flag_checker/sugoi-flag-checker]
└─$ gdb-gef ./chal 
Reading symbols from ./chal...
(No debugging symbols found in ./chal)
Error while writing index for `/mnt/hgfs/cybersec/ctfs/alpacahack/rev/sugoi_flag_checker/sugoi-flag-checker/chal': No debugging symbols
GEF for linux ready, type `gef' to start, `gef config' to configure
93 commands loaded and 5 functions added for GDB 16.3 in 0.01ms using Python engine 3.13
gef➤  info functions
All defined functions:

Non-debugging symbols:
0x0000000000001000  _inita
0x0000000000001090  __cxa_finalize@plt
0x00000000000010a0  puts@plt
0x00000000000010b0  __stack_chk_fail@plt
0x00000000000010c0  printf@plt
0x00000000000010d0  strcspn@plt
0x00000000000010e0  fgets@plt
0x00000000000010f0  strcmp@plt
0x0000000000001100  _start
0x0000000000001130  deregister_tm_clones
0x0000000000001160  register_tm_clones
0x00000000000011a0  __do_global_dtors_aux
0x00000000000011e0  frame_dummy
0x00000000000011e9  key_expansion
0x00000000000014a8  add_round_key
0x000000000000154d  xtime
0x000000000000157e  inv_mix_columns
0x0000000000001d4c  inv_sub_bytes
0x0000000000001dc8  inv_shift_rows
0x0000000000001ea7  inv_cipher
0x0000000000001f1e  init_cipher
0x0000000000001f48  decrypt_block
0x0000000000001f72  read_flag_input
0x0000000000001feb  main
0x0000000000002170  _fini
```

Important functions we can see:

- `strcmp@plt` - Where the comparison happens
- `decrypt_block` - Decrypts the flag
- `main` - Main program logic

```bash
gef➤  disas main
Dump of assembler code for function main:
   0x0000000000001feb <+0>:     endbr64
   0x0000000000001fef <+4>:     push   rbp
   0x0000000000001ff0 <+5>:     mov    rbp,rsp
   0x0000000000001ff3 <+8>:     sub    rsp,0x180
   0x0000000000001ffa <+15>:    mov    rax,QWORD PTR fs:0x28
   0x0000000000002003 <+24>:    mov    QWORD PTR [rbp-0x8],rax
   0x0000000000002007 <+28>:    xor    eax,eax
   0x0000000000002009 <+30>:    mov    QWORD PTR [rbp-0x180],0x0
   0x0000000000002014 <+41>:    lea    rax,[rip+0x124f]        # 0x326a
   0x000000000000201b <+48>:    mov    rdi,rax
   0x000000000000201e <+51>:    mov    eax,0x0
   0x0000000000002023 <+56>:    call   0x10c0 <printf@plt>
   0x0000000000002028 <+61>:    lea    rdx,[rbp-0x180]
   0x000000000000202f <+68>:    lea    rax,[rbp-0x90]
   0x0000000000002036 <+75>:    mov    esi,0x80
   0x000000000000203b <+80>:    mov    rdi,rax
   0x000000000000203e <+83>:    call   0x1f72 <read_flag_input>
   0x0000000000002043 <+88>:    xor    eax,0x1
   0x0000000000002046 <+91>:    test   al,al
   0x0000000000002048 <+93>:    je     0x2054 <main+105>
   0x000000000000204a <+95>:    mov    eax,0x1
   0x000000000000204f <+100>:   jmp    0x215a <main+367>
   0x0000000000002054 <+105>:   mov    rax,QWORD PTR [rbp-0x180]
   0x000000000000205b <+112>:   mov    edx,0x20
   0x0000000000002060 <+117>:   cmp    rax,rdx
   0x0000000000002063 <+120>:   je     0x207e <main+147>
   0x0000000000002065 <+122>:   lea    rax,[rip+0x1205]        # 0x3271
   0x000000000000206c <+129>:   mov    rdi,rax
   0x000000000000206f <+132>:   call   0x10a0 <puts@plt>
   0x0000000000002074 <+137>:   mov    eax,0x0
   0x0000000000002079 <+142>:   jmp    0x215a <main+367>
   0x000000000000207e <+147>:   mov    rax,QWORD PTR [rip+0x11bb]        # 0x3240 <ciphertext>                                                                                            
   0x0000000000002085 <+154>:   mov    rdx,QWORD PTR [rip+0x11bc]        # 0x3248 <ciphertext+8>                                                                                          
   0x000000000000208c <+161>:   mov    QWORD PTR [rbp-0xc0],rax
   0x0000000000002093 <+168>:   mov    QWORD PTR [rbp-0xb8],rdx
   0x000000000000209a <+175>:   mov    rax,QWORD PTR [rip+0x11af]        # 0x3250 <ciphertext+16>                                                                                         
   0x00000000000020a1 <+182>:   mov    rdx,QWORD PTR [rip+0x11b0]        # 0x3258 <ciphertext+24>                                                                                         
   0x00000000000020a8 <+189>:   mov    QWORD PTR [rbp-0xb0],rax
   0x00000000000020af <+196>:   mov    QWORD PTR [rbp-0xa8],rdx
   0x00000000000020b6 <+203>:   lea    rax,[rbp-0x170]
   0x00000000000020bd <+210>:   lea    rdx,[rip+0x116c]        # 0x3230 <key>
   0x00000000000020c4 <+217>:   mov    rsi,rdx
   0x00000000000020c7 <+220>:   mov    rdi,rax
   0x00000000000020ca <+223>:   call   0x1f1e <init_cipher>
   0x00000000000020cf <+228>:   mov    QWORD PTR [rbp-0x178],0x0
   0x00000000000020da <+239>:   jmp    0x2107 <main+284>
   0x00000000000020dc <+241>:   lea    rdx,[rbp-0xc0]
   0x00000000000020e3 <+248>:   mov    rax,QWORD PTR [rbp-0x178]
   0x00000000000020ea <+255>:   add    rdx,rax
   0x00000000000020ed <+258>:   lea    rax,[rbp-0x170]
   0x00000000000020f4 <+265>:   mov    rsi,rdx
   0x00000000000020f7 <+268>:   mov    rdi,rax
   0x00000000000020fa <+271>:   call   0x1f48 <decrypt_block>
   0x00000000000020ff <+276>:   add    QWORD PTR [rbp-0x178],0x10
   0x0000000000002107 <+284>:   cmp    QWORD PTR [rbp-0x178],0x1f
   0x000000000000210f <+292>:   jbe    0x20dc <main+241>
   0x0000000000002111 <+294>:   mov    BYTE PTR [rbp-0xa0],0x0
   0x0000000000002118 <+301>:   lea    rdx,[rbp-0xc0]
   0x000000000000211f <+308>:   lea    rax,[rbp-0x90]
   0x0000000000002126 <+315>:   mov    rsi,rdx
   0x0000000000002129 <+318>:   mov    rdi,rax
   0x000000000000212c <+321>:   call   0x10f0 <strcmp@plt>
   0x0000000000002131 <+326>:   test   eax,eax
   0x0000000000002133 <+328>:   jne    0x2146 <main+347>
   0x0000000000002135 <+330>:   lea    rax,[rip+0x113e]        # 0x327a
   0x000000000000213c <+337>:   mov    rdi,rax
   0x000000000000213f <+340>:   call   0x10a0 <puts@plt>
   0x0000000000002144 <+345>:   jmp    0x2155 <main+362>
   0x0000000000002146 <+347>:   lea    rax,[rip+0x1124]        # 0x3271
   0x000000000000214d <+354>:   mov    rdi,rax
   0x0000000000002150 <+357>:   call   0x10a0 <puts@plt>
   0x0000000000002155 <+362>:   mov    eax,0x0
   0x000000000000215a <+367>:   mov    rdx,QWORD PTR [rbp-0x8]
   0x000000000000215e <+371>:   sub    rdx,QWORD PTR fs:0x28
   0x0000000000002167 <+380>:   je     0x216e <main+387>
   0x0000000000002169 <+382>:   call   0x10b0 <__stack_chk_fail@plt>
   0x000000000000216e <+387>:   leave
   0x000000000000216f <+388>:   ret
End of assembler dump.
```

Key instruction at `main+321` Just before this, at `main+315` and `main+318`:

```bash
0x0000000000002126 <+315>:   mov    rsi,rdx    # enc_flag (decrypted)
0x0000000000002129 <+318>:   mov    rdi,rax    # input_flag (our input)
0x000000000000212c <+321>:   call   0x10f0 <strcmp@plt>
```

The key is to break at `strcmp` **after** the flag has been decrypted:

```c

gef➤  start

gef➤  break strcmp

gef➤  continue
flag: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

We input 32 'A's to pass the length check. When the breakpoint hits at `strcmp`, we can examine the arguments:

```bash
gef➤  x/s $rdi
0x7fffffffdb10: 'A' <repeats 32 times>
gef➤  x/s $rsi
0x7fffffffdae0: "Alpaca{m3ccha_rand0m_5b0x_d4yo!}"
gef➤  
```

## Flag

`Alpaca{m3ccha_rand0m_5b0x_d4yo!}`