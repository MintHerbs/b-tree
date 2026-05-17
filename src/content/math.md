# MATRIX
*By Moon & LaLa*

**Authors**  
Sally — Instagram: offrian  
LaLa — Instagram: nahla.dna

---

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b & c & d \\ e & F & g & h \\ i & j & k & L \\ m & n & o & p \end{bmatrix} \quad \leftarrow \text{Column}
$$

$\uparrow$ Row

- **Element**: $a_{ij}$ = Element in row($i$) and column($j$)
- **Size** = number of rows × number of columns
- **Square** = number of rows = number of columns in a matrix

---

## Determinant

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
\begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ \cancel{3} & 4 & 5 \\ \cancel{6} & 7 & 8 \end{bmatrix}
$$

Therefore, the minor of $M_{11}$ will be $= (4 \times 8) - (7 \times 5) = -3$

**Minor of $M_{12}$** — Strikethrough row 1 and column 2:

$$
\begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & \cancel{4} & 5 \\ 6 & \cancel{7} & 8 \end{bmatrix}
$$

Therefore, the minor of $M_{12}$ will be $= (3 \times 8) - (6 \times 5) = -6$

---

## Cofactor

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
\text{matrix } \mathbf{A} = \begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & 4 & 5 \\ 6 & 7 & 8 \end{bmatrix}
$$

**Step 2:** Select any Row and strikethrough. I chose C3:

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} \cancel{0} & \cancel{1} & \cancel{2} \\ 3 & 4 & \cancel{5} \\ 6 & 7 & \cancel{8} \end{bmatrix}
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

## Types of Matrices

### Square Matrix (Diagonal Matrix)

Diagonal Matrix has the same number of rows and columns. Only the leading diagonals have values, the rest of the elements are zero.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a_{11} & 0 & 0 \\ 0 & a_{22} & 0 \\ 0 & 0 & a_{23} \end{bmatrix}
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
\text{matrix } \mathbf{A} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}
$$

### Triangular Matrix

Shows evidence of symmetry along the leading diagonal.

$$
\text{Lower Triangular} = \begin{bmatrix} 1 & 0 & 0 \\ -1 & 2 & 0 \\ -6 & -4 & 3 \end{bmatrix}
$$

$$
\text{Upper Triangular} = \begin{bmatrix} 1 & 2 & 3 \\ 0 & 4 & 5 \\ 0 & 0 & 6 \end{bmatrix}
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

## Inverse of a Matrix

### Method 1: Using Cofactors

**Step 1:** Compute the cofactor of the matrix.  
**Step 2:** Transpose the cofactor and get the adjoint matrix.  
**Step 3:** Divide the adjoint matrix by the determinant to get the inverse matrix.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$

$$
\text{Cofactor} \rightarrow \begin{bmatrix} d & -c \\ -b & a \end{bmatrix}
\xrightarrow{\text{Transpose}} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
\xrightarrow{\div \text{ Determinant}} \frac{1}{ad-bc} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
$$

### Method 2: Using Row Operations

**What is it about?**  
We can find the inverse of a matrix $A$ by augmenting it with a corresponding identity matrix $I$. Thus we use $[A|I]$.

#### Example 1:

Given the matrix:

$$
A = \begin{bmatrix} 1 & 2 & -1 \\ -2 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix}
$$

We need to put it in the form $[A|I_3]$ (augmented matrix):

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ -2 & 0 & 1 & 0 & 1 & 0 \\ 1 & 1 & 0 & 0 & 0 & 1 \end{array}\right]
$$

This part ($A$) should become like $I_3$. And whatever calculations are done in $A$ to become $I_3$ has to be done in $I_3$ too. The end product ($I_3$) will become the inverse.

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ -2 & 0 & 1 & 0 & 1 & 0 \\ 1 & 1 & 0 & 0 & 0 & 1 \end{array}\right] \xrightarrow{R_1 - R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ -2 & 0 & 1 & 0 & 1 & 0 \\ 0 & 3 & -1 & 0 & 0 & -1 \end{array}\right] \xrightarrow{2R_1 + R_2}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ 0 & 4 & -1 & 2 & 1 & 0 \\ 0 & 3 & -1 & 1 & 0 & -1 \end{array}\right] \xrightarrow{3R_2 - 4R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & 1 & 0 & 0 \\ 0 & 4 & -1 & 2 & 1 & 0 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \xrightarrow{R_1 + R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 0 & 3 & 3 & 4 \\ 0 & 4 & -1 & 2 & 1 & 0 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \xrightarrow{R_2 + R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 0 & 3 & 3 & 4 \\ 0 & 4 & 0 & 4 & 4 & 4 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \xrightarrow{2R_1 - R_2}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & -2 & 0 & 3 & 3 & 3 \\ 0 & 4 & 0 & 4 & 4 & 4 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right]
$$

$$
\left[\begin{array}{ccc|ccc} 2 & 0 & 0 & 2 & 2 & 4 \\ 0 & 4 & 0 & 4 & 4 & 4 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \xrightarrow{\frac{1}{2}R_1,\; \frac{1}{4}R_2}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 0 & 0 & 1 & 1 & 2 \\ 0 & 1 & 0 & 1 & 1 & 1 \\ 0 & 0 & 1 & 2 & 3 & 4 \end{array}\right] \qquad \therefore A^{-1} = \begin{bmatrix} 1 & 1 & 2 \\ 1 & 1 & 1 \\ 2 & 3 & 4 \end{bmatrix}
$$

> **NOTE:** To check if the answer is correct: $A \times A^{-1} = \text{Identity matrix}$

$$
\begin{bmatrix} 1 & 2 & -1 \\ -2 & 0 & 1 \\ 1 & 1 & 0 \end{bmatrix} \times \begin{bmatrix} 1 & 1 & 2 \\ 1 & 1 & 1 \\ 2 & 3 & 4 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 1 & 0 & 0 \end{bmatrix}
$$

#### Example 2: Find the inverse of the matrix

$$
A = \begin{bmatrix} 1 & 2 & 4 \\ 1 & 3 & 6 \\ 1 & 0 & 1 \end{bmatrix}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & 1 & 0 & 0 \\ 1 & 3 & 6 & 0 & 1 & 0 \\ 1 & 0 & 1 & 0 & 0 & 1 \end{array}\right] \xrightarrow{R_2 - R_1}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & 1 & 0 & 0 \\ 0 & 1 & 2 & -1 & 1 & 0 \\ 1 & 0 & 1 & 0 & 0 & 1 \end{array}\right] \xrightarrow{R_3 - R_1}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & 1 & 0 & 0 \\ 0 & 1 & 2 & -1 & 1 & 0 \\ 0 & -2 & -3 & -1 & 0 & 1 \end{array}\right] \xrightarrow{R_1 - 2R_2,\; R_3 + 2R_2}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 0 & 0 & 3 & -2 & 0 \\ 0 & 1 & 2 & -1 & 1 & 0 \\ 0 & 0 & 1 & -3 & 2 & 1 \end{array}\right] \xrightarrow{R_2 - 2R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 0 & 0 & 3 & -2 & 0 \\ 0 & 1 & 0 & 5 & -3 & -2 \\ 0 & 0 & 1 & -3 & 2 & 1 \end{array}\right]
$$

$$
\therefore A^{-1} = \begin{bmatrix} 3 & -2 & 0 \\ 5 & -3 & -2 \\ -3 & 2 & 1 \end{bmatrix}
$$

---

## Properties of Determinants

**What is it about?**  
Properties of determinants describe how the determinant of a matrix behaves under various operations, such as row and column manipulations, matrix multiplication, transposition, and inversion.

### Property 1

If row and column consist of entries = 0 then determinant = 0.

$$
\begin{vmatrix} 0 & 0 \\ 0 & b \end{vmatrix} = 0 \qquad \begin{vmatrix} 0 & 0 \\ c & d \end{vmatrix} = 0
$$

### Property 2

Determinant of a matrix is the same as its transpose. $|A^T| = |A|$

$$
A = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc \qquad A^T = \begin{vmatrix} a & c \\ b & d \end{vmatrix} = ad - bc
$$

### Property 3

For any Identity matrix, the determinant is 1. $|A| = 1$

$$
A = \begin{vmatrix} 1 & 0 \\ 0 & 1 \end{vmatrix} = 1
$$

### Property 4

If only two rows or columns are swapped producing any new matrix then the determinant is negative.

$$
A = \begin{vmatrix} a & b \\ c & d \end{vmatrix} \quad |A| = ad - bc
$$

$$
B = \begin{vmatrix} c & d \\ a & b \end{vmatrix} \quad |B| = bc - ad = -[ad - bc]
$$

