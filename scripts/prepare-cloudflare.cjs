const {copyFileSync,existsSync}=require('node:fs');
const {resolve}=require('node:path');
const output=resolve(__dirname,'../dist/browser');
if(!existsSync(resolve(output,'index.html')))throw Error('Build the Angular frontend first.');
copyFileSync(resolve(__dirname,'../cloudflare/worker.mjs'),resolve(output,'_worker.js'));
copyFileSync(resolve(__dirname,'../cloudflare/_routes.json'),resolve(output,'_routes.json'));
console.log('Cloudflare Pages build prepared in dist/browser.');
