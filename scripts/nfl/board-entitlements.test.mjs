import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function access(profile, entitlements=[], signedIn=true) {
 const query={ select(){return query},eq(){return query},in(){return query},maybeSingle:async()=>({data:profile,error:null}),then(resolve){resolve({data:entitlements,error:null})} };
 const client={auth:{getUser:async()=>({data:{user:signedIn?{id:'verified'}:null}})},from(){return query}};
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auth/entitlements.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:()=>({createClient:async()=>client}),console,Date,Number});
 return exports.hasKofSportsProAccess();
}
test('existing anonymous/free/expired rules remain denied',async()=>{
 assert.equal(await access(null,[],false),false);assert.equal(await access({role:'user',membership:'free'}),false);
 assert.equal(await access({role:'user',membership:'premium',membership_expires_at:'2000-01-01'}),false);
});
test('admin, grandfathered Premium and current Pro/trials retain board eligibility',async()=>{
 assert.equal(await access({role:'admin'}),true);
 assert.equal(await access({role:'user',membership:'premium',membership_expires_at:null}),true);
 assert.equal(await access({role:'user',membership:'premium',membership_expires_at:'2100-01-01'}),true);
 assert.equal(await access(null,[{product:'kofsports_pro',status:'active',starts_at:'2020-01-01',expires_at:null}]),true);
 for(const status of ['active','trialing']) assert.equal(await access(null,[{product:'kofsports_pro',status,starts_at:'2020-01-01',expires_at:'2100-01-01'}]),true);
});
test('future and expired explicit entitlements do not qualify',async()=>{
 assert.equal(await access(null,[{product:'kofsports_pro',status:'active',starts_at:'2100-01-01',expires_at:null}]),false);
 assert.equal(await access(null,[{product:'kofsports_pro',status:'active',starts_at:'2020-01-01',expires_at:'2021-01-01'}]),false);
});