Obtained by swapping 2 rows in Matrix A.

$$
A = \begin{vmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{vmatrix} = 1
$$

### Property 5

If two rows or columns are identical, then determinant equals to 0.

$$
A = \begin{vmatrix} a & b \\ a & b \end{vmatrix} \quad \therefore |A| = 0
$$

### Property 6

If any row or column is multiplied by a scalar ($K$) to produce a new matrix then determinant of new matrix $= K|A|$.

$$
A = \begin{vmatrix} a & b \\ c & d \end{vmatrix} \quad |A| = ad - bc
$$

$$
B = \begin{vmatrix} ka & b \\ kc & d \end{vmatrix} \quad |B| = (kad) - (kbc) = K[ad - bc] = K|A|
$$

### Property 7

If a scalar of a row and column is added to another row or column then determinant of new matrix is same as original one.

$$
A = \begin{vmatrix} a & b \\ c & d \end{vmatrix}
$$

$$
B = \begin{vmatrix} a & b \\ c + ka & d + kb \end{vmatrix}
$$

Multiplied column 1 by $K$ then added it to column 2 to get Matrix $B$.

$$|A| = |B|$$

### Property 8

Determinant of a product of matrices is equal to the product of each one.

$$A = A_1 \times A_2 \times A_3 \quad \Rightarrow \quad |A| = |A_1| \times |A_2| \times |A_3|$$

### Property 9

For any lower triangular or upper triangular, determinant = product of leading diagonal.

$$
A = \begin{vmatrix} a & 0 \\ c & d \end{vmatrix} \quad |A| = ad
$$

### Property 10

If the cofactors of one row are multiplied by the entries of a different row then determinant equals to zero.

$$
A = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc
$$

$$
\text{Cofactor} = \begin{vmatrix} d & -c \\ -b & a \end{vmatrix} = a(-b) + b(a) = 0
$$

**Example:**

$$
\begin{vmatrix} 1 & a & b+c \\ 1 & b & a+c \\ 1 & c & a+b \end{vmatrix} = 0
$$

Under rule 7, add Row 2 to Row 3:

$$
\begin{vmatrix} 1 & a & b+c \\ 1 & b & a+c \\ 1 & c & a+b \end{vmatrix} = \begin{vmatrix} 1 & a & a+b+c \\ 1 & b & b+a+c \\ 1 & c & c+a+b \end{vmatrix}
$$

$$
\begin{vmatrix} 1 & a & a+b+c \\ 1 & b & a+b+c \\ 1 & c & a+b+c \end{vmatrix} = (a+b+c) \begin{vmatrix} 1 & a & 1 \\ 1 & b & 1 \\ 1 & c & 1 \end{vmatrix}
$$

$$
\det\begin{vmatrix} 1 & a & 1 \\ 1 & b & 1 \\ 1 & c & 1 \end{vmatrix} = 0 \quad \text{due to rule 5}
$$

**Example:**

$$
\begin{vmatrix} x+a & a & a \\ a & x+a & a \\ a & a & x+a \end{vmatrix} = x^2(x + 3a)
$$

Using rule 7: $C_3 + C_1$:

$$
\begin{vmatrix} x+a & a & x+2a \\ a & x+a & 2a \\ a & a & x+2a \end{vmatrix}
$$

Using rule 7: $C_3 + C_2$:

$$
\begin{vmatrix} x+a & a & x+3a \\ a & x+a & x+3a \\ a & a & x+3a \end{vmatrix}
$$

$$
= (x+3a) \begin{vmatrix} x+a & a & 1 \\ a & x+a & 1 \\ a & a & 1 \end{vmatrix}
$$

Using rule 7: $R_1 + R_3$, $R_2 - R_3$:

$$
(x+3a) \begin{vmatrix} x & 0 & 0 \\ 0 & x & 0 \\ a & a & 1 \end{vmatrix}
$$

Using rule G (Product of leading diagonal):

$$
(x + 3a)(x^2)
$$

---

## Simultaneous Equations Using Matrix (AX = B)

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

## Cramer's Rule

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

## Gauss Elimination

**What is it about?**  
It involves 3 row operations:

1. Multiplication of a row by a constant as well as the constant ($B$).
2. Swapping of rows.
3. Addition of 2 rows, including the constant part ($B$).

In short, the aim is to form a triangular matrix:

$$
\begin{bmatrix} a & b & c \\ 0 & d & e \\ 0 & 0 & f \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} = \begin{bmatrix} g \\ h \\ i \end{bmatrix}
$$

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

**Step 1:** Write in $AX = B$ form:

$$
\begin{pmatrix} 4 & -1 & 2 \\ -1 & 2 & 3 \\ 5 & -7 & 9 \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} = \begin{pmatrix} 15 \\ 5 \\ 8 \end{pmatrix}
$$

**Step 2:** Augment matrix $A$ with $B$:

$$
\left[\begin{array}{ccc|c} 4 & -1 & 2 & 15 \\ -1 & 2 & 3 & 5 \\ 5 & -7 & 9 & 8 \end{array}\right]
$$

**Step 3:** Make the matrix either lower or upper triangular:

$$
\left[\begin{array}{ccc|c} 4 & -1 & 2 & 15 \\ 0 & \frac{7}{4} & \frac{7}{2} & \frac{35}{4} \\ 0 & -\frac{23}{4} & \frac{13}{2} & -\frac{43}{4} \end{array}\right]
\quad \begin{array}{l} \\ R_2 = R_2 + \frac{1}{4}R_1 \\ R_3 = R_3 - \frac{5}{4}R_1 \end{array}
$$

**Step 3 (continued):** Keep doing row operations till triangular matrix is reached:

$$
\left[\begin{array}{ccc|c} 4 & -1 & 2 & 15 \\ 0 & \frac{7}{4} & \frac{7}{2} & \frac{35}{4} \\ 0 & 0 & 18 & 18 \end{array}\right]
\quad \begin{array}{l} \\ \\ R_3 = R_3 + \frac{23}{7}R_2 \end{array}
$$

$$
\begin{array}{cccc}
& x_1 & x_2 & x_3
\end{array}
$$

From the triangular matrix:

$$18x_3 = 18 \quad \Rightarrow \quad x_3 = 1$$

$$\frac{7}{4}x_2 + \frac{7}{2}x_3 = \frac{35}{4} \quad \Rightarrow \quad x_2 = 3$$

$$4x_1 - x_2 + 2x_3 = 15 \quad \Rightarrow \quad x_1 = 4$$

### Example 2: Solve the simultaneous equations using Gauss Elimination

$$
x + y - z = -2
$$
$$
2x - y + z = 5
$$
$$
-x + 2y + 2z = 1
$$

**Solution:**

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 2 & -1 & 1 & 5 \\ -1 & 2 & 2 & 1 \end{array}\right] \xrightarrow{R_3 + R_1}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 2 & -1 & 1 & 5 \\ 0 & 3 & 1 & -1 \end{array}\right] \xrightarrow{2R_1 - R_2}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 0 & 3 & -3 & -9 \\ 0 & 3 & 1 & -1 \end{array}\right] \xrightarrow{R_3 - R_2}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & -2 \\ 0 & 3 & -3 & -9 \\ 0 & 0 & 4 & 8 \end{array}\right]
$$

From here we can deduce the following equations:

$$x + y - z = -2 \quad \text{(equation 1)}$$
$$3y - 3z = -9 \quad \text{(equation 2)}$$
$$4z = 8 \quad \text{(equation 3)}$$

From equation 3: $4z = 8 \Rightarrow z = 2$

Replace $z = 2$ in equation 2: $3y - 3(2) = -9 \Rightarrow y = -1$

Replace $z = 2$ and $y = -1$ in equation 1: $x - 1 - 2 = -2 \Rightarrow x = 1$

$$
\textbf{Answer:} \quad x = 1, \quad y = -1, \quad z = 2
$$

---

## LU Decomposition

**What is it about?**  
If a square matrix can be written as the product of a lower triangular matrix $L$ and an upper triangular matrix $U$ then $A = LU$ is a LU-Factorisation.

**Triangles:**

$$
\text{Upper triangular} = \begin{bmatrix} a_{11} & a_{12} & a_{13} \\ 0 & a_{22} & a_{23} \\ 0 & 0 & a_{33} \end{bmatrix} \qquad \text{Lower triangular} = \begin{bmatrix} a_{1} & 0 & 0 \\ a_{21} & a_{22} & 0 \\ a_{31} & a_{32} & a_{33} \end{bmatrix}
$$

i.e:

