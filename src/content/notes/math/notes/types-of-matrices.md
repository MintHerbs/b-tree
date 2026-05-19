# Types of Matrices

### Square Matrix (Diagonal Matrix)

Diagonal Matrix has the same number of rows and columns. Only the leading diagonals have values, the rest of the elements are zero.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#FB923C}{a_{11}} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#6B6680}{0} & \textcolor{#FB923C}{a_{22}} & \textcolor{#6B6680}{0} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FB923C}{a_{23}} \end{bmatrix}
$$

### Symmetry Matrix

Shows evidence of symmetry along the leading diagonal.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 1 & -1 & -6 \\ -1 & 2 & -4 \\ -6 & -4 & 3 \end{bmatrix}
$$

### Zero Matrix

It is a matrix where all elements are equal to zero.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} 0 & 0 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix}
$$

### Identity Matrix

Identity Matrix has leading diagonals equal to 1. When we multiply an identity matrix to a matrix we get the same matrix.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
$$

### Triangular Matrix

Shows evidence of symmetry along the leading diagonal.

$$
\text{Lower Triangular} = \begin{bmatrix} 1 & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ -1 & 2 & \textcolor{#6B6680}{0} \\ -6 & -4 & 3 \end{bmatrix}
$$

$$
\text{Upper Triangular} = \begin{bmatrix} 1 & 2 & 3 \\ \textcolor{#6B6680}{0} & 4 & 5 \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & 6 \end{bmatrix}
$$

### Transpose of Matrix

Matrix $A$ = Matrix $A^T$, where $a_{ij} = a_{ji}$, row and column value become vice versa.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b \\ C & d \end{bmatrix}
\qquad
\text{Matrix } \mathbf{A}^T = \begin{bmatrix} a & C \\ b & d \end{bmatrix}
$$

### Skew Symmetry

$$
\begin{bmatrix} x & -ve & -ve \\ x & x & -ve \\ x & x & x \end{bmatrix}
$$

$$
\text{Skew symmetry} = \begin{bmatrix} 2 & 0 & -1 \\ 3 & 2 & -1 \\ 4 & 3 & 6 \end{bmatrix}
$$

> **Note:** it is acceptable to have 0 in a skew symmetry instead of a negative number.

---