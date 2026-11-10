import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function handler(secret='test-secret',fail=false){
 const calls={admin:0,refresh:0,revalidate:0};const exports={};
 const code=ts.transpileModule(fs.readFileSync('app/api/cron/nhl-team-betting-records/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,process:{env:{CRON_SECRET:secret}},console:{error(){}},require(name){
  if(name==='next/server')return {NextResponse:{json:(body,options={})=>({body,status:options.status??200})}};
  if(name==='next/cache')return {revalidateTag:()=>{calls.revalidate++;}};
  if(name.endsWith('/supabase/admin'))return {createAdminClient(){calls.admin++;return {};}};
  if(name.endsWith('/team-betting-cache'))return {async refreshStoredTeamRecords(){calls.refresh++;if(fail)throw Error('source unavailable');return {season:2026,throughDate:'2026-11-08',games:274};}};
  if(name.endsWith('.json'))return {season:2026,games:[]};throw Error(name);
 }});
 return {calls,get:authorization=>exports.GET({headers:{get:()=>authorization}})};
}
test('cron rejects missing configuration and unauthorized callers before creating a privileged client',async()=>{
 const missing=handler('');assert.equal((await missing.get(null)).status,503);assert.equal(missing.calls.admin,0);
 for(const auth of [null,'Bearer wrong']){const h=handler();assert.equal((await h.get(auth)).status,401);assert.equal(h.calls.admin,0);assert.equal(h.calls.refresh,0);}
});
test('authorized success refreshes and immediately invalidates the shared page cache',async()=>{
 const h=handler();const r=await h.get('Bearer test-secret');assert.equal(r.status,200);assert.equal(r.body.games,274);assert.equal(h.calls.refresh,1);assert.equal(h.calls.revalidate,1);
});
test('source failure returns a failed job and does not invalidate the previous verified cache',async()=>{
 const h=handler('test-secret',true);const r=await h.get('Bearer test-secret');assert.equal(r.status,500);assert.equal(r.body.ok,false);assert.equal(h.calls.revalidate,0);
});
