# Introduction

Section 1 establishes the fundamental programming concepts of C. 
C is heavily used in operating systems because it allows direct interaction with hardware, and it powers some of the most demanding software in existence, from the Linux kernel to the flight systems that send rockets into space.

After Section 1, a robust, exam-level question is introduced. It implements every concept covered in this part into a single, cohesive codebase. The approach is gradual: each new topic, whether process creation, signals, or threading, is explained on its own first, then woven into the question step by step, so by the end you have one program that does it all.

----

#  C Fundamentals

This section covers the core C building blocks used throughout the labsheets: I/O, conditionals, loops, functions, pointers, arrays, strings, structs, and dynamic memory.

---

## 1.1 Basic Input and Output

In C, `printf` is used for output and `scanf` for input. Unlike C++, there are no `cin` or `cout` - you must use format specifiers to tell the functions what type of data you are working with.

| Specifier | Type |
|-----------|------|
| `%d` | int |
| `%f` | float |
| `%lf` | double |
| `%c` | char |
| `%s` | string (char array) |

```c
#include <stdio.h>

int main() {
    int age;
    float height;
    char name[30];

    printf("Enter your name: ");
    scanf("%s", name);           /* no & for arrays */

    printf("Enter your age: ");
    scanf("%d", &age);           /* & needed for non-arrays */

    printf("Enter your height (m): ");
    scanf("%f", &height);

    printf("Hello %s, you are %d years old and %.2f m tall.\n",
           name, age, height);
    return 0;
}
```

> **Note:** The `&` operator gives the address of a variable so `scanf` knows where to write the value. Arrays already decay to a pointer, so they do not need `&`.

---

## 1.2 Conditional Statements

Conditionals in C are identical to what you know from C++.

```c
#include <stdio.h>

int main() {
    int score;
    printf("Enter score: ");
    scanf("%d", &score);

    if (score >= 80) {
        printf("Grade: A\n");
    } else if (score >= 60) {
        printf("Grade: B\n");
    } else if (score >= 40) {
        printf("Grade: C\n");
    } else {
        printf("Grade: F\n");
    }
    return 0;
}
```

For the "pushed up" rule in Lab 1 (Question 6), you combine conditions using `&&` (AND) and `||` (OR):

```c
/* Pass: >40% in BOTH components */
/* Pushed up: >80% in one AND between 35-40% in the other */

float ca, exam;
float ca_pct, exam_pct;

printf("Enter CA mark (out of 50): ");
scanf("%f", &ca);
printf("Enter Exam mark (out of 100): ");
scanf("%f", &exam);

ca_pct   = (ca   / 50.0)  * 100;
exam_pct = (exam / 100.0) * 100;

if (ca_pct > 40 && exam_pct > 40) {
    printf("PASSED\n");
} else if ((ca_pct > 80 && exam_pct >= 35 && exam_pct <= 40) ||
           (exam_pct > 80 && ca_pct >= 35 && ca_pct <= 40)) {
    printf("PUSHED UP\n");
} else {
    printf("FAILED\n");
}
```

---

## 1.3 Loops

C supports `while`, `do-while`, and `for` loops. The syntax is the same as C++.

```c
#include <stdio.h>

int main() {
    int val, count = 0, sum = 0;

    /* while loop: read positive values until user enters -1 (Lab 1, Q7) */
    printf("Enter values (type -1 to stop): ");
    scanf("%d", &val);

    while (val != -1) {
        if (val % 2 == 0) {
            count++;
            sum += val;
        }
        scanf("%d", &val);
    }

    printf("Even count: %d,  Sum of evens: %d\n", count, sum);
    return 0;
}
```

```c
/* for loop: display 1 to 10 */
int i;
for (i = 1; i <= 10; i++) {
    printf("%d\n", i);
}
```

> **Note:** In C89/C90 (which your lab environment uses), variables must be declared at the top of a block, before any statements. Always declare `int i;` before your `for` loop.

---

## 1.4 Functions

Functions in C follow the same principle as C++ but reference parameters work differently. In C++, you write `int &x`. In C, you must use pointers.

