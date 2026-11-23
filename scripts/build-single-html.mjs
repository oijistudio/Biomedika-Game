import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const distHtmlPath = path.join(distDir, 'index.html');
const outSinglePath = path.join(distDir, 'nano-medika-single.html');

if (!fs.existsSync(distHtmlPath)) {
  throw new Error('dist/index.html not found. Run "vite build" first.');
}

let html = fs.readFileSync(distHtmlPath, 'utf8');

// 1. Inline compiled CSS assets from dist/assets/*.css (any attribute order)
html = html.replace(/<link\b[^>]*>/gi, (tag) => {
  if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
  const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
  if (!hrefMatch) return tag;
  const cleanRel = hrefMatch[1].replace(/^\//, '');
  const cssPath = path.join(distDir, cleanRel);
  if (!fs.existsSync(cssPath)) return tag;
  const css = fs.readFileSync(cssPath, 'utf8').replace(/<\/style>/gi, '<\\/style>');
  return `<style>${css}</style>`;
});

// 2. Bundle src/main.tsx as self-contained IIFE via esbuild so it works even on file://
// CSS is already compiled by Vite + Tailwind v4 and inlined above, so stub .css imports cleanly.
const stubCssPlugin = {
  name: 'stub-css',
  setup(buildCtx) {
    buildCtx.onLoad({ filter: /\.css$/ }, () => ({
      contents: '',
      loader: 'js',
    }));
  },
};

const result = await build({
  entryPoints: [path.join(rootDir, 'src/main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  write: false,
  plugins: [stubCssPlugin],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

const bundledJs = result.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');

// 3. Remove external module script tags & inject inline IIFE script safely (using replacer fn to avoid $ patterns)
html = html.replace(/<script\b[^>]*><\/script>/gi, (tag) =>
  /\btype=["']module["']/i.test(tag) && /\bsrc=/i.test(tag) ? '' : tag
);

if (!html.includes('</body>')) {
  throw new Error('Closing </body> tag not found in dist/index.html');
}
html = html.replace('</body>', () => `<script>${bundledJs}</script></body>`);

fs.writeFileSync(outSinglePath, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Single-file HTML generated: dist/nano-medika-single.html (${kb} KB)`);
