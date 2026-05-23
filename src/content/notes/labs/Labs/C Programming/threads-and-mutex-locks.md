# Threads and Mutex Locks

## 8.1 Threads vs Processes

Processes created with `fork()` are independent: they get their own copy of memory and cannot easily share variables. Threads are different. All threads within one program share the same memory. Think of processes as separate houses, and threads as people living in the same house - they can all use the same kitchen.

| Feature | Process (fork) | Thread (pthread) |
|---------|---------------|------------------|
| Memory | Separate copy | Shared |
| Creation cost | Heavy | Light |
| Communication | Pipes, files | Shared variables |
| Isolation | High | Low - race conditions possible |

---

## 8.2 Creating Threads

```c
/* Lab 5, Q2 style - two threads, one for names, one for IDs */
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

void *showNames(void *arg) {
    char *names[] = {"Alice", "Bob", "Carol", "Dave"};
    int i;
    for (i = 0; i < 4; i++)
        printf("Name: %s\n", names[i]);
    pthread_exit(NULL);
}

void *showIDs(void *arg) {
    char *ids[] = {"S001", "S002", "S003", "S004"};
    int i;
    for (i = 0; i < 4; i++)
        printf("ID: %s\n", ids[i]);
    pthread_exit(NULL);
}

int main() {
    pthread_t t1, t2;

    pthread_create(&t1, NULL, showNames, NULL);
    pthread_create(&t2, NULL, showIDs,   NULL);

    sleep(5);
    printf("Parent Thread Exiting\n");
    pthread_exit(NULL);   /* use pthread_exit in main so children can finish */
}

/* Compile: gcc prog.c -lpthread -o prog */
```

> **Note:** Use `pthread_exit(NULL)` in `main()` instead of `return 0`. If `main` returns, the entire process exits immediately and any threads still running are killed.

---

## 8.3 Mutex Locks - The Baker Analogy

Imagine a bakery with two bakers who share a single jar of sugar. The jar has only one key. Before any baker can scoop sugar, they must pick up the key. While one baker holds the key and is using the jar, the other baker must wait by the shelf. When the first baker is done, they put the key back - now the second baker can grab it.

The "jar of sugar" is your shared variable. The "key" is the mutex lock.

Without the mutex, both bakers might try to scoop at the same time. One reads the current weight, the other reads the same weight, and both add their amount on top of the same starting value. The result is wrong. This is a **race condition**.

```c
/* Lab 5, Q5 - shared counter protected by mutex */
#include <stdio.h>
#include <pthread.h>

int shared_counter = 0;

/* The jar's key - only one thread can hold this at a time */
pthread_mutex_t jar_key = PTHREAD_MUTEX_INITIALIZER;

void *baker(void *arg) {
    int i;
    char *name = (char *)arg;

    for (i = 0; i < 5; i++) {
        /* Baker picks up the key - waits if another baker has it */
        pthread_mutex_lock(&jar_key);

        /* Only this baker can touch the jar right now */
        shared_counter++;
        printf("%s incremented counter to %d\n", name, shared_counter);

        /* Baker puts the key back */
        pthread_mutex_unlock(&jar_key);
    }
    pthread_exit(NULL);
}

int main() {
    pthread_t baker1, baker2;

    pthread_create(&baker1, NULL, baker, (void *)"Baker 1");
    pthread_create(&baker2, NULL, baker, (void *)"Baker 2");

    pthread_join(baker1, NULL);
    pthread_join(baker2, NULL);

    printf("Final counter: %d\n", shared_counter);  /* should be 10 */
    return 0;
}
```

> **Note:** Without the mutex, the final counter would often be less than 10 because both threads can read the same value before either writes back. The mutex ensures that only one thread is inside the critical section at any point in time.

---

## 8.4 Passing Arguments to Threads

Values are passed to a thread function via the last argument of `pthread_create()`. It is cast to `void *` and then cast back inside the thread function.

```c
/* Lab 5, Q4 - pass a count to each thread */
#include <stdio.h>
#include <pthread.h>

void *printNames(void *arg) {
    int count = *((int *)arg);   /* cast void* back to int* then dereference */
    char *names[] = {"Alice", "Bob", "Carol", "Dave", "Eve",
                     "Frank", "Grace", "Hank", "Iris", "Jake"};
    int i;
    for (i = 0; i < count; i++)
        printf("Name: %s\n", names[i]);
    pthread_exit(NULL);
}

int main() {
    pthread_t t1;
    int n = 3;

    /* Pass address of n - thread receives it as void* */
    pthread_create(&t1, NULL, printNames, (void *)&n);

    pthread_join(t1, NULL);
    return 0;
}
```

---

## Step 5 - Final Complete Program (All Concepts Combined)