$$
\mathbf{A} = \begin{bmatrix} 1 & 2 \\ 1 & 0 \end{bmatrix} = \begin{bmatrix} 1 & 0 \\ 1 & 1 \end{bmatrix} \begin{bmatrix} 1 & 2 \\ 0 & -2 \end{bmatrix} = \mathbf{LU}
$$

Above is an example decomposition of matrix $A$ into a lower and upper triangle.

Thus, $AX = B$ can be written as $L(UX) = B$.

$$Ax = B \quad \Rightarrow \quad \text{split } A \text{ into } L \& U \quad \Rightarrow \quad A = LU$$

Replace $LU$ in equation $Ax = B$:

$$LUx = B$$

We have two methods of decomposition:
- **Doolittle**
- **Crout's Method**

**Triangles for Doolittle's Method:**

$$
L = \begin{bmatrix} 1 & 0 & 0 \\ a & 1 & 0 \\ b & c & 1 \end{bmatrix} \qquad U = \begin{bmatrix} d & e & f \\ 0 & g & h \\ 0 & 0 & i \end{bmatrix}
$$

We can also write the triangles for Doolittle's method as:

$$
L = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \qquad U = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
$$

We can also write the triangle for Crout's Method as:

$$
L = \begin{bmatrix} L_{11} & 0 & 0 \\ L_{21} & L_{22} & 0 \\ L_{31} & L_{32} & L_{33} \end{bmatrix} \qquad U = \begin{bmatrix} 1 & U_{12} & U_{13} \\ 0 & 1 & U_{23} \\ 0 & 0 & 1 \end{bmatrix}
$$

---

### 1. Crout's Method

Solve the following set of equations using LU Decomposition.

#### Example 1:

$$
5x_1 + 4x_2 + x_3 = 3.4
$$
$$
10x_1 + 9x_2 + 4x_3 = 8.8
$$
$$
10x_1 + 13x_2 + 15x_3 = 19.2
$$

**Solution:**

**Step 1:** Write in $AX = B$ form:

$$
\begin{pmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} = \begin{pmatrix} 3.4 \\ 8.8 \\ 19.2 \end{pmatrix}
$$

**Step 2:** Decompose $A$ into Upper and Lower Triangles:

$$
\begin{bmatrix} 5 & 1 & 1 \\ 10 & 9 & 1 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} a & 0 & 0 \\ b & c & 0 \\ d & e & f \end{bmatrix} \begin{bmatrix} 1 & g & h \\ 0 & 1 & i \\ 0 & 0 & 1 \end{bmatrix}
$$

**Step 3:** Multiply Lower and Upper triangles:

$$
\begin{bmatrix} a & 0 & 0 \\ b & c & 0 \\ d & e & f \end{bmatrix} \begin{bmatrix} 1 & g & h \\ 0 & 1 & i \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} a & ag & ah \\ b & bg+c & bh+ci \\ d & dg+e & dh+ei+f \end{bmatrix}
$$

**Step 4:** Equate with Matrix $A$:

$$
\begin{bmatrix} a & ag & ah \\ b & bg+c & bh+ci \\ d & dg+e & dh+ei+f \end{bmatrix} = \begin{bmatrix} 5 & 1 & 1 \\ 10 & 9 & 1 \\ 10 & 13 & 15 \end{bmatrix}
$$

**Step 5:** Find $a, b, c, d$... etc. by equating:

$$ag = 4 \quad bg + c = 9 \quad bh + ci = 4 \quad ah = 1 \quad dg + e = 13 \quad dh + ei + f = 15$$

**Step 5:** Substitute values into $L$ and $U$:

$$
\begin{bmatrix} a & 0 & 0 \\ b & c & 0 \\ d & e & f \end{bmatrix} \begin{bmatrix} 1 & g & h \\ 0 & 1 & i \\ 0 & 0 & 1 \end{bmatrix} = \begin{bmatrix} 5 & 0 & 0 \\ 10 & 1 & 0 \\ 10 & 5 & 3 \end{bmatrix} \begin{bmatrix} 1 & 0.8 & 0.2 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{bmatrix}
$$

$$b = 10 \quad d = 10 \quad c = 1 \quad h = 0.2 \quad e = 5 \quad f = 3$$

**Step C:** Using $AX = B$:

$$AX = B \quad \Rightarrow \quad LUX = B, \quad \text{make } Y = UX \quad \Rightarrow \quad LY = B$$

$$
\begin{bmatrix} 5 & 0 & 0 \\ 10 & 1 & 0 \\ 10 & 5 & 3 \end{bmatrix} \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 3.5 \\ 8.8 \\ 19.2 \end{bmatrix}
$$

**Step 7:** Find the values of $Y$:

$$5y_1 = 3.5 \quad 10y_1 + y_2 = 8.8 \quad 10y_1 + 5y_2 + 3y_3 = 19.2$$

$$
\therefore \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 0.68 \\ 2 \\ 0.8 \end{bmatrix}
$$

$Y_1 = 0.8 \quad y_2 = 2 \quad y_3 = 0.8$

**Step 8:** Now find $X$:

$$AX = B \quad \Rightarrow \quad LUX = B, \quad \text{note } UX = Y$$

$$
\begin{bmatrix} 1 & 0.8 & 0.2 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 0.68 \\ 2 \\ 0.8 \end{bmatrix}
$$

**Step 9:** Find the values of $X$:

$$X_3 = 0.8 \quad X_2 + 2X_3 = 2 \quad X_1 + 0.8X_2 + 0.2X_3 = 0.68$$

$$X_3 = 0.8 \qquad X_2 = 0.4 \qquad X_1 = 0.2$$

#### Example 2:

$$
x_1 + x_2 + x_3 = 1
$$
$$
4x_1 + 3x_2 - x_3 = 6
$$
$$
3x_1 + 5x_2 + 3x_3 = 4
$$

**Step 1:** $Ax = B$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 6 \\ 4 \end{bmatrix}
$$

**Step 2:** Decompose $A$ into $L$ and $U$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} L_{11} & 0 & 0 \\ L_{21} & L_{22} & 0 \\ L_{31} & L_{32} & L_{33} \end{bmatrix} \begin{bmatrix} 1 & U_{12} & U_{13} \\ 0 & 1 & U_{23} \\ 0 & 0 & 1 \end{bmatrix}
$$

**Step 3:** Multiply $L$ and $U$ just like you would multiply a 3×3 matrix (Row × Column):

$$
A = \begin{bmatrix} L_{11} & L_{11}U_{12} & L_{11}U_{13} \\ L_{21} & L_{21}U_{12} + L_{22} & L_{21}U_{13} + L_{22}U_{23} \\ L_{31} & L_{31}U_{12} + L_{32} & L_{31}U_{13} + L_{32}U_{23} + L_{33} \end{bmatrix}
$$

**Step 4:** Compare $LU$ with their respective positions in $A$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} L_{11} & L_{11}U_{12} & L_{11}U_{13} \\ L_{21} & L_{21}U_{12} + L_{22} & L_{21}U_{13} + L_{22}U_{23} \\ L_{31} & L_{31}U_{12} + L_{32} & L_{31}U_{13} + L_{32}U_{23} + L_{33} \end{bmatrix}
$$

By comparing we get the following equations:

$$L_{11} = 1 \quad L_{21} = 4 \quad L_{31} = 3$$
$$L_{11}U_{12} = 1 \quad L_{21}U_{12} + L_{22} = 3 \quad L_{31}U_{12} + L_{32} = 5$$
$$L_{11}U_{13} = 1 \quad L_{21}U_{13} + L_{22}U_{23} = -1 \quad L_{31}U_{13} + L_{32}U_{23} + L_{33} = 3$$

Replace $L_{11} = 1$ in $L_{11}U_{12} = 1$: $\quad U_{12} = 1$

Replace $L_{21} = 4$ and $U_{12} = 1$ in $L_{21}U_{12} + L_{22} = 3$: $\quad (4 \times 1) + L_{22} = 3 \Rightarrow L_{22} = -1$

Replace $L_{31} = 3$ and $U_{12} = 1$ in $L_{31}U_{12} + L_{32} = 5$: $\quad (3 \times 1) + L_{32} = 5 \Rightarrow L_{32} = 2$

Replace $L_{11}$ in $L_{11}U_{13} = 1$: $\quad U_{13} = 1$

Replace $L_{21} = 4$, $U_{13} = 1$ and $L_{22} = -1$ in $L_{21}U_{13} + L_{22}U_{23} = -1$:

$$
(4 \times 1) + (-1 \times U_{23}) = -1 \Rightarrow 4 - U_{23} = -1 \Rightarrow U_{23} = 5
$$

