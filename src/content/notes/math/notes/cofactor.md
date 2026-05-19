# Cofactor

$$(-1)^{i+j} \times M_{ij}$$

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}
$$

$M_{12} = 3$  
$A_{ij} = \text{Cofactor of element } ij = M_{12} \times (-1)^{1+2} = -3$  
$\therefore A_{12} = -3$

### Rules of Cofactor

The cofactor is equal to ± minor depending on the position of the element.

$$
\text{Matrix } A = \begin{bmatrix} A_{11} & A_{12} & A_{13} \\ A_{21} & A_{22} & A_{23} \\ A_{31} & A_{32} & A_{33} \end{bmatrix}
$$

**Step 1:** Find the minor ($m$) of all the elements in matrix A:

$$
\text{Minors of matrix } A = \begin{bmatrix} m_{11} & m_{12} & m_{13} \\ m_{21} & m_{22} & m_{23} \\ m_{31} & m_{32} & m_{33} \end{bmatrix}
$$

**Step 2:** Multiply the minor by $\begin{bmatrix} + & - & + \\ - & + & - \\ + & - & + \end{bmatrix}$:

$$
= \begin{bmatrix} +m_{11} & -m_{12} & +m_{13} \\ -m_{21} & +m_{22} & -m_{23} \\ +m_{31} & -m_{32} & +m_{33} \end{bmatrix}
$$

---

## Determinant for a 3×3 Matrix

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 0 & 1 & 2 \\ 3 & 4 & 5 \\ 6 & 7 & 8 \end{bmatrix}
$$

Finding Minor of a 3×3 occurs in $|2 \times 2|$

**Step 1:** Select any Column and strikethrough. I chose R1:

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#4ECDC4}{4} & \textcolor{#4ECDC4}{5} \\ \textcolor{#4ECDC4}{6} & \textcolor{#4ECDC4}{7} & \textcolor{#4ECDC4}{8} \end{bmatrix}
$$

**Step 2:** Select any Row and strikethrough. I chose C3:

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#4ECDC4}{4} & \textcolor{#FF6B6B}{\cancel{5}} \\ \textcolor{#4ECDC4}{6} & \textcolor{#4ECDC4}{7} & \textcolor{#FF6B6B}{\cancel{8}} \end{bmatrix}
$$

**Step 3:** Write remaining numbers as a 2×2 matrix:

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 3 & 4 \\ 6 & 7 \end{bmatrix}
$$

**Step 4:** Calculate determinant of 2×2 matrix (minor of $a_{13}$):

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 3 & 4 \\ 6 & 7 \end{bmatrix}
$$

$\det / \text{minor of } a_{13} = (3 \times 7) - (6 \times 4) = -3$

$\therefore -3$ is a minor for element $a_{13}$, using this method we can calculate all the minors from $a_{11}$ to $a_{12}$.

$\text{Minor of } a_{11} = (4 \times 8) - (7 \times 5) = -3$  
$\text{Minor of } a_{12} = (3 \times 8) - (6 \times 5) = -6$

$$
\text{Determinant} = (A_{11} \times \text{minor of } A_{11}) - (A_{12} \times \text{minor of } A_{12}) + (A_{13} \times \text{minor of } A_{13})
$$

$$
= (0 \times -3) - (1 \times -6) + (2 \times -3) = 0 + 6 - 6 = 0
$$

---