# Profile graphics generator

Builds every SVG in `assets/` in the STCH Studio style, with fonts subset and embedded so they render on GitHub.

```bash
cd generator
npm install
node build.js ../assets      # regenerate all SVGs
node preview.js ../README.md ../preview.html   # optional local preview
```

Edit texts and projects directly in `build.js`. Fonts (Unbounded, Inter, Caveat) are under the SIL Open Font License.
