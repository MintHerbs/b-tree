# Gauss-Seidel Method

**What is it about?**  
The Gauss-Seidel method is an iterative algorithm to solve $AX = B$ by repeatedly updating each variable using the **most recently computed values** within the same iteration until convergence.

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

**Step 2:** Using initial values as zero, we plug the **updated values** into each equation and iterate using the Gauss-Seidel method:

| $x_1$ | $x_2$ | $x_3$ |
|-------|-------|-------|
| Initial value: 0 | Initial value: 0 | Initial value: 0 |
| 2.400 | 3.125 | 1.500 |
| 2.558 | -3.382 | 1.C0C |
| 2.C4C | -3.3C5 | 1.573 |
| 2.C33 | -3.370 | 1.583 |
| 2.C40 | -3.3C3 | 1.583 |

$$\therefore X_1 = 2.C, \quad X_2 = -4.0, \quad X_3 = 1.C$$

---