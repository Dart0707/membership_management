/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const ctx={exports:{},Intl,Date,Error};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/gym-members.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);
const {checkInMemberForDate,getCheckInMessage,getGymDate}=ctx.exports;
const monthly=()=>({id:'test',plan:'1 Month',activity:'Gym',checkIns:5,expiryDate:'2026-12-19',remainingPasses:null});
test('monthly repeats and browser reloads count one attendance day',()=>{
 let m=checkInMemberForDate(monthly(),'2026-11-19');
 for(let i=0;i<4;i++)m=checkInMemberForDate(JSON.parse(JSON.stringify(m)),'2026-11-19');
 assert.equal(m.checkIns,6); assert.equal(m.remainingPasses,null);
 assert.equal(m.lastCheckInDate,'2026-11-19');
 m=checkInMemberForDate(m,'2026-11-20');assert.equal(m.checkIns,7);
});
test('pass bundle repeats only deduct once and allow final-day reentry',()=>{
 let m=checkInMemberForDate({...monthly(),plan:'Bundle',remainingPasses:1},'2026-11-19');
 assert.equal(m.remainingPasses,0);assert.equal(m.checkIns,6);
 m=checkInMemberForDate(m,'2026-11-19');assert.equal(m.checkIns,6);
 assert.throws(()=>checkInMemberForDate(m,'2026-11-20'),/No passes/);
});
test('legacy same-day pass scans are recognized without another deduction',()=>{
 const m={...monthly(),remainingPasses:0,lastPassDate:'2026-11-19'};
 assert.equal(checkInMemberForDate(m,'2026-11-19'),m);
});
test('expired memberships cannot reenter even if already checked in',()=>{
 assert.throws(()=>checkInMemberForDate({...monthly(),expiryDate:'2026-11-18',lastCheckInDate:'2026-11-19'},'2026-11-19'),/expired/);
});
test('both plan types receive the general repeat message',()=>{
 assert.match(getCheckInMessage(true,null),/already checked in today/);
 assert.equal(getCheckInMessage(true,3),getCheckInMessage(true,null));
 assert.doesNotMatch(getCheckInMessage(false,null),/already/);
});
test('day eligibility changes at Philippine midnight',()=>{
 const before=getGymDate(new Date('2026-11-19T15:59:59Z'));
 const after=getGymDate(new Date('2026-11-19T16:00:00Z'));
 const m=checkInMemberForDate(monthly(),before);
 assert.equal(checkInMemberForDate(m,before).checkIns,6);
 assert.equal(checkInMemberForDate(m,after).checkIns,7);
});
