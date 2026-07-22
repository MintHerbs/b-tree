# Echelon Form & Reduced Echelon Form

**What is it about?**

**Row Echelon Form (REF):**
1. All zero rows must be at the bottom.
2. Each leading entry of a row is in a column to the right of the leading entry in the row above it.
3. All entries in a column below a leading entry is a zero.

**Reduced Echelon Form (REF):**
1. Leading entries are 1 (Unity).
2. Leading 1's are the only non-zero entry in a column.

$$
\text{Echelon Form:} \quad \begin{bmatrix} \textcolor{#FB923C}{x} & x & x \\ \textcolor{#6B6680}{0} & \textcolor{#FB923C}{x} & x \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FB923C}{x} \end{bmatrix} \qquad \text{Reduced Echelon Form:} \quad \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & 2 \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & 4 \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \end{bmatrix}
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