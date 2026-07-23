# Bases

## Base 10

* Decimal

* Normal Number System

* Digits used: 0-9

## Base 2

* Binary

* Machine code: Computers understand only binary

* Difficult to read by humans as they are very long.

* For compactness hexadecimal is used.

* Digits used are '1' and '0'.

## Base 16

* Hexadecimal

* Used to represent colors and MAC addresses.

* Digits used are: 0-9 and A-F

  * A: 10

  * B: 11

  * C: 12

  * D: 13

  * E: 14

  * F: 15

## Base 8

* Octal

* Digits used: 0-7

## Base 4

* Digits used: 0-3

# Fractional Values

They can be approximated in all base systems. However, there is no guarantee of finding exact representations under all radices.

Example:
Representing 0.5 in denary to base 3.

They are shown by non-zero digits to the right of the decimal point (radix point).

# Conversions

## Converting from base 10 to base 2

**Steps:**

1. Divide the number by 2 until the quotient is equal to 1.
2. Read the number in the direction of the arrow.
   Example 1: Converting 37 to binary

Example 2: Converting 0.55 to binary

1. Multiply the fractional part until the product is zero or the binary is long enough.
2. Read the number in the direction of the arrow.

## Converting from base 10 to base 16

Example: Converting 37 to base 16

## Converting from base 8 to base 10

* Multiply each term by the base.

* Add all products.

  Example: Converting 235 to base 10

## Converting from base 2 to base 10

## Converting from base 2 to base 8

* Make groups of 3 digits.

* Convert using multiplication method.

* Add zeroes where needed.

## Converting from base 2 to base 4

* Make groups of 2 digits.

* Convert using multiplication.

* Add zeroes where needed.

## Converting from base 2 to base 16

* Make group of 4 digits.

* Convert using multiplication method.

* Add zeroes where needed.

# Registers

## Unsigned Integer

* Largest number in an 8-bit register: 1111 1111 : 255

* Smallest number in an 8-bit register: 0000 0000 : 0

## Signed Integer

Signed Magnitude

* MSB: Most Significant Bit
* 1: Negative
* 0: Positive
* Found at the start of the byte

The first bit shows whether the number is positive or negative. It does not hold any value. The computer has to compare signs in order to perform addition or subtraction.
How?

Computers perform arithmetic operations on signed magnitude numbers in the same way as humans:

* Ignoring signs when performing a calculation.

* Apply appropriate sign after calculation is complete.
  Example: 76+46

If the sum does not fit the register, overflow occurs.

Example: 107+46

There is no room for the extra bit and so the answer becomes 25 which is incorrect.

**Solution:**

* Use smaller numbers or

* Bigger Registers

**Rules for addition:**

1. If the signs are the same, just add the absolute values together and use the same sign for the result.
   Example: -46 + -25
   The signs are the same, so just add the 2 numbers and apply the negative sign when the operation is done.

2. If the signs are different, use the sign of the larger number. Subtract the larger from the smaller (subtraction).
   Example: 46 + -25

**Strengths:**

* Easy to understand.

**Disadvantage:**

* Makes computer hardware more complicated/slower.

  * Separate circuitries are needed for subtraction and addition.

* The CPU needs to compare the 2 numbers first to determine whether to add or subtract and determine the correct sign.

* The range is compromised.

  * With the same number of bits, unsigned integers can express twice as many postive values as signed integers.

* 2 representations of '0':

  * 0000 0000

  * 1000 0000

##
