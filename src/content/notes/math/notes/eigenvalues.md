# Heterogeneous Equations

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