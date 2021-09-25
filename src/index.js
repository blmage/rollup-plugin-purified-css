import { dirname } from 'path';
import { createFilter } from '@rollup/pluginutils';
import purify from 'purify-css';

/**
 * @typedef {object} Options
 * @property {string} [output] The path of the file in which to export the bundled CSS.
 * @property {string} [include] A glob pattern for the CSS files to include in the bundle.
 * @property {string} [exclude] A glob pattern for the CSS files to exclude from the bundle.
 * @property {boolean} [minify] Whether CSS rules should be minified.
 * @property {string[]} [classWhitelist] A list of the CSS classes that should not be removed.
 * @property {boolean} [logStats] Whether tree-shaking statistics should be logged.
 * @property {boolean} [logRejected] Whether a list of the removed CSS rules should be logged.
 */

/**
 * @param {Options} options A set of plugin options.
 * @returns {object} The plugin object.
 */
export default function css(options = {}) {
  const filter = createFilter(options.include || [ '**/*.css' ], options.exclude);
  const styles = {};
  const sortedStyleIds = [];
  let changeCount = 0;

  return {
    name: 'css',

    transform(code, id) {
      if (!filter(id)) {
        return;
      }

      if (!sortedStyleIds.includes(id)) {
        sortedStyleIds.unshift(id);
      }

      if (styles[id] !== code && (styles[id] || code)) {
        styles[id] = code;
        changeCount++;
      }

      return '';
    },

    writeBundle(outputOptions, bundle) {
      if (!changeCount) {
        return;
      }

      let css = '';
      changeCount = 0;

      for (let i = 0; i < sortedStyleIds.length; i++) {
        css += styles[sortedStyleIds[i]] || '';
      }

      if (!css.length) {
        return;
      }

      let destinationPath = options.output;

      const outputDir = outputOptions.dir
        ? outputOptions.dir
        : dirname(outputOptions.file);

      const outputFiles = Object.keys(bundle)
        .map(fileName => outputDir + '/' + fileName);

      if (typeof destinationPath !== 'string') {
        destinationPath = (
          outputOptions.file
          || outputFiles[0]
          || (outputDir + '/bundle.js')
        );

        if (destinationPath.endsWith('.js')) {
          destinationPath = destinationPath.slice(0, -3);
        }

        destinationPath = destinationPath + '.css';
      }

      const bundledCss = purify(
        outputFiles,
        css,
        {
          output: destinationPath,
          minify: !!options.minify,
          info: !!options.logStats,
          rejected: !!options.logRejected,
          whitelist: Array.isArray(options.classWhitelist) ? options.classWhitelist : [],
        },
      );

      this.emitFile({
        type: 'asset',
        fileName: destinationPath,
        source: bundledCss,
      });
    },
  };
}
