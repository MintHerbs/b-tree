# System Calls, Part 1

## 3.1 What is a System Call?

A system call is a function that lives inside the OS kernel. Unlike a regular library function (like `printf`), a system call crosses the boundary between user space and kernel space to request something only the OS can do, such as creating a process, reading a file at the hardware level, or checking the time.

You look up system calls in section 2 of the manual:

```
man 2 getpid
man 2 gettimeofday
```

---

## 3.2 Process IDs - getpid and getppid

Every running process is given a unique integer called a PID (Process ID). Its parent (the process that created it) has its own PID, which the child can read with `getppid()`.

```c
/* Lab 4, Q1 */
#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
    printf("My PID        : %d\n", getpid());
    printf("My parent PID : %d\n", getppid());

    /* sleep(5) keeps the process alive long enough for you
       to open a second terminal and run: ps -a
       to verify the PID shown matches what this program prints */
    sleep(5);

    return 0;
}
```

> **Tip:** Run this in one terminal. While it sleeps, open a second terminal and type `ps -a`. Find the process name in the list and confirm its PID matches what the program printed.

---

## 3.3 Timing with gettimeofday

`gettimeofday()` fills a `struct timeval` with the current time. The struct has two fields: `tv_sec` (seconds since 1 Jan 1970) and `tv_usec` (microseconds within that second). To measure elapsed time, call it twice and subtract.

```c
/* Lab 4, Q2 and Q3 */
#include <stdio.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

/* Compute X raised to power n without using pow() */
float Power(float X, int n) {
    int i;
    float result = 1.0;
    for (i = 0; i < n; i++) {
        result *= X;
    }
    return result;
}

int main() {
    struct timeval start, now;
    long elapsed_ms;
    int j;

    gettimeofday(&start, NULL);   /* record start time */

    /* Lab 4, Q3: loop, sleep 2 s, then display elapsed time */
    for (j = 0; j < 5; j++) {
        sleep(2);
        gettimeofday(&now, NULL);

        /* elapsed in milliseconds */
        elapsed_ms = (now.tv_sec  - start.tv_sec)  * 1000
                   + (now.tv_usec - start.tv_usec) / 1000;

        printf("Program with pid %d has run for %ld milliseconds.\n",
               getpid(), elapsed_ms);
    }
    return 0;
}
```

---