# Stick Run

A tiny platformer: a white stick figure on a black background, in the style of
stick-figure animation videos.

**To play:** open `index.html` in any web browser. You don't need to install
anything.

## Controls

| Action  | Keyboard               | Touch         |
|---------|------------------------|---------------|
| Run     | ← → or A D             | ◀ ▶ buttons   |
| Jump    | Space, W, ↑ or Z       | JUMP          |
| Dash    | Shift, X or K          | DASH          |
| Restart | R                      |               |
| Pause   | P or Esc               |               |
| Mute    | M                      |               |

Hold jump to go higher and tap it for a short hop. Jump while touching a wall to
wall-jump. You get one dash per jump, and it refills when you land or grab a wall.

## Making your own levels

Levels are text maps in the `LEVELS` list at the top of the script in
`index.html`:

```
#  solid block        ^  floor spike      v  ceiling spike
P  player start       E  exit door        *  coin
.  empty space
```

To add a level, copy an existing entry and edit the map. The player is about
1½ blocks tall, so leave at least 2 empty rows anywhere they need to walk
under something. A normal jump clears about 3 blocks up and 5 blocks across.