```c
#include <stdio.h>
#include <math.h>

/* Function matching Lab 2, Q1: f(x) = x^4 + x^3 + 3x^2 + 2 */
double poly(int x) {
    return pow(x, 4) + pow(x, 3) + 3 * pow(x, 2) + 2;
}

int main() {
    int x;
    printf("Enter x: ");
    scanf("%d", &x);
    printf("f(%d) = %.2f\n", x, poly(x));
    return 0;
}

/* Compile with: gcc prog.c -lm -o prog */
```

When a function needs to return multiple values (like surface area AND volume), you use pointer parameters, as covered in Section 1.5.

---

## 1.5 Pointers

Think of memory as a street full of houses. Every house (variable) has an address (memory location). A pointer is a piece of paper on which you write down that address. Dereferencing the pointer (`*ptr`) means going to that address and looking at what is inside.

```
  Memory:
  [ 10 ]  at address 0x100
            ^
            |
  ptr = 0x100   (pointer holds the address)
```

```c
#include <stdio.h>

int main() {
    int x = 10;
    int *ptr = &x;   /* ptr stores the ADDRESS of x */

    printf("Value of x      : %d\n",  x);
    printf("Address of x    : %p\n",  &x);
    printf("ptr holds       : %p\n",  ptr);
    printf("Value via ptr   : %d\n",  *ptr);  /* dereference: go to address, read value */

    *ptr = 99;        /* go to that address and write 99 */
    printf("New x value     : %d\n",  x);     /* x is now 99 */

    return 0;
}
```

**Reference parameters (pass by pointer):** To let a function modify a caller's variable, pass its address.

```c
/* Swap two integers - Lab 2, Q2 */
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 5, y = 20;
    swap(&x, &y);          /* pass addresses */
    printf("x=%d, y=%d\n", x, y);   /* x=20, y=5 */
    return 0;
}
```

**Returning multiple values (Lab 2, Q3 - sphere surface area and volume):**

```c
#include <stdio.h>
#define PI 3.14159265

void sphere(double radius, double *area, double *volume) {
    *area   = 4 * PI * radius * radius;
    *volume = (4.0 / 3.0) * PI * radius * radius * radius;
}

int main() {
    double r, a, v;
    printf("Enter radius: ");
    scanf("%lf", &r);
    sphere(r, &a, &v);
    printf("Surface area: %.4f\n", a);
    printf("Volume      : %.4f\n", v);
    return 0;
}
```

> **Note:** Use `->` when accessing struct members through a pointer (`s->age`). Use `.` when accessing directly (`s.age`). More on this in Section 1.8.

---

## 1.6 Arrays

An array is a contiguous block of memory holding multiple elements of the same type. The array name is itself a pointer to the first element.

```c
#include <stdio.h>

/* Find max and min - Lab 2, Q4 */
void findMaxMin(int A[], int n, int *max, int *min) {
    int i;
    *max = A[0];
    *min = A[0];
    for (i = 1; i < n; i++) {
        if (A[i] > *max) *max = A[i];
        if (A[i] < *min) *min = A[i];
    }
}

int main() {
    int arr[10];
    int n, i, big, small;

    printf("How many values? ");
    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        printf("Enter value %d: ", i + 1);
        scanf("%d", &arr[i]);
    }

    findMaxMin(arr, n, &big, &small);
    printf("Max: %d,  Min: %d\n", big, small);
    return 0;
}
```

---

## 1.7 Strings in C

Strings in C are simply arrays of `char` terminated by a null character (`'\0'`). There is no built-in `string` type. Include `<string.h>` for functions like `strlen`, `strcpy`, `strcmp`, and `strcat`.

```c
#include <stdio.h>
#include <string.h>

int main() {
    char surname[30], firstname[30], address[100];

    /* scanf stops at whitespace, so use fgets for addresses/sentences */
    printf("Enter surname: ");
    scanf("%s", surname);

    printf("Enter first name: ");
    scanf("%s", firstname);

    /* flush the newline left in the buffer before fgets */
    getchar();
    printf("Enter address: ");
    fgets(address, sizeof(address), stdin);

    printf("\n--- Person Details ---\n");
    printf("Name   : %s %s\n",  firstname, surname);
    printf("Address: %s",       address);
    printf("Name length: %lu\n", strlen(surname));
    return 0;
}
```

