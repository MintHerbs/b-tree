# Floating Point

It allows an arbitrary number of decimal places to the right of the decimal point.

Example: 0.5 \* 0.25 = 0.125

Computers use a form of scientific notation for floating point representation.

* Consists of 3 fixed-sized fields.
* Standard arrangement
* Significand refers to the fractional part of the number.
* The sign field represents the sign:

  * 1: Negative
  * 0: Positive
* Size of the exponent determines the range of values that can be represented.
* Size of the significand determines the precision of the representation.
* Terms: 

  * **Range:** Difference between the largest and smallest values that can be expressed.
  * **Accuracy:** How closely a numeric representation approximates a true value.
  * **Precision:** Indicates how much information we have about a value.
* IEEE

  * Established standard for floating point numbers.
  * 2 types: 

    * Single precision
    * Double precision
  * IEEE 754- Single Precision Standard:

    * 32 bits long
    * 8 bit exponent (bias of 127)
    * 23 bit significand
    * known as float in C++
  * IEEE 754- Double Precision standard:

    * 64 bit long
    * 11 bit exponent (bias of 1023)
    * 52 bit significand
    * Known as double in C++
  * Steps:

    * Convert number to binary form
    * Convert to scientific notation
    * Add bias to exponent
    * Remove the implied one from significand.
  * Example:
  * Using single:

    * Exponent of 255 indicates a special value (true for double precision as well)
    * If significand=0, the value is infinity.
    * If significand is non-zero, the value is NAN (not a number) often used to flag an error.
  * Why normalize the exponent through addition of the bias?

    * To cater for both positive and negative exponents.
  * Error:

    * The model is finite.
    * Real numbers are infinite, the model can only approximate a real value.
    * At some point every model breaks down, introducing errors in calculations.
    * Using a greater number of bits reduces these errors but they can never be totally eliminated.
    * Overflow and underflow causes programs to crash.
  * In C++:

    * int - 2's complement
    * unsigned int - plain binary
    * Float - single IEEE
    * Double - Double IEEE
