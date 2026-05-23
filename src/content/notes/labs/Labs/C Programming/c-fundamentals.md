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