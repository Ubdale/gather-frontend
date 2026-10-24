import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

test('Cloudflare proxy preserves auth, request bodies and response cookies',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async request=>{
   assert.equal(request.url,'https://gather-backend-t3g1.onrender.com/api/auth/login');
   assert.equal(request.headers.get('Origin'),'https://gather.pages.dev');
   assert.equal(request.headers.get('Cookie'),'gather_session=test');
   assert.deepEqual(await request.json(),{email:'test@example.test'});
   return new Response('{}',{status:201,headers:{'Set-Cookie':'gather_session=new; Path=/api; Secure; HttpOnly; SameSite=Lax'}});
  };
  const response=await worker.fetch(new Request('https://gather.pages.dev/api/auth/login',{method:'POST',headers:{Origin:'https://gather.pages.dev',Cookie:'gather_session=test','Content-Type':'application/json'},body:JSON.stringify({email:'test@example.test'})}),{});
  assert.equal(response.status,201);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.match(response.headers.get('Set-Cookie'),/HttpOnly/);
 }finally{globalThis.fetch=original;}
});
test('Cloudflare proxy preserves byte-range audio responses and query strings',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async request=>{
   assert.equal(request.headers.get('Range'),'bytes=0-3');assert.ok(request.url.endsWith('/api/audio?version=1'));
   return new Response(new Uint8Array([1,2,3,4]),{status:206,headers:{'Content-Type':'audio/webm','Content-Range':'bytes 0-3/20'}});
  };
  const response=await worker.fetch(new Request('https://gather.pages.dev/api/audio?version=1',{headers:{Range:'bytes=0-3'}}),{});
  assert.equal(response.status,206);assert.equal(response.headers.get('Content-Range'),'bytes 0-3/20');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3,4]);
 }finally{globalThis.fetch=original;}
});
test('Cloudflare serves non-API paths through Pages assets',async()=>{
 const response=await worker.fetch(new Request('https://gather.pages.dev/gather/feed'),{ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname)}});
 assert.equal(await response.text(),'/gather/feed');
});
test('Cloudflare upstream failures return a noncached JSON error',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>{throw Error('Network failure');};const response=await worker.fetch(new Request('https://gather.pages.dev/api/health'),{});assert.equal(response.status,502);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.ok((await response.json()).message);}finally{globalThis.fetch=original;}
});
