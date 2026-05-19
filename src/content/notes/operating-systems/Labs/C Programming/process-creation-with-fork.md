# Process Creation with fork()

## 6.1 What is fork()?

Think of `fork()` as a photocopier. When you call it, the OS takes your running process and makes a perfect duplicate. Both copies continue running from the exact same line of code, with the same variables and the same open files. The only difference is the return value of `fork()` itself.

```
Before fork()        After fork()
--------------       ----------------------------------
  Parent             Parent           Child (copy)
  [code]      --->   [code]           [code]
  [data]             [data]    +      [data]   (separate copy)
  [stack]            [stack]          [stack]
```

The return value is how you tell who is who:

| Where | `fork()` returns |
|-------|-----------------|
| In the parent | PID of the child (a positive integer) |
| In the child | `0` |
| On error | `-1` |

---

## 6.2 Basic fork() Example

```c
/* Basic fork example - Lab 6, Q1 */
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/types.h>

int main() {
    pid_t pid;
    int j;

    pid = fork();

    if (pid == 0) {
        /* CHILD */
        for (j = 0; j < 5; j++) {
            sleep(1);
            printf("Child  PID=%d  Parent PID=%d\n",
                   getpid(), getppid());
        }
    } else if (pid > 0) {
        /* PARENT */
        for (j = 0; j < 5; j++) {
            sleep(1);
            printf("Parent PID=%d  Child  PID=%d\n",
                   getpid(), pid);
        }
        wait(NULL);   /* wait for child to finish - prevents zombie */
        printf("Parent: child has exited.\n");
    } else {
        perror("fork failed");
        return 1;
    }
    return 0;
}
```

> **Note:** Always call `wait()` or `waitpid()` in the parent to collect the child's exit status. A child that has finished but whose status has not been collected is called a **zombie process**. It does not consume CPU but wastes a process table entry.

---

## Step 3 - Add File I/O to the Question

Now Child 2 writes to a file when f(x) is even. The file is created if it does not exist, or appended to if it does.

```c
/* ---- STEP 3: File I/O in Child 2 (even branch) ---------------------- */
/* Add these includes at the top: */
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

/* Inside Child 2, after computing flag: */
if (flag == 1) {
    int fd;
    char line[64];
    int len;

    /* Create if absent, append if present */
    fd = open("results.dat",
              O_WRONLY | O_CREAT | O_APPEND,
              S_IRWXU);

    if (fd == -1) {
        perror("open failed");
        exit(1);
    }

    len = snprintf(line, sizeof(line),
                   "f(%.2f) = %.4f\n", qd.x, qd.result);
    write(fd, line, len);
    close(fd);
    printf("Result is EVEN - written to results.dat\n");
}
```

---