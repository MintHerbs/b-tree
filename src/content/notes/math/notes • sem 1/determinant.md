# MATRIX
*By Moon & LaLa*

**Authors**  
Moon — Instagram: offrian  
Nahla — Instagram: nahla.dna

---

$$
\begin{array}{c}
\text{matrix } \mathbf{A} =
\begin{bmatrix}
a & b & c & d \\
e & F & g & h \\
i & j & k & L \\
m & n & o & p
\end{bmatrix}
\quad \leftarrow \text{Row}
\\[1em]
\hspace{10em}\uparrow \text{ Column}
\end{array}
$$

- **Element**: $a_{ij}$ = Element in row($i$) and column($j$)
- **Size** = number of rows × number of columns
- **Square** = number of rows = number of columns in a matrix

---

# Determinant

**Definition:** The determinant of a matrix is the sum of any row or column where the elements are multiplied by their corresponding cofactor.

> **Note:** determinant is unique

$|\mathbf{A}|$ = Determinant of matrix A  
$M_{ij}$ = Minor of $a_{ij}$, i.e element $a_{ij}$

### Example of Minors

#### i. 2×2 matrix

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$

$M_{11} = d$  
$M_{12} = c$  
$M_{22} = a$  
$|\mathbf{A}| = \det(A) = ad - bc$

#### ii. 3×3 matrix

Example:

$$
\text{Matrix } B = \begin{bmatrix} 0 & 1 & 2 \\ 3 & 4 & 5 \\ 6 & 7 & 8 \end{bmatrix}
$$

**Minor of $M_{11}$** — Strikethrough row 1 and column 1:

$$
\begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#FF6B6B}{\cancel{3}} & \textcolor{#4ECDC4}{4} & \textcolor{#4ECDC4}{5} \\ \textcolor{#FF6B6B}{\cancel{6}} & \textcolor{#4ECDC4}{7} & \textcolor{#4ECDC4}{8} \end{bmatrix}
$$

Therefore, the minor of $M_{11}$ will be $= (4 \times 8) - (7 \times 5) = -3$

**Minor of $M_{12}$** — Strikethrough row 1 and column 2:

$$
\begin{bmatrix} \textcolor{#FF6B6B}{\cancel{0}} & \textcolor{#FF6B6B}{\cancel{1}} & \textcolor{#FF6B6B}{\cancel{2}} \\ \textcolor{#4ECDC4}{3} & \textcolor{#FF6B6B}{\cancel{4}} & \textcolor{#4ECDC4}{5} \\ \textcolor{#4ECDC4}{6} & \textcolor{#FF6B6B}{\cancel{7}} & \textcolor{#4ECDC4}{8} \end{bmatrix}
$$

Therefore, the minor of $M_{12}$ will be $= (3 \times 8) - (6 \times 5) = -6$

---