Replace $L_{31} = 3$, $U_{13} = 1$, $L_{32} = 2$ and $U_{23} = 5$ in $L_{31}U_{13} + L_{32}U_{23} + L_{33} = 3$:

$$
(3 \times 1) + (2 \times 5) + L_{33} = 3 \Rightarrow L_{33} = -10
$$

$$
\therefore L = \begin{bmatrix} 1 & 0 & 0 \\ 4 & -1 & 0 \\ 3 & 2 & -10 \end{bmatrix} \quad \text{and} \quad U = \begin{bmatrix} 1 & 1 & 1 \\ 0 & 1 & 5 \\ 0 & 0 & 1 \end{bmatrix}
$$

**Step 5:** We know that $Ax = B \Rightarrow LUx = B$. Let $Ux = y \Rightarrow Ly = B$:

$$
\begin{bmatrix} 1 & 0 & 0 \\ 4 & -1 & 0 \\ 3 & 2 & -10 \end{bmatrix} \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 6 \\ 4 \end{bmatrix}
$$

Now solve to get values of $y$:

$$y_1 = 1 \quad \text{(eq1)}$$
$$4y_1 - y_2 = 6 \quad \text{(eq2)}$$
$$3y_1 + 2y_2 - 10y_3 = 4 \quad \text{(eq3)}$$

Replace $y_1 = 1$ in eq2: $4(1) - y_2 = 6 \Rightarrow y_2 = -2$

Replace $y_1 = 1$ and $y_2 = -2$ in eq3: $(3 \times 1) + (2 \times -2) - 10y_3 = 4 \Rightarrow y_3 = -\frac{1}{2}$

**Step 6:** Using the equation $Ux = y$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 0 & 1 & 5 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 1 \\ -2 \\ -\frac{1}{2} \end{bmatrix}
$$

$$x_1 + x_2 + x_3 = 1 \quad \text{(eq1)}$$
$$x_2 + 5x_3 = -2 \quad \text{(eq2)}$$
$$x_3 = -\frac{1}{2} \quad \text{(eq3)}$$

Replace $x_3 = -\frac{1}{2}$ in eq2: $x_2 + (5 \times -\frac{1}{2}) = -2 \Rightarrow x_2 = \frac{1}{2}$

Replace $x_2 = \frac{1}{2}$ and $x_3 = -\frac{1}{2}$ in eq1: $x_1 + \frac{1}{2} - \frac{1}{2} = 1 \Rightarrow x_1 = 1$

$$
\therefore \textbf{Answer:} \quad x_1 = 1, \quad x_2 = \frac{1}{2}, \quad x_3 = -\frac{1}{2}
$$

---

### 2. Doolittle's Method

Solve the following set of equations using LU Decomposition.

#### Example 2:

$$
x_1 + x_2 + x_3 = 1
$$
$$
4x_1 + 3x_2 - x_3 = 6
$$
$$
3x_1 + 5x_2 + 3x_3 = 4
$$

**Step 1:** $Ax = B$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 5 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 6 \\ 4 \end{bmatrix}
$$

**Step 2:** Decompose $A$ into $L$ and $U$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
$$

**Step 3:** Multiply $L$ and $U$ just like you would multiply a 3×3 matrix (Row × Column):

$$
A = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ L_{21}U_{11} & L_{21}U_{12} + U_{22} & U_{13}L_{21} + U_{23} \\ L_{31}U_{11} & L_{31}U_{12} + L_{32}U_{22} & L_{31}U_{13} + L_{32}U_{23} + U_{33} \end{bmatrix}
$$

**Step 4:** Compare $LU$ with their respective position in $A$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ L_{21}U_{11} & L_{21}U_{12} + U_{22} & U_{13}L_{21} + U_{23} \\ L_{31}U_{11} & L_{31}U_{12} + L_{32}U_{22} & L_{31}U_{13} + L_{32}U_{23} + U_{33} \end{bmatrix}
$$

By comparing, we get these equations:

$$U_{11} = 1 \quad U_{12} = 1 \quad U_{13} = 1$$
$$L_{21}U_{11} = 4 \quad L_{21}U_{12} + U_{22} = 3 \quad U_{13}L_{21} + U_{23} = -1$$
$$L_{31}U_{11} = 3 \quad L_{31}U_{12} + L_{32}U_{22} = 5 \quad L_{31}U_{13} + L_{32}U_{23} + U_{33} = 3$$

Replace $U_{11} = 1$ in $L_{21}U_{11} = 4$: $\quad L_{21} = 4$

Replace $L_{21} = 4$ and $U_{12} = 1$ in $L_{21}U_{12} + U_{22} = 3$: $\quad (1 \times 4) + U_{22} = 3 \Rightarrow U_{22} = -1$

Replace $U_{13} = 1$ and $L_{21} = 4$ in $U_{13}L_{21} + U_{23} = -1$: $\quad (1 \times 4) + U_{23} = -1 \Rightarrow U_{23} = -5$

Replace $U_{11} = 1$ in $L_{31}U_{11} = 3$: $\quad L_{31} = 3$

Replace $L_{31} = 3$, $U_{12} = 1$ and $U_{22} = -1$ in $L_{31}U_{12} + L_{32}U_{22} = 5$:

$$
(3 \times 1) + (L_{32} \times -1) = 5 \Rightarrow L_{32} = -2
$$

Replace $L_{31} = 3$, $U_{13} = 1$, $L_{32} = -2$ and $U_{23} = -5$ in $L_{31}U_{13} + L_{32}U_{23} + U_{33} = 3$:

$$
(3 \times 1) + (-2 \times -5) + U_{33} = 3 \Rightarrow U_{33} = -10
$$

$$
\therefore L = \begin{bmatrix} 1 & 0 & 0 \\ 4 & 1 & 0 \\ 3 & -2 & 1 \end{bmatrix} \quad U = \begin{bmatrix} 1 & 1 & 1 \\ 0 & -1 & -5 \\ 0 & 0 & -10 \end{bmatrix}
$$

**Step 5:** We know that $LUx = B$. Let $Ux = y \Rightarrow Ly = B$:

$$
\begin{bmatrix} 1 & 0 & 0 \\ 4 & 1 & 0 \\ 3 & -2 & 1 \end{bmatrix} \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 6 \\ 4 \end{bmatrix}
$$

Solve to get the values of $y$:

$$y_1 = 1 \quad \text{(eq1)}$$
$$4y_1 + y_2 = 6 \quad \text{(eq2)}$$
$$3y_1 - 2y_2 + y_3 = 4 \quad \text{(eq3)}$$

Replace $y_1 = 1$ in eq2: $4y_1 + y_2 = 6 \Rightarrow y_2 = 2$

Replace $y_1 = 1$ and $y_2 = 2$ in eq3: $(3 \times 1) - (2 \times 2) + y_3 = 4 \Rightarrow y_3 = 5$

$$
\therefore \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 2 \\ 5 \end{bmatrix}
$$

**Step 6:** Using the equation $Ux = y$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 0 & -1 & -5 \\ 0 & 0 & -10 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 2 \\ 5 \end{bmatrix}
$$

$$x_1 + x_2 + x_3 = 1 \quad \text{(eq1)}$$
$$-x_2 - 5x_3 = 2 \quad \text{(eq2)}$$
$$-10x_3 = 5 \quad \text{(eq3)}$$

From eq3: $-10x_3 = 5 \Rightarrow x_3 = -\frac{1}{2}$

Replace $x_3 = -\frac{1}{2}$ in eq2: $-x_2 - 5x_3 = 2 \Rightarrow -x_2 + \frac{5}{2} = 2 \Rightarrow x_2 = \frac{1}{2}$

Replace $x_3 = -\frac{1}{2}$ and $x_2 = \frac{1}{2}$ in eq1: $x_1 + x_2 + x_3 = 1 \Rightarrow x_1 = 1$

$$
\textbf{Answer:} \quad x_1 = 1, \quad x_2 = \frac{1}{2}, \quad x_3 = -\frac{1}{2}
$$

#### Example 2 (continued):

$$
5x_1 + 4x_2 + x_3 = 3.4
$$
$$
10x_1 + 9x_2 + 4x_3 = 8.8
$$
$$
10x_1 + 13x_2 + 15x_3 = 19.2
$$

$$Ax = B$$

$$
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 3.4 \\ 8.8 \\ 19.2 \end{bmatrix}
$$

Splitting $A$ into $L$ and $U$:

$$
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 \\ L_{21} & 1 & 0 \\ L_{31} & L_{32} & 1 \end{bmatrix} \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ 0 & U_{22} & U_{23} \\ 0 & 0 & U_{33} \end{bmatrix}
$$

