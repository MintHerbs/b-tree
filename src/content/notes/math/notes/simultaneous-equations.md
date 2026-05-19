# Simultaneous Equations Using Matrix (AX = B)

**What is it about?**  
This new method allows us to solve simultaneous equations using matrix.

$$
\text{Solve: } \quad 2x + 3y = 5 \quad \text{and} \quad 5x + 7y = 12
$$

Using $AX = B$ where:

- $A$ = Coefficient
- $X$ = Unknown
- $B$ = Constant

We can express the simultaneous equation above as:

$$
\begin{pmatrix} 2 & 3 \\ 5 & 7 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 5 \\ 12 \end{pmatrix}
$$

Thus:

$$
A = \begin{pmatrix} 2 & 3 \\ 5 & 7 \end{pmatrix}
$$

**Finding $X$ and $Y$ using $A^{-1}$:**

$$
A^{-1} = \begin{pmatrix} -7 & 3 \\ 5 & -2 \end{pmatrix}
$$

Using $AX = B$, we multiply $A^{-1}$ on both sides:

$$
A^{-1}Ax = A^{-1} \times B \quad \Rightarrow \quad x = A^{-1} \times B
$$

**Using $X = A^{-1} \times B$:**

$$
x = \begin{pmatrix} -7 & 3 \\ 5 & -2 \end{pmatrix} \begin{pmatrix} 5 \\ 12 \end{pmatrix} = \begin{pmatrix} 1 \\ 1 \end{pmatrix}
$$

$$
\therefore x = 1 \quad \& \quad y = 1
$$

#### Example 2:

$$
4x_1 - x_2 + 2x_3 = 15
$$
$$
-x_1 + 2x_2 + 3x_3 = 5
$$
$$
5x_1 - 7x_2 + 9x_3 = 8
$$

Since this will produce a [3×3], it would be extremely challenging to solve it via $AX = B$, so we need to either use Cramer's Rule or Gauss Elimination. (This question is solved in the next sections.)

---