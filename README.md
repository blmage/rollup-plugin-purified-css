# rollup-plugin-purified-css
A [rollup](https://github.com/rollup/rollup) plugin for bundling imported CSS.

CSS rules are automatically tree-shaken using [purifycss](https://github.com/purifycss/purifycss/),
based on the other source files that make up the bundle. 
