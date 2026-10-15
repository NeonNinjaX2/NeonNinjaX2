# Stick Run

A platformer and stick-fight game: a white stick figure on a black background,
in the style of stick-figure animation videos. It runs in any web browser,
including on an iPad, with nothing to install.

## Modes

- **Story**: 14 levels that teach running, jumping, wall jumps, dashing,
  double jumping, moving platforms, checkpoints and fighting. Progress is saved
  in your browser.
- **Arena**: survive waves of red stick enemies with 5 hit points. You get one
  point back after every wave. Chain hits for a combo bonus. Your best wave is
  saved.
- **Level Editor**: paint your own level, test it with Play, and swap levels
  with friends using share codes.

## Playing on iPad

Open the game in Safari, then tap **Share → Add to Home Screen**. It then
launches full screen like an app. Touch controls appear on screen: ◀ ▶ on the
left, and **JUMP**, **HIT** and **DASH** on the right. A keyboard connected to
the iPad works too.

## Controls

| Action  | Keyboard               | Touch       |
|---------|------------------------|-------------|
| Run     | ← → or A D             | ◀ ▶         |
| Jump    | Space, W, ↑ or Z       | JUMP        |
| Dash    | Shift, X or K          | DASH        |
| Attack  | J or C                 | HIT         |
| Restart | R                      | pause menu  |
| Pause   | P or Esc               | II button   |
| Mute    | M                      |             |

- Hold jump to go higher and tap it for a short hop. Jump while touching a
  wall to wall-jump.
- Press jump again in mid-air to double jump (with a front flip). It unlocks
  at story level 5 and refills when you land, grab a wall, stomp or hit an enemy.
- You get one dash per jump. It refills when you land, grab a wall or hit an
  enemy. Dashing through an enemy hurts it.
- Press attack repeatedly on the ground for a jab, cross, kick combo. In the
  air it's a flying kick.
- Land on an enemy to stomp it. Punch a thrown shot to send it back.

## Enemies

| Enemy   | What it does                                        |
|---------|-----------------------------------------------------|
| Walker  | Patrols back and forth. Touching it hurts.          |
| Flyer   | Hovers in a loop. Touching it hurts.                |
| Shooter | Throws shots when it can see you. Takes 2 hits.     |
| Fighter | Chases you and punches. Watch for the "!" wind-up. Takes 3 hits. |

## Level editor

On a touchscreen, paint with one finger and move around with two. With a
mouse, click to paint, right-click to erase, and scroll or use the arrow keys
to move. **Share** gives you a code that starts with `SR1:`. A friend pastes it
with **Load**.

## Map format

The story levels are text maps in the `LEVELS` list in `index.html`:

```
#  block              ^  floor spike       v  ceiling spike
P  player start       E  exit door         *  coin
C  checkpoint flag    =  platform ↔        ~  platform ↕
:  platform stop (invisible; turns moving platforms around)
g  walker             f  flyer             s  shooter        F  fighter
.  empty
```

The player is about 1½ blocks tall, so leave at least 2 empty rows anywhere
they need to walk under something. A normal jump clears about 3 blocks up and
5 blocks across. A double jump reaches about 5 blocks up and 9 across, and
adding a dash makes it about 13 across.
