# Pipes

## 5.1 What is a Pipe?

Imagine a physical pipe connecting two rooms. One person in Room A pushes notes through one end of the pipe. A person in Room B reaches in at the other end and reads them. Data only flows one way. This is exactly what a Unix pipe is: a one-way, in-kernel communication channel between two processes.

```
  Process A                              Process B
  (parent)                               (child)
     |                                      |
     | write(fd[1], ...)                    | read(fd[0], ...)
     v                                      v
  [fd[1]] ====== PIPE BUFFER ====== [fd[0]]
  write end                         read end
```

The `pipe()` system call returns two file descriptors:
- `fd[0]` - read end
- `fd[1]` - write end

**Critical rule:** Each process must close the end it does not use. If the write end stays open in the reading process, `read()` will never see EOF and will block forever, waiting for data that never comes.

---

## 5.2 Basic Pipe Example

The parent writes a message; the child reads and prints it.

```c
/* Basic pipe example */
#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main() {
    int fd[2];
    char buf[64];
    int n;
    int p;

    pipe(fd);   /* create the pipe before forking */

    p = fork();

    if (p == 0) {
        /* CHILD: only reads, so close the write end */
        close(fd[1]);
        n = read(fd[0], buf, sizeof(buf));
        buf[n] = '\0';
        printf("Child received: %s\n", buf);
        close(fd[0]);
    } else {
        /* PARENT: only writes, so close the read end */
        close(fd[0]);
        write(fd[1], "Hello from parent", 18);
        close(fd[1]);
    }
    return 0;
}
```

> **Note:** `pipe()` must be called before `fork()`. After the fork, both parent and child have copies of both file descriptors. Each must close the end it will not use.

---

## Step 2 - Add 3 Pipes to the Question

We now extend the quadratic program. Pipe 1 sends the raw `QuadData` struct from the parent to Child 1. Pipe 2 sends the evaluated result from Child 1 to Child 2. Pipe 3 sends the even/odd flag and the result back to the parent.

```c
/* ---- STEP 2: 3 Pipes + fork ----------------------------------------- */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

struct QuadData { double x; double result; };

void evaluate(struct QuadData *data) {
    double x = data->x;
    data->result = (2*x*x) + (2*x) - 5;
}

int isEven(double val) {
    int iv = (int)val;
    return ((double)iv == val && iv % 2 == 0) ? 1 : 0;
}

int main() {
    int p1[2], p2[2], p3[2];
    struct QuadData qd;
    int flag;
    pid_t c1, c2;

    pipe(p1); pipe(p2); pipe(p3);

    printf("Enter x: ");
    scanf("%lf", &qd.x);

    /* ---- Fork Child 1 ---- */
    c1 = fork();
    if (c1 == 0) {
        /* Child 1: read from p1, evaluate, write to p2 */
        close(p1[1]); close(p2[0]);
        close(p3[0]); close(p3[1]);

        read(p1[0], &qd, sizeof(qd));
        evaluate(&qd);
        write(p2[1], &qd, sizeof(qd));

        close(p1[0]); close(p2[1]);
        exit(0);
    }

    /* ---- Fork Child 2 ---- */
    c2 = fork();
    if (c2 == 0) {
        /* Child 2: read from p2, check even/odd, write flag + data to p3 */
        close(p1[0]); close(p1[1]);
        close(p2[1]); close(p3[0]);

        read(p2[0], &qd, sizeof(qd));
        flag = isEven(qd.result);

        write(p3[1], &flag, sizeof(flag));
        write(p3[1], &qd,   sizeof(qd));

        close(p2[0]); close(p3[1]);
        exit(0);
    }

    /* ---- Parent ---- */
    close(p1[0]);
    close(p2[0]); close(p2[1]);
    close(p3[1]);

    write(p1[1], &qd, sizeof(qd));
    close(p1[1]);

    read(p3[0], &flag, sizeof(flag));
    read(p3[0], &qd,   sizeof(qd));
    close(p3[0]);

    printf("f(%.2f) = %.4f  [%s]\n",
           qd.x, qd.result, flag ? "EVEN" : "ODD");

    wait(NULL); wait(NULL);
    return 0;
}
```

---