$$
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} U_{11} & U_{12} & U_{13} \\ L_{21}U_{11} & L_{21}U_{12} + U_{22} & U_{13}L_{21} + U_{23} \\ L_{31}U_{11} & L_{31}U_{12} + L_{32}U_{22} & L_{31}U_{13} + L_{32}U_{23} + U_{33} \end{bmatrix}
$$

By comparing:

$$U_{11} = 5 \quad U_{12} = 4 \quad U_{13} = 1$$
$$L_{21}U_{11} = 10 \quad L_{21}U_{12} + U_{22} = 9 \quad L_{21}U_{13} + U_{23} = 4$$
$$L_{31}U_{11} = 10 \quad L_{31}U_{12} + L_{32}U_{22} = 13 \quad L_{31}U_{13} + L_{32}U_{23} + U_{33} = 15$$

Replace $U_{11} = 5$ in $L_{21}U_{11} = 10$: $\quad L_{21} = 2$

Replace $L_{21} = 2$ and $U_{12} = 4$ in $L_{21}U_{12} + U_{22} = 9$: $\quad (2 \times 4) + U_{22} = 9 \Rightarrow U_{22} = 1$

Replace $L_{21} = 2$ and $U_{13} = 1$ in $L_{21}U_{13} + U_{23} = 4$: $\quad (2 \times 1) + U_{23} = 4 \Rightarrow U_{23} = 2$

Replace $U_{11} = 5$ in $L_{31}U_{11} = 10$: $\quad L_{31} = 2$

Replace $L_{31} = 2$, $U_{12} = 4$ and $U_{22} = 1$ in $L_{31}U_{12} + L_{32}U_{22} = 13$:

$$
(2 \times 4) + L_{32} = 13 \Rightarrow L_{32} = 5
$$

Replace $L_{31} = 2$, $U_{13} = 1$, $L_{32} = 5$ and $U_{23} = 2$ in $L_{31}U_{13} + L_{32}U_{23} + U_{33} = 15$:

$$
(2 \times 1) + (5 \times 2) + U_{33} = 15 \Rightarrow U_{33} = 3
$$

