# Cramer's Rule

**What is it about?**  
To solve for $X$ using Cramer's rule, we take the determinant of a new matrix and divide it by the determinant of the original matrix. The new matrix is formed by replacing one column of the original matrix with the RHS (constants, also known as $B$ in $AX = B$). The column to be replaced is the one associated with the unknown we are solving for.

### Example 1:

$$
4x_1 - x_2 + 2x_3 = 15
$$
$$
-x_1 + 2x_2 + 3x_3 = 5
$$
$$
5x_1 - 7x_2 + 9x_3 = 8
$$

**Solution:**

$$
x_1 = \frac{\begin{vmatrix} 15 & -1 & 2 \\ 5 & 2 & 3 \\ 8 & -7 & 9 \end{vmatrix}}{\begin{vmatrix} 4 & -1 & 2 \\ -1 & 2 & 3 \\ 5 & -7 & 9 \end{vmatrix}} \qquad x_2 = \frac{\begin{vmatrix} 4 & 15 & 2 \\ -1 & 5 & 3 \\ 5 & 8 & 9 \end{vmatrix}}{\begin{vmatrix} 4 & -1 & 2 \\ -1 & 2 & 3 \\ 5 & -7 & 9 \end{vmatrix}} \qquad x_3 = \frac{\begin{vmatrix} 4 & -1 & 15 \\ -1 & 2 & 5 \\ 5 & -7 & 8 \end{vmatrix}}{\begin{vmatrix} 4 & -1 & 2 \\ -1 & 2 & 3 \\ 5 & -7 & 9 \end{vmatrix}}
$$

$$
x_1 = \frac{504}{126} \qquad x_2 = \frac{378}{126} \qquad x_3 = \frac{126}{126}
$$

$$
X_1 = 4 \qquad X_2 = 3 \qquad X_3 = 1
$$

### Example 2:

$$
2x + 5y + 2z = -38
$$
$$
3x - 2y + 4z = 17
$$
$$
-6x + y - 7z = -12
$$

**Solution:**

$$
\begin{bmatrix} 2 & 5 & 2 \\ 3 & -2 & 4 \\ -6 & 1 & 7 \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} = \begin{bmatrix} -38 \\ 17 \\ -12 \end{bmatrix}
$$

$A$

**Step 1:** Find the initial determinant:

$$
= (2 \times 10) - (5 \times 3) + (2 \times -9) = -13
$$

**Step 2:** To find the value of $x$, replace the products $A$ in the column where $x$ values are. Then find the new determinant. Use this formula to find $x$:

$$
x = \frac{\text{New determinant}}{\text{Initial determinant}}
$$

Repeat for $y$ and $z$.

$$
x: \begin{vmatrix} -38 & 5 & 2 \\ 17 & -2 & 4 \\ -12 & 1 & 7 \end{vmatrix} \quad \text{new determinant} = (-38 \times 10) - (5 \times -71) + (2 \times -7) = -39
$$

$$
\therefore x = \frac{\text{new determinant}}{\text{initial determinant}} = \frac{-39}{-13} = 3
$$

$$
y: \begin{vmatrix} 2 & -38 & 2 \\ 3 & 17 & 4 \\ -6 & -12 & -7 \end{vmatrix} \quad \text{new determinant} = (2 \times -71) - (-38 \times 3) + (2 \times 66) = 104
$$

$$
\therefore y = \frac{\text{new determinant}}{\text{initial determinant}} = \frac{104}{-13} = -8
$$

$$
z: \begin{vmatrix} 2 & 5 & -38 \\ 3 & -2 & 17 \\ -6 & 1 & -12 \end{vmatrix} \quad \text{new determinant} = (2 \times 7) - (5 \times 66) + (-38 \times -5) = 26
$$

$$
\therefore z = \frac{\text{new determinant}}{\text{initial determinant}} = \frac{26}{-13} = -2
$$

$$
\textbf{Answer:} \quad x = 3, \quad y = -8, \quad z = -2
$$

---