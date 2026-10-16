class_name U32
## JavaScript's 32-bit integer math, on Godot's 64-bit ints. Every seed-mixing site in the
## TS engine (Math.imul, ^, >>> 0) goes through these so seeded results match exactly.

const M := 0xFFFFFFFF


## Math.imul(a, b) >>> 0. Splits a so no product overflows 64 bits.
static func imul(a: int, b: int) -> int:
	a &= M
	b &= M
	var lo := (a & 0xFFFF) * b
	var hi := ((a >> 16) * b) & 0xFFFF
	return (lo + (hi << 16)) & M


## x >>> 0 for any integer (JS ToUint32).
static func u(x: int) -> int:
	return x & M
