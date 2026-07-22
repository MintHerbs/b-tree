# LU Decomposition

**What is it about?**  
If a square matrix can be written as the product of a lower triangular matrix $L$ and an upper triangular matrix $U$ then $A = LU$ is a LU-Factorisation.

**Triangles:**

$$
\text{Upper triangular} = \begin{bmatrix} a_{11} & a_{12} & a_{13} \\ 0 & a_{22} & a_{23} \\ 0 & 0 & a_{33} \end{bmatrix} \qquad \text{Lower triangular} = \begin{bmatrix} a_{1} & 0 & 0 \\ a_{21} & a_{22} & 0 \\ a_{31} & a_{32} & a_{33} \end{bmatrix}
$$

i.e:

$$
\mathbf{A} = \begin{bmatrix} 1 & 2 \\ 1 & 0 \end{bmatrix} = \underbrace{\begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{1} & \textcolor{#A78BFA}{1} \end{bmatrix}}_{\textcolor{#5B8CFF}{L}} \underbrace{\begin{bmatrix} \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{2} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-2} \end{bmatrix}}_{\textcolor{#FF8FAB}{U}} = \mathbf{\textcolor{#5B8CFF}{L}\textcolor{#FF8FAB}{U}}
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
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{a} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{b} & \textcolor{#5B8CFF}{c} & \textcolor{#A78BFA}{1} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{d} & \textcolor{#FF8FAB}{e} & \textcolor{#FF8FAB}{f} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{g} & \textcolor{#FF8FAB}{h} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{i} \end{bmatrix}
$$

We can also write the triangles for Doolittle's method as:

$$
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
$$

We can also write the triangle for Crout's Method as:

$$
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{22}} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{33}} \end{bmatrix} \qquad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
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
\begin{bmatrix} \textcolor{#5B8CFF}{a} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{b} & \textcolor{#5B8CFF}{c} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{d} & \textcolor{#5B8CFF}{e} & \textcolor{#5B8CFF}{f} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{g} & \textcolor{#FF8FAB}{h} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{i} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix} = \begin{bmatrix} \textcolor{#5B8CFF}{5} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{10} & \textcolor{#5B8CFF}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{10} & \textcolor{#5B8CFF}{5} & \textcolor{#5B8CFF}{3} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{0.8} & \textcolor{#FF8FAB}{0.2} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{2} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
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
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{22}} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{33}} \end{bmatrix} \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
$$

**Step 3:** Multiply $L$ and $U$ just like you would multiply a 3×3 matrix (Row × Column):

$$
A = \begin{bmatrix} \textcolor{#5B8CFF}{L_{11}} & \textcolor{#5B8CFF}{L_{11}}\textcolor{#FF8FAB}{U_{12}} & \textcolor{#5B8CFF}{L_{11}}\textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{22}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{22}}\textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{32}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{23}} + \textcolor{#5B8CFF}{L_{33}} \end{bmatrix}
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
\therefore \textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{4} & \textcolor{#5B8CFF}{-1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{3} & \textcolor{#5B8CFF}{2} & \textcolor{#5B8CFF}{-10} \end{bmatrix} \quad \text{and} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} \\ \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} & \textcolor{#FF8FAB}{5} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#A78BFA}{1} \end{bmatrix}
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
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
$$

**Step 3:** Multiply $L$ and $U$ just like you would multiply a 3×3 matrix (Row × Column):

$$
A = \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{13}}\textcolor{#5B8CFF}{L_{21}} + \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{11}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{12}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{22}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF8FAB}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF8FAB}{U_{23}} + \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
$$

**Step 4:** Compare $LU$ with their respective position in $A$:

$$
\begin{bmatrix} 1 & 1 & 1 \\ 4 & 3 & -1 \\ 3 & 5 & 3 \end{bmatrix} = \begin{bmatrix} \textcolor{#FF5FA2}{U_{11}} & \textcolor{#FF5FA2}{U_{12}} & \textcolor{#FF5FA2}{U_{13}} \\ \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF5FA2}{U_{11}} & \textcolor{#5B8CFF}{L_{21}}\textcolor{#FF5FA2}{U_{12}} + \textcolor{#FF5FA2}{U_{22}} & \textcolor{#FF5FA2}{U_{13}}\textcolor{#5B8CFF}{L_{21}} + \textcolor{#FF5FA2}{U_{23}} \\ \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF5FA2}{U_{11}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF5FA2}{U_{12}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF5FA2}{U_{22}} & \textcolor{#5B8CFF}{L_{31}}\textcolor{#FF5FA2}{U_{13}} + \textcolor{#5B8CFF}{L_{32}}\textcolor{#FF5FA2}{U_{23}} + \textcolor{#FF5FA2}{U_{33}} \end{bmatrix}
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
\therefore \textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{4} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{3} & \textcolor{#5B8CFF}{-2} & \textcolor{#A78BFA}{1} \end{bmatrix} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{1} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-1} & \textcolor{#FF8FAB}{-5} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{-10} \end{bmatrix}
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
\begin{bmatrix} 5 & 4 & 1 \\ 10 & 9 & 4 \\ 10 & 13 & 15 \end{bmatrix} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{21}} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{L_{31}} & \textcolor{#5B8CFF}{L_{32}} & \textcolor{#A78BFA}{1} \end{bmatrix} \begin{bmatrix} \textcolor{#FF8FAB}{U_{11}} & \textcolor{#FF8FAB}{U_{12}} & \textcolor{#FF8FAB}{U_{13}} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{22}} & \textcolor{#FF8FAB}{U_{23}} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{U_{33}} \end{bmatrix}
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
\textcolor{#5B8CFF}{L} = \begin{bmatrix} \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{2} & \textcolor{#A78BFA}{1} & \textcolor{#6B6680}{0} \\ \textcolor{#5B8CFF}{2} & \textcolor{#5B8CFF}{5} & \textcolor{#A78BFA}{1} \end{bmatrix} \quad \text{and} \quad \textcolor{#FF8FAB}{U} = \begin{bmatrix} \textcolor{#FF8FAB}{5} & \textcolor{#FF8FAB}{4} & \textcolor{#FF8FAB}{1} \\ \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{1} & \textcolor{#FF8FAB}{2} \\ \textcolor{#6B6680}{0} & \textcolor{#6B6680}{0} & \textcolor{#FF8FAB}{3} \end{bmatrix}
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