> **Note:** `scanf("%s", ...)` reads one word only. Use `fgets` when the input may contain spaces.

---

## 1.8 Structs

A struct groups related variables of different types under one name. It is the foundation of complex data structures in C and is used extensively in the lab from Lab 3 onwards.

```c
#include <stdio.h>

struct Student {
    char  surname[30];
    char  firstname[30];
    int   age;
    float marks;
};

/* Pass by pointer so the function can MODIFY the struct */
void inputStudent(struct Student *s) {
    printf("Enter surname   : "); scanf("%s",  s->surname);
    printf("Enter first name: "); scanf("%s",  s->firstname);
    printf("Enter age       : "); scanf("%d", &s->age);
    printf("Enter marks     : "); scanf("%f", &s->marks);
}

/* Pass by value for display only - no modification needed */
void displayStudent(struct Student s) {
    printf("%s %s | Age: %d | Marks: %.2f\n",
           s.surname, s.firstname, s.age, s.marks);
}

int main() {
    struct Student s1, s2;

    printf("--- Student 1 ---\n");
    inputStudent(&s1);
    printf("--- Student 2 ---\n");
    inputStudent(&s2);

    /* Display the older student (Lab 3, Q1) */
    if (s1.age > s2.age) {
        printf("\nOlder student:\n");
        displayStudent(s1);
    } else if (s2.age > s1.age) {
        printf("\nOlder student:\n");
        displayStudent(s2);
    } else {
        printf("\nSame age:\n");
        displayStudent(s1);
        displayStudent(s2);
    }
    return 0;
}
```

---

## 1.9 Dynamic Memory - malloc and free

`malloc()` allocates memory on the heap at runtime. Use it when the size of data is not known at compile time, such as when declaring an array of structs whose size the user decides at runtime. Always free memory when you are done.

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, i;
    struct Student *arr;

    printf("How many students? ");
    scanf("%d", &n);

    /* Allocate n Student structs on the heap */
    arr = (struct Student *)malloc(n * sizeof(struct Student));

    if (arr == NULL) {
        printf("Memory allocation failed\n");
        return 1;
    }

    for (i = 0; i < n; i++) {
        inputStudent(&arr[i]);
    }

    for (i = 0; i < n; i++) {
        displayStudent(arr[i]);
    }

    free(arr);   /* always release heap memory when done */
    return 0;
}
```

> **Note:** `sizeof()` returns the number of bytes a type occupies. Always check that `malloc()` did not return `NULL` before using the pointer. In C, use `free()` to release memory, matching every `malloc` with exactly one `free`.

---

# The Quadratic Equation Question

## Problem Statement

Given the quadratic equation:

**f(x) = 2x^2 + 2x - 5**

Write a C program that:

- Accepts a value of x from the user and evaluates f(x).
- Creates 3 pipes for inter-process communication.
- Uses `fork()` to create child processes.
- If f(x) is even: writes the result to a file (creates if absent, appends if it exists).
- If f(x) is odd: prints it to the terminal, and must do so within 2 seconds (enforced by a signal alarm).
- Covers: pipes, fork/processes, file I/O, signals, mutex locks, and threads as topics build up.

---

## Step 1 - Base Structure (Structs and Formula)

We begin with a struct to hold input data and implement the formula evaluation. This is the core that all later steps build upon.

```c
/* ---- STEP 1: Base Structure ----------------------------------------- */
#include <stdio.h>
#include <stdlib.h>

/* Struct to hold the input and computed result */
struct QuadData {
    double x;       /* input value */
    double result;  /* f(x) = 2x^2 + 2x - 5 */
};

/* Evaluate f(x) = 2x^2 + 2x - 5 */
void evaluate(struct QuadData *data) {
    double x = data->x;
    data->result = (2 * x * x) + (2 * x) - 5;
}

/* Returns 1 if value is an even integer, 0 otherwise */
int isEven(double val) {
    int ival = (int)val;
    if ((double)ival != val) return 0;   /* not an integer */
    return (ival % 2 == 0) ? 1 : 0;
}

