class_name Rng
## Small seeded PRNG (mulberry32), identical to src/game/rng.ts, so a game replays exactly.

const M := 0xFFFFFFFF


## Returns [value in 0..1, next seed].
static func next_random(seed: int) -> Array:
	var t := (seed + 0x6D2B79F5) & M
	var next_seed := t
	t = U32.imul(t ^ (t >> 15), t | 1)
	t = (t ^ (t + U32.imul(t ^ (t >> 7), t | 61))) & M
	return [float((t ^ (t >> 14)) & M) / 4294967296.0, next_seed]
