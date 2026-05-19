# Properties of Determinants

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