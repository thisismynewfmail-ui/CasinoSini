# Genie's Gold — reel symbol artwork

Each reel symbol in Genie's Gold is rendered from a real image file in this
folder. The game loads them automatically at runtime by symbol **id**:

```
/static/img/slots/<id>.svg
```

The symbol ids are:

| id        | meaning            |
|-----------|--------------------|
| club      | ♣ low card         |
| diamond   | ♦ low card         |
| heart     | ♥ low card         |
| spade     | ♠ low card         |
| scorpion  | mid pay            |
| sword     | mid pay            |
| idol      | high pay (crown)   |
| chest     | high pay           |
| lamp      | top pay            |
| wild      | substitutes (genie)|
| scatter   | free-spins trigger |

## Using your own images

Just replace any `<id>.svg` in this folder with your own art of the same name.

- **SVG** works out of the box.
- **PNG/JPG**: drop in `<id>.png` and change `SYMBOL_IMG_EXT` from `'.svg'` to
  `'.png'` near the top of the `SYMBOL ARTWORK` section in
  `templates/games/geniesgold.html`.

Recommended: square, transparent background, ~200×200 px or larger. Images are
scaled to fit each reel cell while preserving aspect ratio.

## Fallback

If an image is missing or fails to load, the game falls back to the original
Unicode glyph for that symbol, so the reels always render. This means you can
add real art for just a few symbols and leave the rest as glyphs if you like.

The default SVGs shipped here are simple placeholder tiles — replace them with
real artwork whenever you're ready.
