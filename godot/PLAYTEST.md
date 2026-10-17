# Playtesting the Godot version

The Godot build is at **/soil/game/godot** on the site (and on every Vercel preview). It shares your
farm and grade level with the current game at /soil/game. Please play it on a real computer: the
cloud machine that built it has no graphics card, so it could only check that things work, not how
smoothly they run.

Tick each box, and note anything that looks or feels different from the current game.

## How it runs
- [ ] It loads in a reasonable time (first visit downloads about 10 MB).
- [ ] Walking around the farm feels smooth. If it doesn't, try these and note which helps most:
  `/godot/index.html?debug=noshadow`, `?debug=noland`, `?debug=nonpcs`.
- [ ] Same on the slowest computer students will use (a school Chromebook, if you have one).
- [ ] On a phone or tablet: the on-screen arrows, ✋, and A buttons work.

## A day on the farm
- [ ] Main menu: Start, Continue, and New Game (farmer, science, time, calendar) all work.
- [ ] Clear weeds (scythe), till (hoe), plant carrots, water, and run a lab test.
- [ ] Watch the tile inspector update; the expected grade shows on a growing crop.
- [ ] Go to bed in the house; the morning summary appears and crops have grown.
- [ ] Harvest something; ship it in the bin; get paid the next morning.
- [ ] Buy seeds and a compost bin at Seed & Soil Co.; build it (Space) and pick it up (P).

## Town and journal
- [ ] Walk to town; name tags appear near people; talk to everyone (E).
- [ ] Give a gift; accept a quest; take a notice-board request; check the quest log (Q).
- [ ] Find a critter and observe it; read it in the Nature Journal (J).
- [ ] Change the grade level in the journal: the site's grade picker changes too.

## Saves
- [ ] Play a while in Godot, then open /soil/game: the same farm continues there.
- [ ] And the other way around.
- [ ] Pause menu (Esc): switch a science feature off, then Save & quit; Continue keeps it.

When it all checks out, say the word and Godot becomes /soil/game.
