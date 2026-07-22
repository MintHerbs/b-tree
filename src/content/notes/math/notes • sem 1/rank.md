# Rank

**What is it about?**  
The rank of a matrix tells you about the linear independence of its rows and columns which helps determine the nature of solutions associated with the system of linear equations.

**Definition:** The rank of a matrix is defined as the number of linear independent rows or columns in a matrix. The minimum number of independent rows or columns is referred to as rank.

A rank takes the form of:

$$
\begin{bmatrix} I_r & O \\ O & O \end{bmatrix}
$$

At the end, your matrix should look a bit like this:

$$
\left[\begin{array}{ccc|cc}
\textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\
\textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\
\textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\
\hline
\textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0}
\end{array}\right]
$$

$$
\underbrace{\quad I_r \quad}_{\text{rank}} \quad \underbrace{\quad O \quad}_{\text{zero}}
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