int main() {
    struct QuadData qd;

    printf("Enter value of x: ");
    scanf("%lf", &qd.x);

    evaluate(&qd);
    printf("f(%.2f) = %.4f\n", qd.x, qd.result);

    if (isEven(qd.result))
        printf("Result is EVEN\n");
    else
        printf("Result is ODD\n");

    return 0;
}
```

---

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

# File I/O System Calls

## 4.1 What is a File Descriptor?

The OS gives you an integer called a **file descriptor** (fd) every time you successfully open a file. It is just a number, but behind the scenes the kernel uses it to track which file you mean and where you are in it.

Three file descriptors always exist:
- `0` - standard input (keyboard)
- `1` - standard output (screen)
- `2` - standard error

When you `open()` a file, you get fd `3`, then `4`, and so on.

---

## 4.2 open and close

```c
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

/* Open for reading */
int fd = open("myfile.dat", O_RDONLY);

/* Open for writing: create if absent, overwrite if present */
int fd = open("myfile.dat", O_WRONLY | O_CREAT | O_TRUNC, S_IRWXU);

/* Open for writing: create if absent, APPEND if present */
int fd = open("myfile.dat", O_WRONLY | O_CREAT | O_APPEND, S_IRWXU);

close(fd);   /* always close when done */
```

`S_IRWXU` sets read, write, and execute permission for the file owner.

---

## 4.3 read and write

`read()` and `write()` use `void *` buffers, which means you can pass any type, including structs. The third argument is always the number of bytes, so use `sizeof()` for structs.

```c
/* Lab 4, Q4: read a text file and print it */
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    int fd, n;
    char buf[64];

    fd = open("lab44.dat", O_RDONLY);
    if (fd == -1) {
        perror("open failed");
        return 1;
    }

    /* keep reading 63 bytes at a time until read() returns 0 (EOF) */
    while ((n = read(fd, buf, 63)) > 0) {
        buf[n] = '\0';
        printf("%s", buf);
    }

    close(fd);
    return 0;
}
```

**Writing a struct to a file (Lab 4, Q8):**

```c
struct Student {
    char  name[20];
    char  id[10];
    char  dob[10];
    char  gender[7];
    char  status[10];
};

/* Write one struct */
write(fd, &s, sizeof(struct Student));

/* Read one struct */
read(fd, &s, sizeof(struct Student));
```

> **Note:** `sizeof(struct Student)` gives the exact number of bytes the struct occupies. This is why `sizeof()` is essential for binary file I/O.

---

## 4.4 lseek - Random Access

`lseek()` moves the file position pointer without reading or writing, so you can jump directly to a specific record (Lab 4, Q9).

```c
/* Jump to the 5th student record (0-indexed: record 4) */
int record_num = 4;
lseek(fd, record_num * sizeof(struct Student), SEEK_SET);
read(fd, &s, sizeof(struct Student));
```

`SEEK_SET` means the offset is measured from the beginning of the file. `SEEK_CUR` means from the current position. `SEEK_END` means from the end.

---

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

# Directory Operations

## 9.1 Creating Directories - mkdir

The `mkdir()` system call creates a new directory. The second argument is the permission mode (same format as `chmod`).

```c
/* Lab 9, Q1 */
#include <stdio.h>
#include <sys/stat.h>

int main() {
    char dirname[255];
    int val;

    printf("Enter directory name: ");
    scanf("%s", dirname);

    val = mkdir(dirname, 0777);   /* 0777 = rwxrwxrwx */

    if (val == 0)
        printf("Directory '%s' created successfully.\n", dirname);
    else
        perror("mkdir failed");

    return 0;
}
```

---

## 9.2 Reading Directory Contents - opendir, readdir, closedir

`opendir()` opens a directory and returns a `DIR *` handle. `readdir()` reads the next entry from the directory, returning a pointer to a `struct dirent`. Always `closedir()` when finished.

The `struct dirent` fields you will use most:

| Field | Type | Meaning |
|-------|------|---------|
| `d_name` | `char[256]` | Filename |
| `d_type` | `unsigned char` | `DT_REG` (file), `DT_DIR` (dir), `DT_LNK` (link), etc. |

```c
/* Lab 9, Q3 - simple ls: list current directory */
#include <stdio.h>
#include <dirent.h>

