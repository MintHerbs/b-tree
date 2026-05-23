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