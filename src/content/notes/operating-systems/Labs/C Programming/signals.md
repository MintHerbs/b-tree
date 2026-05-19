# Signals

## 7.1 What are Signals?

Imagine you are working in a kitchen. Suddenly the fire alarm sounds. You stop what you are doing immediately, follow the fire procedure (your signal handler), and then - if everything is fine - go back to cooking. Signals work exactly like this. The OS interrupts your program at any point, runs your registered handler function, and then returns control to where the program was (unless the handler exits).

Common signals you will use in the lab:

| Signal | When it fires |
|--------|--------------|
| `SIGALRM` | When `alarm()` or `setitimer()` expires |
| `SIGUSR1` | User-defined, sent manually with `kill()` |
| `SIGUSR2` | User-defined, sent manually with `kill()` |
| `SIGFPE` | Arithmetic error, e.g., division by zero |
| `SIGKILL` | Force-kill a process, cannot be caught |
| `SIGTERM` | Politely ask a process to terminate |

---

## 7.2 Registering a Handler with sigaction

The labsheet recommends `sigaction()` over the older `signal()` function for reliable, portable behaviour. `SA_RESTART` means that if the signal interrupted a blocking system call (like `read()`), that call restarts automatically instead of returning an error.

```c
/* Lab 7, Q1 - type this, compile, and run it */
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <stdlib.h>

void funct1(int sig) {
    printf("Alarm triggered\n");
    exit(0);
}

int main() {
    struct sigaction sa;
    sa.sa_handler = &funct1;
    sa.sa_flags   = SA_RESTART;
    sigaction(SIGALRM, &sa, NULL);

    alarm(5);    /* fire SIGALRM in 5 seconds */
    printf("Waiting...\n");
    pause();     /* suspend until a signal arrives */

    return 0;
}
```

---

## 7.3 Common Signal Functions

**alarm(n):** Schedule a `SIGALRM` in `n` seconds. Calling `alarm(0)` cancels any pending alarm.

**kill(pid, sig):** Send signal `sig` to process `pid`. Despite the name, most signals do not kill, they just notify. Used in Lab 7 to exchange signals between parent and child processes.

**raise(sig):** Send a signal to your own process (equivalent to `kill(getpid(), sig)`).

**pause():** Suspend the process until any signal is received.

**Sending signals between parent and child (Lab 7, Q5 style):**

```c
/* Parent knows the child's PID because fork() returned it */
pid_t child_pid = fork();
if (child_pid > 0) {
    sleep(1);                       /* give child time to register its handler */
    kill(child_pid, SIGUSR1);       /* send SIGUSR1 to child */
}

/* Child knows the parent's PID via getppid() */
if (child_pid == 0) {
    signal(SIGUSR1, myHandler);
    pause();
    kill(getppid(), SIGUSR2);       /* send SIGUSR2 back to parent */
}
```

---

## Step 4 - Enforce 2-Second Timeout for Odd Results

When f(x) is odd, the result must be printed within 2 seconds. An alarm is set before printing. If printing completes in time, the alarm is cancelled. If the process somehow takes longer than 2 seconds, the handler fires and exits.

```c
/* ---- STEP 4: 2-Second Timeout for Odd Branch ------------------------ */
#include <signal.h>

void timeoutHandler(int sig) {
    printf("\n[TIMEOUT] Display took more than 2 seconds. Exiting.\n");
    exit(1);
}

/* In the PARENT, after receiving the result from pipe 3: */
if (flag == 0) {
    struct sigaction sa;
    sa.sa_handler = &timeoutHandler;
    sa.sa_flags   = SA_RESTART;
    sigaction(SIGALRM, &sa, NULL);

    alarm(2);   /* set 2-second deadline */

    printf("f(%.2f) = %.4f  [ODD - displayed on terminal]\n",
           qd.x, qd.result);

    alarm(0);   /* cancel alarm - we finished in time */
}
```

---