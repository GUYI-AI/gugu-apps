import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createComputerProgram} from '../app/program/program-core.mjs';
import {DRIVER_RELEASES} from '../runtime/driver-resources.mjs';
const specs=JSON.parse(await readFile(new URL('../app/program/tool-specs.json',import.meta.url))).tools;
const meta={'gugu/agent':'user:33333333-3333-4333-8333-333333333333','gugu/sessionId':'11111111-1111-4111-8111-111111111111'};
function fixture(){
 const calls=[];const receipt={content:[{type:'text',text:'native accessibility result'}],structuredContent:{effect:'confirmed',route:'accessibility',delivery:{mode:'background'},evidence:[{kind:'value_readback',detail:'native control read back'}]}};
 const native={async callTool(name,args){if(name==='check_permissions')return{structuredContent:{accessibility:true,screen_recording:true}};
  if(name==='list_apps')return{structuredContent:{apps:[{pid:44,bundle_id:'com.google.Chrome',running:true}]}};
  if(name==='list_windows')return{structuredContent:{windows:[{pid:44,window_id:3,title:'browser'}]}};
  calls.push({name,args});return structuredClone(receipt);},dispose(){}};
 const program=createComputerProgram({specs,native,platform:'darwin',protectedHost:()=>({pids:new Set([10]),names:new Set(['gugu'])})});
 return{program,calls,receipt,call:(name,args)=>program.call({name,arguments:args,_meta:meta})};
}
test('background location actions and a complete batch reach the native semantic boundary without refusal or a replacement shortcut',async()=>{
 const f=fixture();try{
  for(const keys of [['cmd','l'],['command','L'],['meta','l']]){
   const result=await f.call('hotkey',{pid:44,window_id:3,keys});assert.deepEqual(result,f.receipt);assert.deepEqual(f.calls.at(-1).args.keys,keys);
  }
  await f.call('type_text',{pid:44,window_id:3,text:'https://example.test/'});await f.call('press_key',{pid:44,window_id:3,key:'Return'});
  const steps=[{hotkey:{keys:['cmd','l']}},{type_text:{text:'https://example.test/'}},{press_key:{key:'Return'}}];
  const result=await f.call('run_steps',{pid:44,window_id:3,steps});assert.deepEqual(result,f.receipt);assert.equal(f.calls.at(-1).name,'run_steps');assert.deepEqual(f.calls.at(-1).args.steps,steps);
 }finally{f.program.dispose();}
});
test('location foreground delivery retains the explicit consent boundary',async()=>{
 const f=fixture();try{
  const args={pid:44,window_id:3,keys:['cmd','l'],delivery_mode:'foreground'};
  assert.equal((await f.call('hotkey',args)).structuredContent.code,'needs_confirmation');assert.equal(f.calls.length,0);
  assert.deepEqual(await f.call('hotkey',{...args,confirmed:true}),f.receipt);assert.equal(f.calls.at(-1).args.delivery_mode,'foreground');assert.equal('confirmed' in f.calls.at(-1).args,false);
 }finally{f.program.dispose();}
});
test('the App pins the maintained fork revision that contains the location fix',async()=>{
 const metadata=JSON.parse(await readFile(new URL('../native/driver/patched-macos.json',import.meta.url)));
 assert.equal(metadata.maintainedRepository,'https://github.com/GUYI-AI/cua.git');assert.equal(metadata.revision,'0.36.0-gugu.2');
 for(const arch of ['arm64','x64']){const release=DRIVER_RELEASES['darwin-'+arch];assert.equal(release.revision,metadata.revision);assert.match(release.url,/^https:\/\/github\.com\/GUYI-AI\/cua\/releases\/download\//);assert(release.url.includes(metadata.revision));}
 assert.equal(DRIVER_RELEASES['win32-x64'].revision,'0.36.0');
});
