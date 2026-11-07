---
title: "Daily AlpacaHack: Twilight"
description: 'This is my write up solving daily challenge from AlpacaHack'
date: 2025-12-20
tags: ["Reverse Engineering", "AlpacaHack", "Writeup"]
image: 'https://pbs.twimg.com/media/G7Axcw8bIAE1vR5.jpg'
authors: ['chjwoo']
draft: false
---

Hello! I’m a bit late to solving this challenge, but I’d like to share my thought process and walk through how I approached it.

## Description

```markdown
Twilight
Rev

Author: kanon

at twilight...

https://alpacahack.com/daily/challenges/twilight
```

### Initial Analysis

First, we download the challenge file and extract it locally. After inspecting the binary, we can confirm that the challenge file is a **64-bit ELF executable**, and we are also provided with an `out.txt` file containing what appears to be an encrypted flag.

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/rev/twilight/twilight]
└─$ file chall 
chall: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=cad54f8480fb7120a6bf06f1647f1801e946a02c, for GNU/Linux 3.2.0, not stripped

┌──(chjwoo㉿hackbox)-[~/…/alpacahack/rev/twilight/twilight]
└─$ cat out.txt
0x41, 0x6D, 0x72, 0x62, 0x67, 0x64, 0x81, 0x46, 0x74, 0x79, 0x6B, 0x68, 0x6D, 0x45, 0x6F, 0x6C, 0x7B, 0x4E, 0x7B, 0x7D, 0x73, 0x42, 0x85, 0x79, 0x7C, 0x7C, 0x8C, 0x77, 0x7D, 0x73, 0x82, 0x62, 
  
```

The contents of `out.txt` reveal a list of hexadecimal values, which likely represent the encrypted flag. At this point, we know:

- The binary is a 64-bit ELF file
- `out.txt` most likely contains the encrypted output of the flag

Before diving deeper, we attempt a quick **string extraction** to see if anything useful stands out.

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/rev/twilight/twilight]
└─$ strings chall
/lib64/ld-linux-x86-64.so.2
__cxa_finalize
__libc_start_main
strlen
__isoc99_scanf
putchar
__stack_chk_fail
printf
libc.so.6
GLIBC_2.7
GLIBC_2.4
GLIBC_2.34
GLIBC_2.2.5
_ITM_deregisterTMCloneTable
__gmon_start__
_ITM_registerTMCloneTable
PTE1
u+UH
Enter the flag: 
%33s
0x%X, 
:*3$"
GCC: (Ubuntu 11.4.0-1ubuntu1~22.04.2) 11.4.0
Scrt1.o
__abi_tag
crtstuff.c
deregister_tm_clones
__do_global_dtors_aux
completed.0
__do_global_dtors_aux_fini_array_entry
frame_dummy
__frame_dummy_init_array_entry
chall.c
__FRAME_END__
_DYNAMIC
__GNU_EH_FRAME_HDR
_GLOBAL_OFFSET_TABLE_
putchar@GLIBC_2.2.5
__libc_start_main@GLIBC_2.34
_ITM_deregisterTMCloneTable
_edata
_fini
strlen@GLIBC_2.2.5
__stack_chk_fail@GLIBC_2.4
printf@GLIBC_2.2.5
__data_start
__gmon_start__
__dso_handle
_IO_stdin_used
_end
__bss_start
main
__isoc99_scanf@GLIBC_2.7
__TMC_END__
_ITM_registerTMCloneTable
__cxa_finalize@GLIBC_2.2.5
_init
.symtab
.strtab
.shstrtab
.interp
.note.gnu.property
.note.gnu.build-id
.note.ABI-tag
.gnu.hash
.dynsym
.dynstr
.gnu.version
.gnu.version_r
.rela.dyn
.rela.plt
.init
.plt.got
.plt.sec
.text
.fini
.rodata
.eh_frame_hdr
.eh_frame
.init_array
.fini_array
.dynamic
.data
.bss
.comment

```

Unfortunately, nothing particularly interesting appears in the output. With no obvious clues from strings, we proceed to **static analysis**.

### Static Analysis

We load the binary into **Ghidra** and begin by analyzing the `main` function.

```c

undefined8 main(void)

{
  uint out_flag;
  size_t len_flag;
  long in_FS_OFFSET;
  int counter;
  code *local_58 [2];
  char input_flag [40];
  long local_20;
  
  local_20 = *(long *)(in_FS_OFFSET + 0x28);
  printf("Enter the flag: ");
  __isoc99_scanf(&DAT_00102015,input_flag);
  local_58[0] = a;
  local_58[1] = b;
  counter = 0;
  while( true ) {
    len_flag = strlen(input_flag);
    if (len_flag <= (ulong)(long)counter) break;
    out_flag = (*local_58[counter % 2])(input_flag[counter],counter);
    printf("0x%X, ",(ulong)out_flag);
    counter = counter + 1;
  }
  putchar(10);
  if (local_20 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}

```

To make the analysis clearer, several variables were renamed. From this function, we can identify the following key points:

- The user input is stored in a **40-byte buffer**
- Two functions are used: `a` and `b`
- These functions are stored in an array and called alternately
- The loop iterates over each character of the input
- If the index is even, function `a` is called
- If the index is odd, function `b` is called
- Each processed character is printed as a hexadecimal value

Next, we inspect both helper functions.

```c

int a(int param_1,int param_2)

{
  return param_2 + param_1;
}

uint b(uint param_1,uint param_2)

{
  return param_1 ^ param_2;
}

```

Function Behavior

- **Function `a`** performs simple addition between the character and its index
- **Function `b`** performs an XOR operation between the character and its index

This alternating logic explains how the encrypted values in `out.txt` were generated.

## Solution

To recover the original flag, we reverse each operation:

- For function `a`, we subtract the index instead of adding it
- For function `b`, we apply XOR again, which naturally reverses the operation

Based on this logic, we write a solver script.

```python
enc_flag = [0x41, 0x6D, 0x72, 0x62, 0x67, 0x64, 0x81, 0x46, 0x74, 0x79, 0x6B, 0x68, 0x6D, 0x45, 0x6F, 0x6C, 0x7B, 0x4E, 0x7B, 0x7D, 0x73, 0x42, 0x85, 0x79, 0x7C, 0x7C, 0x8C, 0x77, 0x7D, 0x73, 0x82, 0x62]

def fun_a(flag_index, counter):
    return flag_index - counter

def fun_b(flag_index, counter):
    return counter ^ flag_index

def decode_flag(enc_flag):
    flag = []

    for i in range(len(enc_flag)):
        if i % 2 == 0:
            flag.append(fun_a(enc_flag[i], i))
        else:
            flag.append(fun_b(enc_flag[i], i))

    return bytes(flag)

if __name__ == "__main__":
    flag = decode_flag(enc_flag)
    print(flag.decode())
```

Running the solver produces the original flag:

```bash
┌──(chjwoo㉿hackbox)-[~/…/alpacahack/rev/twilight/twilight]
└─$ python solver.py
Alpaca{AlpacaHack_in_Wonderland}
```

## Flag

`Alpaca{AlpacaHack_in_Wonderland}`