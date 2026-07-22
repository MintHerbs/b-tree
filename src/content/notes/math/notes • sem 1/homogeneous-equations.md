# Homogeneous Equations

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