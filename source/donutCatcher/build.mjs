import {build} from 'esbuild';
import {compile} from 'svelte/compiler';
import {readFile,writeFile} from 'node:fs/promises';
const svelte={name:'svelte',setup(build){build.onLoad({filter:/\.svelte$/},async({path})=>{
 const source=await readFile(path,'utf8');
 const compiled=compile(source,{filename:path,generate:'client',css:'injected',dev:false});
 if(compiled.warnings.length)throw Error(compiled.warnings.map(w=>`${w.code}: ${w.message}`).join('\n'));
 return{contents:compiled.js.code,loader:'js'};
});}};
const result=await build({entryPoints:['main.js'],bundle:true,write:false,minify:true,plugins:[svelte],
 loader:{'.webp':'dataurl'},conditions:['browser'],mainFields:['browser','module','main'],
 legalComments:'inline',format:'iife',target:['es2020'],metafile:true});
const [html,css]=await Promise.all([readFile('template.html','utf8'),readFile('style.css','utf8')]);
const output=html.replace('/* INLINE_CSS */',()=>css)
 .replace('/* INLINE_JS */',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await writeFile('../../donutCatcher/donutCatcher.html',output);
console.log(`Built standalone Svelte + Three.js game (${(Buffer.byteLength(output)/1024/1024).toFixed(2)} MB)`);
console.log(`Bundled ${Object.keys(result.metafile.inputs).filter(p=>p.endsWith('.webp')).length} image assets. Svelte compiler: zero warnings.`);
