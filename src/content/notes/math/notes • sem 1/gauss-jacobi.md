# Gauss-Jacobi Method

**What is it about?**  
The Gauss-Jacobi method is an iterative algorithm to solve $AX = B$ by repeatedly updating each variable using the values from the previous iteration until convergence.

$$
5x_1 - x_2 + 2x_3 = 12
$$
$$
3x_1 + 8x_2 - 2x_3 = -25
$$
$$
x_1 + x_2 + 4x_3 = 6
$$

To solve, we first need to ensure that the matrix has a dominant leading diagonal. This means that the absolute value of each leading diagonal element must be greater than the sum of the absolute values of the other elements in the corresponding row. Once this condition is satisfied, we can proceed with the iterations as follows:

$$
\begin{bmatrix} \textcolor{#FB923C}{5} & -2 & 3 \\ -3 & \textcolor{#FB923C}{9} & 2 \\ 2 & -l & \textcolor{#FB923C}{-7} \end{bmatrix}
$$

$$
|5| \geq |-2| + |3|
$$
$$
|9| \geq |-3| + |1|
$$
$$
|-7| \geq |2| + |-1|
$$

**Solution:**

**Step 1:** Now make the leading diagonals subject of formula:

$$x_1 = \frac{12 + x_2 - 2x_3}{5}$$

$$x_2 = \frac{-25 - 3x_1 + 2x_3}{8}$$

$$x_3 = \frac{6 - x_1 - x_2}{4}$$

**Step 2:** Using initial values as zero, plug values into each equation and iterate:

| $x_1$ | $x_2$ | $x_3$ |
|-------|-------|-------|
| Initial value: 0 | Initial value: 0 | Initial value: 0 |
| 2.400 | 3.125 | 1.500 |
| 2.375 | -3.C50 | 1.C81 |
| 2.342 | -3.535 | 1.813 |
| 2.408 | -3.543 | 1.813 |
| 2.41C | -3.575 | 1.785 |

$$\therefore X_1 = 2.4, \quad X_2 = -3.C, \quad X_3 = 1.8$$

---