This is the complete program combining structs, pipes, fork, file I/O, signals, threads, and a mutex-protected logger.

```c
/* ========= FINAL COMPLETE PROGRAM =====================================
   f(x) = 2x^2 + 2x - 5
   - 3 pipes between parent and 2 children
   - Even result  ->  file (append or create)
   - Odd result   ->  terminal with 2-second timeout (signal)
   - Logger thread records every computation, protected by mutex

   Compile: gcc quad.c -lpthread -o quad
   ===================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <pthread.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

/* ---- Shared struct ---- */
struct QuadData { double x; double result; };

/* ---- Logger thread data ---- */
struct LogData {
    double x;
    double result;
    int    isEven;
};

/* The logger's jar key - only one thread logs at a time */
pthread_mutex_t logLock = PTHREAD_MUTEX_INITIALIZER;

/* ---- Formula ---- */
void evaluate(struct QuadData *d) {
    d->result = (2 * d->x * d->x) + (2 * d->x) - 5;
}

int checkEven(double val) {
    int iv = (int)val;
    return ((double)iv == val && iv % 2 == 0) ? 1 : 0;
}

/* ---- Logger thread function ---- */
void *logger(void *arg) {
    struct LogData *ld = (struct LogData *)arg;

    pthread_mutex_lock(&logLock);   /* baker picks up the key */

    FILE *log = fopen("log.txt", "a");
    if (log) {
        fprintf(log, "x=%.2f result=%.4f %s\n",
                ld->x, ld->result,
                ld->isEven ? "EVEN" : "ODD");
        fclose(log);
    }

    pthread_mutex_unlock(&logLock); /* baker puts the key back */

    free(ld);
    pthread_exit(NULL);
}

/* ---- Timeout handler ---- */
void timeoutHandler(int sig) {
    write(STDOUT_FILENO, "[TIMEOUT] Over 2 seconds!\n", 26);
    exit(1);
}

int main() {
    int p1[2], p2[2], p3[2];
    struct QuadData qd;
    int flag;
    pid_t c1, c2;
    struct LogData *ld;
    pthread_t logTid;

    pipe(p1); pipe(p2); pipe(p3);

    printf("Enter x: ");
    scanf("%lf", &qd.x);

    /* ---- Child 1: receive input, evaluate, forward ---- */
    c1 = fork();
    if (c1 == 0) {
        close(p1[1]); close(p2[0]);
        close(p3[0]); close(p3[1]);

        read(p1[0], &qd, sizeof(qd));
        evaluate(&qd);
        write(p2[1], &qd, sizeof(qd));

        close(p1[0]); close(p2[1]);
        exit(0);
    }

    /* ---- Child 2: receive result, handle even/odd ---- */
    c2 = fork();
    if (c2 == 0) {
        close(p1[0]); close(p1[1]);
        close(p2[1]); close(p3[0]);

        read(p2[0], &qd, sizeof(qd));
        flag = checkEven(qd.result);

        if (flag) {  /* EVEN - write to file */
            int fd;
            char line[64];
            int len;

            fd = open("results.dat",
                      O_WRONLY | O_CREAT | O_APPEND,
                      S_IRWXU);
            len = snprintf(line, 64, "f(%.2f)=%.4f\n",
                           qd.x, qd.result);
            write(fd, line, len);
            close(fd);
        }

        write(p3[1], &flag, sizeof(flag));
        write(p3[1], &qd,   sizeof(qd));

        close(p2[0]); close(p3[1]);
        exit(0);
    }

    /* ---- Parent: send input, receive result ---- */
    close(p1[0]);
    close(p2[0]); close(p2[1]);
    close(p3[1]);

    write(p1[1], &qd, sizeof(qd));
    close(p1[1]);

    read(p3[0], &flag, sizeof(flag));
    read(p3[0], &qd,   sizeof(qd));
    close(p3[0]);

    /* ---- Logger thread ---- */
    ld = (struct LogData *)malloc(sizeof(struct LogData));
    ld->x = qd.x;
    ld->result = qd.result;
    ld->isEven = flag;
    pthread_create(&logTid, NULL, logger, (void *)ld);

    /* ---- ODD: print on terminal within 2 seconds ---- */
    if (flag == 0) {
        struct sigaction sa;
        sa.sa_handler = timeoutHandler;
        sa.sa_flags   = SA_RESTART;
        sigaction(SIGALRM, &sa, NULL);

        alarm(2);
        printf("f(%.2f) = %.4f [ODD - terminal]\n", qd.x, qd.result);
        alarm(0);
    } else {
        printf("f(%.2f) = %.4f [EVEN - written to file]\n",
               qd.x, qd.result);
    }

    pthread_join(logTid, NULL);
    wait(NULL); wait(NULL);
    return 0;
}
```

---