# Gauss Elimination

**What is it about?**  
It involves 3 row operations:

1. Multiplication of a row by a constant as well as the constant ($B$).
2. Swapping of rows.
3. Addition of 2 rows, including the constant part ($B$).

In short, the aim is to form a triangular matrix:

$$
\begin{bmatrix} a & b & c \\ \textcolor{#6B6680}{0} & d & e \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & f \end{bmatrix} \begin{bmatrix} x \\ y \\ z \end{bmatrix} = \begin{bmatrix} \textcolor{#C4B5FD}{g} \\ \textcolor{#C4B5FD}{h} \\ \textcolor{#C4B5FD}{i} \end{bmatrix}
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
\left[\begin{array}{ccc|c} 4 & -1 & 2 & \textcolor{#C4B5FD}{15} \\ -1 & 2 & 3 & \textcolor{#C4B5FD}{5} \\ 5 & -7 & 9 & \textcolor{#C4B5FD}{8} \end{array}\right]
$$

**Step 3:** Make the matrix either lower or upper triangular:

$$
\left[\begin{array}{ccc|c} 4 & -1 & 2 & \textcolor{#C4B5FD}{15} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{\frac{7}{4}} & \textcolor{#FDE68A}{\frac{7}{2}} & \textcolor{#C4B5FD}{\frac{35}{4}} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{-\frac{23}{4}} & \textcolor{#FDE68A}{\frac{13}{2}} & \textcolor{#C4B5FD}{-\frac{43}{4}} \end{array}\right]
\quad \begin{array}{l} \\ R_2 = R_2 + \frac{1}{4}R_1 \\ R_3 = R_3 - \frac{5}{4}R_1 \end{array}
$$

**Step 3 (continued):** Keep doing row operations till triangular matrix is reached:

$$
\left[\begin{array}{ccc|c} \textcolor{#FB923C}{4} & -1 & 2 & \textcolor{#C4B5FD}{15} \\ \textcolor{#6B6680}{0} & \textcolor{#FB923C}{\frac{7}{4}} & \frac{7}{2} & \textcolor{#C4B5FD}{\frac{35}{4}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FB923C}{18} & \textcolor{#C4B5FD}{18} \end{array}\right]
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
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ 2 & -1 & 1 & \textcolor{#C4B5FD}{5} \\ -1 & 2 & 2 & \textcolor{#C4B5FD}{1} \end{array}\right] \xrightarrow{R_3 + R_1}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ 2 & -1 & 1 & \textcolor{#C4B5FD}{5} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{3} & \textcolor{#FDE68A}{1} & \textcolor{#FDE68A}{-1} \end{array}\right] \xrightarrow{2R_1 - R_2}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{3} & \textcolor{#FDE68A}{-3} & \textcolor{#FDE68A}{-9} \\ 0 & 3 & 1 & \textcolor{#C4B5FD}{-1} \end{array}\right] \xrightarrow{R_3 - R_2}
$$

$$
\left[\begin{array}{ccc|c} 1 & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ 0 & 3 & -3 & \textcolor{#C4B5FD}{-9} \\ \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{0} & \textcolor{#FDE68A}{4} & \textcolor{#C4B5FD}{8} \end{array}\right]
$$

**Final triangular form:**

$$
\left[\begin{array}{ccc|c} \textcolor{#FB923C}{1} & 1 & -1 & \textcolor{#C4B5FD}{-2} \\ \textcolor{#6B6680}{0} & \textcolor{#FB923C}{3} & -3 & \textcolor{#C4B5FD}{-9} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FB923C}{4} & \textcolor{#C4B5FD}{8} \end{array}\right]
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