$$
L = \begin{bmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 2 & 5 & 1 \end{bmatrix} \quad \text{and} \quad U = \begin{bmatrix} 5 & 4 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 3 \end{bmatrix}
$$

$$Ax = B \quad \Rightarrow \quad LUx = B, \quad \text{Let } Ux = y \Rightarrow Ly = B$$

$$
\begin{bmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 2 & 5 & 1 \end{bmatrix} \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 3.4 \\ 8.8 \\ 19.2 \end{bmatrix}
$$

$$y_1 = 3.4 \quad \text{(eq1)}$$
$$2y_1 + y_2 = 8.8 \quad \text{(eq2)}$$
$$2y_1 + 5y_2 + y_3 = 19.2 \quad \text{(eq3)}$$

Replace $y_1 = 3.4$ in eq2: $(2 \times 3.4) + y_2 = 8.8 \Rightarrow y_2 = 2$

Replace $y_2 = 2$ and $y_1 = 3.4$ in eq3: $(2 \times 3.4) + (5 \times 2) + y_3 = 19.2 \Rightarrow y_3 = 2.4$

$$
\therefore \begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} 3.4 \\ 2 \\ 2.4 \end{bmatrix}
$$

Using $Ux = y$:

$$
\begin{bmatrix} 5 & 4 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 3 \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 3.4 \\ 2 \\ 2.4 \end{bmatrix}
$$

$$5x_1 + 4x_2 + x_3 = 3.4 \quad \text{(eq1)}$$
$$x_2 + 2x_3 = 2 \quad \text{(eq2)}$$
$$3x_3 = 2.4 \quad \text{(eq3)}$$

From eq3: $3x_3 = 2.4 \Rightarrow x_3 = 0.8$

Replace $x_3 = 0.8$ in eq2: $x_2 + (2 \times 0.8) = 2 \Rightarrow x_2 = 0.4$

Replace $x_3 = 0.8$ and $x_2 = 0.4$ in eq1: $5x_1 + (4 \times 0.4) + 0.8 = 3.4 \Rightarrow x_1 = 0.2$

$$
\therefore \textbf{Answer:} \quad x_1 = 0.2, \quad x_2 = 0.4, \quad x_3 = 0.8
$$

---

## Echelon Form & Reduced Echelon Form

**What is it about?**

**Row Echelon Form (REF):**
1. All zero rows must be at the bottom.
2. Each leading entry of a row is in a column to the right of the leading entry in the row above it.
3. All entries in a column below a leading entry is a zero.

**Reduced Echelon Form (REF):**
1. Leading entries are 1 (Unity).
2. Leading 1's are the only non-zero entry in a column.

$$
\text{Echelon Form:} \quad \begin{bmatrix} x & x & x \\ 0 & x & x \\ 0 & 0 & x \end{bmatrix} \qquad \text{Reduced Echelon Form:} \quad \begin{bmatrix} 1 & 0 & 2 \\ 0 & 1 & 4 \\ 0 & 0 & 0 \end{bmatrix}
$$

Note: $X$ = Any positive integer.

### Example: Reduce the matrix to Row Echelon Form

$$
A = \begin{bmatrix} 1 & 2 & 4 & 5 \\ 2 & 4 & 5 & 4 \\ 4 & 5 & 4 & 2 \end{bmatrix}
$$

**Solution:**

**Step 1:** Perform Row operations:

$$
\begin{bmatrix} 1 & 2 & 4 & 5 \\ 2 & 4 & 5 & 4 \\ 4 & 5 & 4 & 2 \end{bmatrix} \xrightarrow{R_2 = R_2 - 2R_1} \begin{bmatrix} 1 & 2 & 4 & 5 \\ 0 & 0 & -3 & -6 \\ 4 & 5 & 4 & 2 \end{bmatrix} \xrightarrow{R_3 = R_3 - 4R_1} \begin{bmatrix} 1 & 2 & 4 & 5 \\ 0 & 0 & -3 & -6 \\ 0 & -3 & -12 & -18 \end{bmatrix}
$$

**Step 2:** Swap row 2 with row 3 then carry on with Row operations:

$$
\begin{bmatrix} 1 & 2 & 4 & 5 \\ 0 & -3 & -12 & -18 \\ 0 & 0 & -3 & -6 \end{bmatrix} \xrightarrow{R_2 \div -3} \begin{bmatrix} 1 & 2 & 4 & 5 \\ 0 & 1 & 4 & 6 \\ 0 & 0 & -3 & -6 \end{bmatrix} \xrightarrow{R_3 \div -3} \begin{bmatrix} 1 & 2 & 4 & 5 \\ 0 & 1 & 4 & 6 \\ 0 & 0 & 1 & 2 \end{bmatrix}
$$

$$
\xrightarrow{R_1 = R_1 - 2R_2} \begin{bmatrix} 1 & 0 & -4 & -7 \\ 0 & 1 & 4 & 6 \\ 0 & 0 & 1 & 2 \end{bmatrix} \xrightarrow{R_1 = R_1 + 4R_3} \begin{bmatrix} 1 & 0 & 0 & 1 \\ 0 & 1 & 0 & -2 \\ 0 & 0 & 1 & 2 \end{bmatrix} \xrightarrow{R_2 = R_2 - 4R_3}
$$

$$
\therefore \text{REF is } \begin{bmatrix} 1 & 0 & 0 & 1 \\ 0 & 1 & 0 & -2 \\ 0 & 0 & 1 & 2 \end{bmatrix}
$$

---

## Rank

**What is it about?**  
The rank of a matrix tells you about the linear independence of its rows and columns which helps determine the nature of solutions associated with the system of linear equations.

**Definition:** The rank of a matrix is defined as the number of linear independent rows or columns in a matrix. The minimum number of independent rows or columns is referred to as rank.

A rank takes the form of:

$$
\begin{bmatrix} I_r & O \\ O & O \end{bmatrix}
$$

At the end, your matrix should look a bit like this:

$$
\begin{bmatrix} I_r & & & \\ & 1 & 0 & 0 & 0 & O_{n1} \\ & 0 & 1 & 0 & 0 & \\ & 0 & 0 & 1 & 0 & \\ & 0 & 0 & 0 & 0 & \\ O_{n2} & & & & & O_{n3} \end{bmatrix}
$$

### Example 1: Find the rank of the following set of equations:

$$
2x + 3y = 5
$$
$$
4x + 7y = 1
$$

**Step 1:** Put in matrix form $(A \backslash B)$:

$$
\left[\begin{array}{cc|c} 2 & 3 & 5 \\ 4 & 7 & 1 \end{array}\right]
$$

**Step 2:** Make matrix in echelon form:

$$
\left[\begin{array}{cc|c} 2 & 3 & 5 \\ 4 & 7 & 1 \end{array}\right] \xrightarrow{R_2 - 2R_1} \left[\begin{array}{cc|c} 2 & 3 & 5 \\ 0 & 1 & -9 \end{array}\right]
$$

$\therefore \text{Rank } A = 2 \qquad \text{Rank } A \backslash B = 2$

There are 2 independent rows in the matrix $\therefore \text{rank} = 2$

### Example 2:

$$
2x + 3y = 5
$$
$$
4x + 6y = 10
$$

$$
\left[\begin{array}{cc|c} 2 & 3 & 5 \\ 4 & 6 & 10 \end{array}\right] \xrightarrow{R_2 - 2R_1} \left[\begin{array}{cc|c} 2 & 3 & 5 \\ 0 & 0 & 0 \end{array}\right]
$$

$\therefore \text{Rank } A = 1 \qquad \text{Rank } A \backslash B = 1 \quad \Rightarrow$ Multiple solution

> **Note:** When a row or column consists of 0s only, it is not considered in rank calculations.  
> When rank is less than number of unknowns, there will be multiple solutions.

### Example 3:

$$
2x + y = 7
$$
$$
4x + 2y = 6
$$

$$
\left[\begin{array}{cc|c} 2 & 1 & 7 \\ 4 & 2 & 6 \end{array}\right] \xrightarrow{R_2 - 2R_1} \left[\begin{array}{cc|c} 2 & 1 & 7 \\ 0 & 0 & -8 \end{array}\right]
$$

$\therefore \text{Rank } A = 1 \qquad \text{Rank } A \backslash B = 2 \quad \Rightarrow$ No Solution

### Example 4: Find the Rank of matrix $A$

$$
A = \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 2 & 4 & 1 & 3 & 0 \\ 3 & 6 & 2 & 5 & 1 \\ -4 & -8 & 1 & -3 & 1 \end{bmatrix}
$$

**Step 1:** Use row operations to make the matrix in reduced echelon form:

$$
\underbrace{\begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 2 & 4 & 1 & 3 & 0 \\ 3 & 6 & 2 & 5 & 1 \\ -4 & -8 & 1 & -3 & 1 \end{bmatrix}}_{\text{Pivot element}} \xrightarrow{\begin{array}{l} R_2 - 2R_1 \\ R_3 - 3R_1 \\ R_4 + 4R_1 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & -2 \\ 0 & 0 & 2 & 2 & -2 \\ 0 & 0 & 1 & 1 & 5 \end{bmatrix}
$$

Also a pivot element in REF as it is the next number in $R_2$:

$$
\xrightarrow{\begin{array}{l} R_3 - 2R_2 \\ R_4 - R_2 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & -2 \\ 0 & 0 & 0 & 0 & 2 \\ 0 & 0 & 0 & 0 & 7 \end{bmatrix} \quad \leftarrow \text{New pivot element}
$$

$$
\xrightarrow{R_3 \div 2} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & -2 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 7 \end{bmatrix} \xrightarrow{\begin{array}{l} R_1 - R_3 \\ R_2 + 2R_3 \\ R_4 - 7R_3 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 0 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

3 independent rows $\therefore$ Rank = 3

Reduced echelon form:

$$
\begin{bmatrix} 1 & 2 & 0 & 1 & 0 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

> **Note:** We can simplify further using column operations.

$$
\begin{bmatrix} 1 & 2 & 0 & 1 & 0 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix} \xrightarrow{C_2 = -2C_1 + C_2} \xrightarrow{C_4 = -C_1 + C_4} \begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

**Step 2:** Rearrange the columns:

$$
\begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

$$\therefore \textbf{Answer: Rank}[A] = 3 \quad \text{(3 independent rows)}$$

---

## System of Linear Equations

$$
\begin{array}{ccc}
\textbf{Solvable} & & \textbf{Not Solvable} \\
\text{Rank}[A] = \text{Rank}[A \backslash B] & & \text{Rank}[A] \neq \text{Rank}[A \backslash B]
\end{array}
$$

$$
\begin{array}{cc}
\textbf{Multiple} & \textbf{Unique} \\
\text{Rank} < \text{Number of unknowns} & \text{Rank} = \text{Number of unknowns}
\end{array}
$$

**Objectives:**
- To determine whether a system of equation is homogeneous or non-homogeneous (heterogeneous).
- To determine whether a system is consistent or not.

---

## Homogeneous Equations

**What is it about?**  
A system of equation is homogeneous if it can be written in the form $AX = 0$.

**Definition:** A system of linear equations is homogeneous if all constant terms are 0.

$$
a_{11}x_1 + a_{12}x_2 + \cdots + a_{1n}x_n = 0
$$
$$
a_{21}x_1 + a_{22}x_2 + \cdots + a_{2n}x_n = 0
$$
$$
\vdots \quad \vdots \quad \vdots \quad \vdots
$$
$$
a_{m1}x_1 + a_{m2}x_2 + \cdots + a_{mn}x_n = 0
$$

$m$ equations in $n$ unknowns $(x_1, x_2, \ldots, x_n)$

$$
\begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ \vdots \\ 0 \end{bmatrix}
$$

$$Ax = 0$$

$x_1 = 0, x_2 = 0, x_3 = 0, \ldots, x_n = 0$ is always a solution to a homogeneous system of linear equations and is called the **trivial solution**.

$$
\begin{array}{cc}
a_1x + b_1y = 0 & a_1x + b_1y = 0 \\
a_2x + b_2y = 0 & a_2x + b_2y = 0 \\
\text{Trivial solution} & \text{Infinitely many solutions} \\
\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} & \text{Non-Trivial}
\end{array}
$$

If a homogeneous system has more unknowns ($n$) than equations ($m$) ($m < n$), then it will have infinitely many solutions (Non-Trivial).

- When Rank = Number of unknowns → unique solutions where $x = 0$ (**Trivial**)
- When Rank < Number of unknowns → multiple solutions among which $x = 0$ (**Non-Trivial**)

### Example 1: Determine whether these equations are trivial or not

$$
3x_1 - x_2 + x_3 = 0
$$
$$
-15x_1 + 6x_2 + 5x_3 = 0
$$
$$
5x_1 - 2x_2 + 2x_3 = 0
$$

$$
\left[\begin{array}{ccc|c} 3 & -1 & 1 & 0 \\ -15 & 6 & 5 & 0 \\ 5 & 2 & 2 & 0 \end{array}\right]
$$

**Step 1:** Put in echelon form and find rank:

$$
\left[\begin{array}{ccc|c} 3 & -1 & 1 & 0 \\ -15 & 6 & 5 & 0 \\ 5 & 2 & 2 & 0 \end{array}\right] \xrightarrow{R_2 + 5R_1} \left[\begin{array}{ccc|c} 3 & -1 & 1 & 0 \\ 0 & 1 & 10 & 0 \\ 5 & 2 & 2 & 0 \end{array}\right] \xrightarrow{3R_3 + R_2} \left[\begin{array}{ccc|c} 3 & -1 & 1 & 0 \\ 0 & 1 & 10 & 0 \\ 0 & 0 & 11 & 0 \end{array}\right]
$$

Rank = 3 and the number of unknowns = 3

Rank = Number of unknowns $\Rightarrow$ **Answer: $x = 0$ Trivial solution**

### Example 2:

$$
x_1 + x_2 + x_3 + x_4 = 0
$$
$$
x_1 + 3x_2 - 2x_3 + x_4 = 0
$$
$$
2x_1 - 3x_2 + 2x_4 = 0
$$
$$
3x_1 + 3x_2 + 3x_4 = 0
$$

$$
\left[\begin{array}{cccc|c} 1 & 1 & 1 & 1 & 0 \\ 1 & 3 & -2 & 1 & 0 \\ 2 & -3 & 0 & 2 & 0 \\ 3 & 3 & 0 & 3 & 0 \end{array}\right] \xrightarrow{\begin{array}{l} R_2 - R_1 \\ 2R_1 - R_3 \\ 3R_1 - R_4 \end{array}} \left[\begin{array}{cccc|c} 1 & 1 & 1 & 1 & 0 \\ 0 & 2 & -3 & 0 & 0 \\ 0 & 5 & 2 & 0 & 0 \\ 0 & 0 & 3 & 0 & 0 \end{array}\right] \xrightarrow{\begin{array}{l} 5R_2 - R_3 \\ 3R_1 - R_4 \end{array}}
$$

$$
\left[\begin{array}{cccc|c} 1 & 1 & 1 & 1 & 0 \\ 0 & 2 & -3 & 0 & 0 \\ 0 & 0 & 3 & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 \end{array}\right]
$$

Rank = 3 and the Number of unknowns = 4

Rank < Number of unknowns

$\therefore$ There is multiple solution and $x = 0$ is one of them. **Answer: Non-Trivial**

### Example of homogeneous equations:

The system of equations are homogeneous as $AX = 0$:

$$
5x_1 + 4x_2 + x_3 = 0
$$
$$
10x_1 + 9x_2 + 4x_3 = 0
$$
$$
10x_1 + 13x_2 + 15x_3 = 0
$$

---

### Prove the following Matrix has Non-trivial solutions and express it in parametric form.

$$
\begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 3 & 6 & 0 \\ 4 & 5 & 9 & 0 \end{bmatrix}
$$

**Solution:**

**Step 1:** Reduce to row echelon form:

$$
\begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 3 & 6 & 0 \\ 4 & 5 & 9 & 0 \end{bmatrix} \xrightarrow{R_3 = R_3 - R_1} \begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 3 & 6 & 0 \\ 0 & 3 & 6 & 0 \end{bmatrix}
$$

**Step 2:** Keep reducing:

$$
\xrightarrow{R_2 = \frac{1}{3}R_2} \begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 1 & 2 & 0 \\ 0 & 3 & 6 & 0 \end{bmatrix} \xrightarrow{R_3 = \frac{1}{3}R_3} \begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 1 & 2 & 0 \\ 0 & 1 & 2 & 0 \end{bmatrix}
$$

**Step 3:** Keep reducing:

$$
\begin{bmatrix} 4 & 2 & 3 & 0 \\ 0 & 1 & 2 & 0 \\ 0 & 1 & 2 & 0 \end{bmatrix} \xrightarrow{R_1 = R_1 - 2R_2} \begin{bmatrix} 4 & 0 & -1 & 0 \\ 0 & 1 & 2 & 0 \\ 0 & 0 & 0 & 0 \end{bmatrix} \xrightarrow{R_3 = R_3 - R_2}
$$

**Step 3:** Extract linear equations from Echelon form Matrix:

$$
\begin{array}{ccc} X_1 & X_2 & X_3 \end{array}
$$

$$
\begin{bmatrix} 4 & 0 & -1 & 0 \\ 0 & 1 & 2 & 0 \\ 0 & 0 & 0 & 0 \end{bmatrix}
\quad \Rightarrow \quad
\begin{array}{l} 4X_1 - X_3 = 0 \\ X_2 + 2X_3 = 0 \end{array}
$$

$X_3$ is considered a free variable as it is not a pivot.

**Step 4:** Solve for $X_1$ and $X_2$:

$$4X_1 - X_3 = 0 \quad \Rightarrow \quad X_1 = \frac{1}{4}x_3$$

$$X_2 + 2X_3 = 0 \quad \Rightarrow \quad X_2 = -2X_3$$

**Step 5:** Replace $X$ with their solutions:

$$
x = \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} \frac{1}{4}x_3 \\ -2x_3 \\ x_3 \end{bmatrix} = x_3 \begin{bmatrix} \frac{1}{4} \\ -2 \\ 1 \end{bmatrix}
$$

Make $X_3 = t$ and make the vector $= v$, hence parametric form is:

$$\therefore X = tv$$

---

### Prove the following Matrix has Non-trivial solutions and express it in parametric form.

Since $R_3$ are all zero, we can get rid of it.

$$
\begin{bmatrix} 1 & 0 & 9 & -8 \\ 0 & 0 & -4 & 5 \end{bmatrix}
$$

**Solution:**

**Step 1:** Reduce to row echelon form:

$$
\begin{bmatrix} 1 & 0 & 9 & -8 \\ 0 & 0 & -4 & 5 \end{bmatrix} \quad \text{Already in row echelon form.}
$$

**Step 2:** Extract linear equations:

$$X_1 + 9X_3 - 8X_4 = 0$$
$$-4X_3 + 5X_4 = 0$$

**Step 3:** Solve for $X_1$ and $X_2$:

$$X_1 + 9X_3 - 8X_4 = 0 \quad \Rightarrow \quad X_1 = 8x_4 - 9x_3$$

$$-4X_3 + 5X_4 = 0 \quad \Rightarrow \quad X_2 = 4x_3 - 5x_4$$

$$
\begin{bmatrix} 1 & 0 & 9 & -8 \\ 0 & 0 & -4 & 5 \\ 0 & 0 & 0 & 0 \end{bmatrix}
$$

**Step 4:** Replace $X$ with solutions:

$$
x = \begin{bmatrix} x_1 \\ x_2 \\ x_3 \\ x_4 \end{bmatrix} = \begin{bmatrix} 8x_4 - 9x_3 \\ 4x_3 - 5x_4 \\ x_3 \\ x_4 \end{bmatrix} = \begin{bmatrix} -9x_3 \\ 4x_3 \\ x_3 \\ 0 \end{bmatrix} + \begin{bmatrix} 8x_4 \\ -5x_4 \\ 0 \\ x_4 \end{bmatrix}
$$

**Step 5:** Extract $X$ from vectors:

$$
\begin{bmatrix} -9x_3 \\ 4x_3 \\ x_3 \\ 0 \end{bmatrix} + \begin{bmatrix} 8x_4 \\ -5x_4 \\ 0 \\ x_4 \end{bmatrix} = x_3 \begin{bmatrix} -9 \\ 4 \\ 1 \\ 0 \end{bmatrix} + x_4 \begin{bmatrix} 8 \\ -5 \\ 0 \\ 1 \end{bmatrix}
$$

Make $X_3 = t$, vector 1 $= V$, $X_4 = s$, vector 2 $= w$, hence parametric form is:

$$\therefore X = tv + s\omega$$

---

## Heterogeneous Equations

**What is it about?**  
Solutions to $AX = B$ are translations of solutions of $AX = 0$. Consider the graph below, where Line $AX = 0$ is translated onto line $AX = b$:

$$
\begin{array}{c}
\text{Y-axis} \\
\uparrow \\
AX = B \\
AX = 0 \\
\longrightarrow \text{X-axis}
\end{array}
$$

A heterogeneous linear system is where $Ax = B$ and $B \neq 0$.

$$
B \neq 0
$$

$$
\begin{array}{ccc}
\textbf{Solvable} & & \textbf{Not-Solvable} \\
\text{Rank}[A] = \text{Rank}[A/B] & & \text{Rank}[A] \neq \text{Rank}[A \backslash B] \\
\text{(consistent)} & & \text{(inconsistent)} \\
\downarrow & & \\
\textbf{Unique} \quad \textbf{Multiple} & & \\
\text{Rank } A = \text{Number of unknowns} \quad \text{Rank } A \leq \text{number of unknowns} & &
\end{array}
$$

### Example 1:

$$
x_1 + x_2 + 3x_3 + x_4 = 2
$$
$$
x_1 - x_2 + x_3 + x_4 = 4
$$
$$
x_2 + 2x_3 + 2x_4 = 0
$$

We have 4 unknowns and 3 equations. Since number of equations < Number of solutions, we don't have a unique solution.

$$
\left[\begin{array}{cccc|c} 1 & 1 & 3 & 1 & 2 \\ 1 & -1 & 1 & 1 & 4 \\ 0 & 1 & 2 & 2 & 0 \end{array}\right] \xrightarrow{R_2 - R_1}
$$

$$
\left[\begin{array}{cccc|c} 1 & 1 & 3 & 1 & 2 \\ 0 & -2 & -2 & 0 & 2 \\ 0 & 0 & -1 & 1 & -2 \end{array}\right] \xrightarrow{R_2 \div 2}
$$

$$
\left[\begin{array}{cccc|c} 1 & 1 & 3 & 1 & 2 \\ 0 & -1 & 1 & 0 & 1 \\ 0 & 0 & -1 & 1 & -2 \end{array}\right]
$$

From this, we obtain these equations:

$$x_1 + x_2 + 3x_3 + x_4 = 2 \quad \text{(eq1)}$$
$$-x_2 + x_3 = 1 \quad \text{(eq2)}$$
$$-x_3 + x_4 = -2 \quad \text{(eq3)}$$

Rank = 3 and Number of unknowns = 4

$\therefore$ Rank < Number of unknowns $\Rightarrow$ **multiple solutions**

Let's assume that $x_4 = t$.

From eq3: $-x_3 + t = -2 \Rightarrow x_3 = 2 + t$

Replace $x_3 = 2 + t$ in eq2: $-x_2 + (2 + t) = 1 \Rightarrow x_2 = 1 + t$

Replace $x_4 = t$, $x_3 = 2 + t$ and $x_2 = 1 + t$ in eq1:

$$x_1 + (1 + t) + 3(2 + t) + t = 2 \Rightarrow x_1 = 5 - 5t$$

$$x_1 = 5 - 5t$$
$$x_2 = 1 + t$$
$$x_3 = 2 + t$$
$$x_4 = t$$

$$
\begin{bmatrix} x_1 \\ x_2 \\ x_3 \\ x_4 \end{bmatrix} = \begin{bmatrix} 5 \\ 1 \\ 2 \\ 0 \end{bmatrix} + t \begin{bmatrix} -5 \\ 1 \\ 1 \\ 1 \end{bmatrix} \quad \text{where } t \text{ can be all real numbers}
$$

> **Note:** Each value of $t$, we get a set of $x_1, x_2, x_3$ and $x_4$ that satisfies the system of equations.

The system of equations are homogeneous as $AX = b$:

$$
1x_1 + 4x_2 - 5x_3 = 0
$$
$$
2x_1 - x_2 + 8x_3 = 9
$$
$$
0x_1 + 0x_2 + 0x_3 = 0
$$

---

### Prove the following Matrix has Non-trivial solutions and express it in parametric form.

Since $R_3$ are all zero, we can get rid of it.

$$
A = \begin{bmatrix} 1 & 4 & -5 & | & 0 \\ 2 & -1 & 8 & | & 9 \\ 0 & 0 & 0 & | & 0 \end{bmatrix}
$$

**Solution:**

**Step 1:** Reduce to row echelon form:

$$
\begin{bmatrix} 1 & 4 & -5 & | & 0 \\ 2 & -1 & 8 & | & 9 \end{bmatrix} \xrightarrow{R_2 = R_2 - 2R_1} \begin{bmatrix} 1 & 4 & -5 & | & 0 \\ 0 & -9 & 18 & | & 9 \end{bmatrix}
$$

**Step 2:** Keep reducing:

$$
\xrightarrow{R_2 = \frac{1}{9}R_2} \begin{bmatrix} 1 & 4 & -5 & | & 0 \\ 0 & -1 & 2 & | & 1 \end{bmatrix}
$$

**Step 3:** Extract linear equations:

$$
\begin{bmatrix} 1 & 4 & -5 & | & 0 \\ 0 & -1 & 2 & | & 1 \end{bmatrix} \xrightarrow{R_1 = R_1 + 4R_2} \begin{bmatrix} 1 & 0 & 3 & | & 4 \\ 0 & -1 & 2 & | & 1 \end{bmatrix}
$$

$$
\begin{array}{ccc} X_1 & X_2 & X_3 \end{array}
$$

$$X_1 + 3X_3 = 4$$
$$-X_2 + 2X_3 = 1$$

**Step 4:** Solve for $X$:

$$X_1 + 3X_3 = 4 \quad \Rightarrow \quad X_1 = 4 - 3x_3$$

$$-X_2 + 2X_3 = 1 \quad \Rightarrow \quad X_2 = 2x_3 - 1$$

$X_3 =$ free

**Step 5:** Replace $X$ with solutions and extract $x$ from vectors:

$$
x = \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 4 - 3x_3 \\ 2x_3 - 1 \\ x_3 \end{bmatrix} = x_3 \begin{bmatrix} -3 \\ 2 \\ 1 \end{bmatrix} + \begin{bmatrix} 4 \\ -1 \\ 0 \end{bmatrix}
$$

Make $X_3 = t$, vector 1 $= V$, $X_4 = s$, vector 2 $= p$, hence parametric form is:

$$\therefore X = p + tv$$

---

## Rank (Revisited)

**What is it about?**  
The rank of a matrix tells you about the linear independence of its rows and columns which helps determine the nature of solutions associated with the system of linear equations. A rank takes the form of:

$$
\begin{bmatrix} I_r & O \\ O & O \end{bmatrix}
$$

### Find the Rank of matrix $A$, if:

$$
A = \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 2 & 4 & 1 & 0 & 1 \\ 3 & 6 & 2 & 1 & 1 \\ -4 & -8 & 1 & 1 & 1 \end{bmatrix}
$$

**Solution:**

**Step 1:** Perform row operations:

$$
\begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 2 & 4 & 1 & 0 & 1 \\ 3 & 6 & 2 & 1 & 1 \\ -4 & -8 & 1 & 1 & 1 \end{bmatrix} \xrightarrow{\begin{array}{l} R_2 = R_2 - 2R_1 \\ R_3 = R_3 - 3R_1 \\ R_4 = R_4 + 4R_1 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & -2 \\ 0 & 0 & 2 & 2 & -2 \\ 0 & 0 & 1 & 1 & 5 \end{bmatrix}
$$

$$
\xrightarrow{\begin{array}{l} R_3 = R_3 - 2R_2 \\ R_4 = R_4 - R_1 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & -2 \\ 0 & 0 & 0 & 0 & 2 \\ 0 & 0 & 0 & 0 & 7 \end{bmatrix}
$$

$$
\xrightarrow{\begin{array}{l} R_1 = R_1 - R_3 \\ R_2 = 2R_3 + R_2 \\ R_3 = \frac{1}{3}R_3 \\ R_4 = -7R_3 + R_4 \end{array}} \begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

**Step 2:** Perform column operations:

$$
\begin{bmatrix} 1 & 2 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix} \xrightarrow{C_2 = -2C_1 + C_2} \begin{bmatrix} 1 & 0 & 0 & 1 & 1 \\ 0 & 0 & 1 & 1 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix} \xrightarrow{C_4 = -C_1 - C_3 + C_4} \begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 0 & 1 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

**Step 3:** Rearrange rows:

$$
\begin{bmatrix} I_r & O_i \\ O_i & O_i \end{bmatrix} \approx \begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 \end{bmatrix}
$$

$$\therefore \mathbf{Rank}(A) = 3$$

> **Note:** Rank = 3 as we have 3 Identity in the diagonals.

---

## Gauss-Jacobi Method

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
\begin{bmatrix} 5 & -2 & 3 \\ -3 & 9 & 2 \\ 2 & -l & -7 \end{bmatrix}
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

## Gauss-Seidel Method

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
\begin{bmatrix} 5 & -2 & 3 \\ -3 & 9 & 2 \\ 2 & -l & -7 \end{bmatrix}
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

## Resources

- **Multiplication of a [3×3] matrix:** https://www.youtube.com/watch?v=Spr2F6jEuaw&t=121s
- **Cofactor & Determinants:** https://www.youtube.com/watch?v=EB6u_u-RzqQ
- **Determinant of a [3×3]:** https://www.youtube.com/watch?v=jPYt76Jsw34
- **Properties of determinants:**
  - https://www.youtube.com/watch?v=0OJGV1zlnXY
  - https://www.youtube.com/watch?v=Kqg07XtnP2E
- **Cramer's rule:** https://www.youtube.com/watch?v=G9PCc_ZS0q4
- **Gauss Elimination:** https://www.youtube.com/watch?v=qllvSKqDarE
- **LU decomposition:** https://www.youtube.com/watch?v=BFYFkn-eOQk
- **Homogeneous Equations:** https://www.youtube.com/watch?v=VNApFaUOJ9o&t=335s
- **Heterogeneous Equations:** https://www.youtube.com/watch?v=axkmcrVdQPc&t=30s
- **Echelon Form vs Reduced Echelon Form:** https://www.youtube.com/watch?v=ShonVncOAB4
- **Rank:** https://www.youtube.com/watch?v=Sc7OY62lQ9U
- **Gauss Jacobi:** https://www.youtube.com/watch?v=bR2SEe8W3Ig
- **Gauss Seidel:** https://www.youtube.com/watch?v=F6J3ZmXkMj0
- **Eigenvalues and Eigenvectors:**
  - https://www.youtube.com/watch?v=BWvx4wUSGdA&t=953s
  - https://www.youtube.com/watch?v=qa9fI6qvUQY
- **Cayley-Hamilton Theorem:** https://www.youtube.com/watch?v=Xfl0BIvLiV4&list=PLNKD1qB9pptvcOzCxiYxwif-AZYR7T5-q
- **Using calculator to find Determinant:** https://www.youtube.com/watch?v=Iiwva8nvfdY
- **Using calculator to find Gauss Jacobi/Seidel:**
  - Jacobi: https://www.youtube.com/watch?v=yfoRvobm_g4
  - Seidel: https://www.youtube.com/watch?v=iJaKchU_m0Y

---

> **you got this!!!!!**
> 
> *— Sally & LaLa*
