import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const result=await build({entryPoints:['game.js'],bundle:true,write:false,minify:true,
  legalComments:'inline',format:'iife',target:['es2020']});
const [html,css,turtle]=await Promise.all([
  readFile('template.html','utf8'),readFile('style.css','utf8'),readFile('assets/turtle.png')]);
const output=html.replace('/* INLINE_CSS */',()=>css)
  .replaceAll('TURTLE_DATA_URL',()=> 'data:image/png;base64,'+turtle.toString('base64'))
  .replace('/* INLINE_JS */',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await writeFile('../../donutCatcher/donutCatcher.html',output);
console.log(`Built standalone donutCatcher.html (${(Buffer.byteLength(output)/1024/1024).toFixed(2)} MB)`);
