import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
const admin='00000000-0000-4000-8000-000000000001',member='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',idea='00000000-0000-4000-8000-000000000004';
let db:PGlite;
beforeAll(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('${admin}'),('${member}'),('${other}');`);const sql=readFileSync(new URL('../supabase/migrations/001_workspace.sql',import.meta.url),'utf8').replace('create extension if not exists pgcrypto;','-- PGlite provides gen_random_uuid natively.');await db.exec(sql);await db.exec(readFileSync(new URL('../db/admin-management.sql',import.meta.url),'utf8'));await db.query('insert into profiles(id,username,role) values ($1,$2,$3),($4,$5,$6)',[admin,'brokeadmin','admin',member,'member_one','member']);await db.query('select create_idea($1,$2)',[member,{id:idea,title:'A shared thought',original:'A shared thought',accent:'#d47ea5',ink:'#421329',seed:1}]);},20000);
afterAll(async()=>{await db?.close()});
describe('PostgreSQL migration and permission boundaries',()=>{
 it('member can read ideas but cannot read creator attribution',async()=>{await db.exec(`set role authenticated;set request.jwt.claim.sub='${member}';`);try{const rows=await db.query('select data from ideas');expect(rows.rows).toHaveLength(1);expect(rows.rows[0]).not.toHaveProperty('creator_id');await expect(db.query('select * from private.attribution')).rejects.toThrow(/permission denied/);await expect(db.query('select admin_snapshot($1)',[member])).rejects.toThrow(/permission denied/);await expect(db.query("update profiles set role='admin' where id=$1",[member])).rejects.toThrow(/permission denied/);}finally{await db.exec('reset role;')}});
 it('unauthenticated roles cannot read the archive',async()=>{await db.exec('set role anon;');try{await expect(db.query('select * from ideas')).rejects.toThrow(/permission denied/)}finally{await db.exec('reset role;')}});
 it('version checks reject a stale write',async()=>{await db.query('select update_idea($1,$2,$3,$4)',[member,idea,1,{title:'Revised thought'}]);await expect(db.query('select update_idea($1,$2,$3,$4)',[member,idea,1,{title:'Overwrite'}])).rejects.toThrow(/version_conflict/);});
 it('only admins may soft-delete and restore',async()=>{await expect(db.query('select update_idea($1,$2,$3,$4)',[member,idea,2,{deleted:true}])).rejects.toThrow(/access_denied/);await db.query('select update_idea($1,$2,$3,$4)',[admin,idea,2,{deleted:true}]);await db.exec(`set role authenticated;set request.jwt.claim.sub='${member}';`);try{expect((await db.query('select data from ideas')).rows).toHaveLength(0)}finally{await db.exec('reset role;')}await db.query('select update_idea($1,$2,$3,$4)',[admin,idea,3,{deleted:false}]);});
 it('disabled members lose read and mutation access',async()=>{await db.query('select set_member_access($1,$2,$3)',[admin,member,true]);await db.exec(`set role authenticated;set request.jwt.claim.sub='${member}';`);try{expect((await db.query('select data from ideas')).rows).toHaveLength(0)}finally{await db.exec('reset role;')}await expect(db.query('select update_idea($1,$2,$3,$4)',[member,idea,4,{title:'blocked'}])).rejects.toThrow(/access_denied/);await db.query('select set_member_access($1,$2,$3)',[admin,member,false]);});
 it('invitations are one-use and transactional',async()=>{await db.query('select create_invitation($1,$2)',[admin,'test-hash']);await db.query('select enroll_member($1,$2,$3)',['test-hash',other,'member_two']);await expect(db.query('select enroll_member($1,$2,$3)',['test-hash',other,'member_three'])).rejects.toThrow(/invalid_invitation/)});
 it('audit and attribution stay available to administrators',async()=>{const r=await db.query<{snapshot:{attribution:Record<string,string>;history:unknown[]}}>('select admin_snapshot($1) snapshot',[admin]);expect(r.rows[0].snapshot.attribution[idea]).toBe(member);expect(r.rows[0].snapshot.history.length).toBeGreaterThan(3)});
 it('rate limiter enforces a bounded window',async()=>{await db.query('select consume_limit($1,$2,$3)',['test',1,60]);const r=await db.query<{allowed:boolean}>('select consume_limit($1,$2,$3) allowed',['test',1,60]);expect(r.rows[0].allowed).toBe(false)});
});

describe('permanent deletion',()=>{
 it('keeps ideas and history when an account is deleted',async()=>{
  await db.query('delete from auth.users where id=$1',[member]);
  expect((await db.query('select * from profiles where id=$1',[member])).rows).toHaveLength(0);
  expect((await db.query('select creator_id from private.attribution where idea_id=$1',[idea])).rows[0]).toEqual({creator_id:null});
  expect((await db.query('select * from ideas where id=$1',[idea])).rows).toHaveLength(1);
  const snapshot=await db.query('select admin_snapshot($1) as data',[admin]);
  expect(JSON.stringify(snapshot.rows)).toContain('Deleted user');
 });
 it('requires admin access and a current version for permanent deletion',async()=>{
  await expect(db.query('select delete_idea_permanently($1,$2,$3)',[other,idea,4])).rejects.toThrow(/access_denied/);
  await expect(db.query('select delete_idea_permanently($1,$2,$3)',[admin,idea,1])).rejects.toThrow(/version_conflict/);
  const row=await db.query<{version:number}>('select version from ideas where id=$1',[idea]);
  await db.exec('set role service_role');
  try{await db.query('select delete_idea_permanently($1,$2,$3)',[admin,idea,row.rows[0].version])}finally{await db.exec('reset role')}
  expect((await db.query('select * from ideas where id=$1',[idea])).rows).toHaveLength(0);
  expect((await db.query('select * from private.revisions where idea_id=$1',[idea])).rows).toHaveLength(0);
 });
});
