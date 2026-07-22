# Inverse of a Matrix

### Method 1: Using Cofactors

**Step 1:** Compute the cofactor of the matrix.  
**Step 2:** Transpose the cofactor and get the adjoint matrix.  
**Step 3:** Divide the adjoint matrix by the determinant to get the inverse matrix.

$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$

$$
\text{Cofactor} \rightarrow \begin{bmatrix} \textcolor{#4ECDC4}{d} & \textcolor{#FF6B6B}{-c} \\ \textcolor{#FF6B6B}{-b} & \textcolor{#4ECDC4}{a} \end{bmatrix}
\xrightarrow{\textcolor{#FDE68A}{\text{Transpose}}} \begin{bmatrix} \textcolor{#4ECDC4}{d} & \textcolor{#FDE68A}{-b} \\ \textcolor{#FDE68A}{-c} & \textcolor{#4ECDC4}{a} \end{bmatrix}
\xrightarrow{\textcolor{#C4B5FD}{\div \text{ Det}}} \textcolor{#C4B5FD}{\frac{1}{ad-bc}} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
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
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} \\ -2 & 0 & 1 & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} \\ 1 & 1 & 0 & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#6B6680}{0}} & \textcolor{#C4B5FD}{\textcolor{#A78BFA}{1}} \end{array}\right]
$$

This part ($A$) should become like $I_3$. And whatever calculations are done in $A$ to become $I_3$ has to be done in $I_3$ too. The end product ($I_3$) will become the inverse.

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ -2 & 0 & 1 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ 1 & 1 & 0 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_1 - R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ -2 & 0 & 1 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{3} & \textcolor{#FDE68A}{-1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{-1} \end{array}\right] \xrightarrow{2R_1 + R_2}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{4} & \textcolor{#FDE68A}{-1} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ 0 & 3 & -1 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{-1} \end{array}\right] \xrightarrow{3R_2 - 4R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & -1 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ 0 & 4 & -1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{1} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \xrightarrow{R_1 + R_3}
$$

$$
\left[\begin{array}{ccc|ccc} \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{2} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \\ 0 & 4 & -1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ 0 & 0 & 1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \xrightarrow{R_2 + R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 0 & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{4} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} \\ 0 & 0 & 1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \xrightarrow{2R_1 - R_2}
$$

$$
\left[\begin{array}{ccc|ccc} \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{-2} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{3} \\ 0 & 4 & 0 & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} \\ 0 & 0 & 1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right]
$$

$$
\left[\begin{array}{ccc|ccc} \textcolor{#FDE68A}{2} & \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{4} \\ 0 & 4 & 0 & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} & \textcolor{#C4B5FD}{4} \\ 0 & 0 & 1 & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \xrightarrow{\frac{1}{2}R_1,\; \frac{1}{4}R_2}
$$

$$
\left[\begin{array}{ccc|ccc} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{2} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{1} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{4} \end{array}\right] \qquad \therefore A^{-1} = \begin{bmatrix} 1 & 1 & 2 \\ 1 & 1 & 1 \\ 2 & 3 & 4 \end{bmatrix}
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
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ 1 & 3 & 6 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ 1 & 0 & 1 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_2 - R_1}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{2} & \textcolor{#C4B5FD}{-1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ 1 & 0 & 1 & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_3 - R_1}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 2 & 4 & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{0} \\ 0 & 1 & 2 & \textcolor{#C4B5FD}{-1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{-2} & \textcolor{#FDE68A}{-3} & \textcolor{#C4B5FD}{-1} & \textcolor{#C4B5FD}{0} & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_1 - 2R_2,\; R_3 + 2R_2}
$$

$$
\left[\begin{array}{ccc|ccc} \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{-2} & \textcolor{#C4B5FD}{0} \\ 0 & 1 & 2 & \textcolor{#C4B5FD}{-1} & \textcolor{#C4B5FD}{1} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{1} & \textcolor{#C4B5FD}{-3} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_2 - 2R_3}
$$

$$
\left[\begin{array}{ccc|ccc} 1 & 0 & 0 & \textcolor{#C4B5FD}{3} & \textcolor{#C4B5FD}{-2} & \textcolor{#C4B5FD}{0} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{0} & \textcolor{#C4B5FD}{5} & \textcolor{#C4B5FD}{-3} & \textcolor{#C4B5FD}{-2} \\ 0 & 0 & 1 & \textcolor{#C4B5FD}{-3} & \textcolor{#C4B5FD}{2} & \textcolor{#C4B5FD}{1} \end{array}\right]
$$

$$
\therefore A^{-1} = \begin{bmatrix} 3 & -2 & 0 \\ 5 & -3 & -2 \\ -3 & 2 & 1 \end{bmatrix}
$$

---