int main() {
    DIR *dir;
    struct dirent *entry;

    dir = opendir(".");   /* "." means current directory */
    if (dir == NULL) {
        perror("opendir failed");
        return 1;
    }

    while ((entry = readdir(dir)) != NULL) {
        printf("%s\n", entry->d_name);
    }

    closedir(dir);
    return 0;
}
```

**Listing a user-specified directory (Lab 9, Q4), using argc and argv:**

Programs can receive command-line arguments via `argc` (argument count) and `argv` (argument values). `argv[0]` is always the program name. `argv[1]` is the first argument, and so on.

```c
/* Compile as: gcc ls2.c -o ls2 */
/* Run as:     ./ls2 /home/user */

#include <stdio.h>
#include <dirent.h>

int main(int argc, char *argv[]) {
    DIR *dir;
    struct dirent *entry;
    char *path;

    if (argc < 2)
        path = ".";          /* default to current directory */
    else
        path = argv[1];

    dir = opendir(path);
    if (dir == NULL) {
        perror("opendir failed");
        return 1;
    }

    while ((entry = readdir(dir)) != NULL) {
        printf("%s\n", entry->d_name);
    }

    closedir(dir);
    return 0;
}
```

> **Note on `d_type` values:**
> - `DT_REG` - regular file
> - `DT_DIR` - directory
> - `DT_LNK` - symbolic link
> - `DT_FIFO` - named pipe
> - `DT_UNKNOWN` - unknown (use `stat()` to determine the type)

---

## 9.3 File Details with stat

`stat()` fills a `struct stat` with detailed information about a file: size, permissions, last modification time, and more. This is needed for the `-l` flag in Lab 9, Q5.

```c
/* Lab 9, Q5 - ls with -l option */
#include <stdio.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <string.h>

int main(int argc, char *argv[]) {
    DIR *dir;
    struct dirent *entry;
    struct stat info;
    char path[512];
    char *dirpath;
    int long_format = 0;
    int i;

    dirpath = ".";

    /* Parse arguments: check for -l flag */
    for (i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-l") == 0)
            long_format = 1;
        else
            dirpath = argv[i];
    }

    dir = opendir(dirpath);
    if (dir == NULL) { perror("opendir"); return 1; }

    while ((entry = readdir(dir)) != NULL) {
        if (long_format) {
            snprintf(path, sizeof(path), "%s/%s", dirpath, entry->d_name);
            stat(path, &info);
            printf("%10ld  %.24s  %s\n",
                   (long)info.st_size,
                   ctime(&info.st_mtime),
                   entry->d_name);
        } else {
            printf("%s\n", entry->d_name);
        }
    }

    closedir(dir);
    return 0;
}
/* Compile: gcc ls3.c -o ls3 */
/* Run:     ./ls3 -l /home/user */
```

---

## 9.4 Recursive Directory Listing - ls with -R

For the recursive version (Lab 9, Q6), you check whether each entry is a directory (`DT_DIR`), skip `.` and `..`, and recurse into subdirectories.

```c
/* Lab 9, Q6 - recursive ls */
#include <stdio.h>
#include <dirent.h>
#include <string.h>

void listDir(char *path) {
    DIR *dir;
    struct dirent *entry;
    char subpath[512];

    dir = opendir(path);
    if (dir == NULL) { perror("opendir"); return; }

    printf("\n--- %s ---\n", path);

    while ((entry = readdir(dir)) != NULL) {
        /* skip . and .. */
        if (strcmp(entry->d_name, ".") == 0 ||
            strcmp(entry->d_name, "..") == 0)
            continue;

        printf("%s\n", entry->d_name);

        if (entry->d_type == DT_DIR) {
            snprintf(subpath, sizeof(subpath),
                     "%s/%s", path, entry->d_name);
            listDir(subpath);   /* recurse */
        }
    }

    closedir(dir);
}

int main(int argc, char *argv[]) {
    char *path = (argc >= 2) ? argv[1] : ".";
    listDir(path);
    return 0;
}
```

> **Note:** When deleting directories recursively (Lab 9, Q10), use `unlink()` to remove a regular file and `rmdir()` to remove an empty directory. You must delete all contents before `rmdir()` will succeed, which is why this also requires a recursive approach similar to the listing above.

---

*End of Part 1 - C Programming*
