import {afterEach,describe,it,expect,vi} from 'vitest';
import {POST} from '../app/api/[...path]/route';
const request=(body:unknown,path='admin/create-member')=>new Request('https://example.com/api/'+path,{method:'POST',headers:{Origin:'https://example.com',Cookie:'iu_session=token'},body:JSON.stringify(body)});
function setup(role='admin',fail=false){vi.stubEnv('SUPABASE_URL','https://db.example');vi.stubEnv('SUPABASE_ANON_KEY','anon');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','service');const fetcher=vi.fn(async(url:string,options:RequestInit={})=>{const path=new URL(url).pathname;let body:unknown={};let status=200;if(path==='/auth/v1/user')body={id:'admin-id'};else if(url.includes('profiles?id='))body=[{id:'admin-id',username:'admin',role,disabled:false}];else if(path.endsWith('/consume_limit'))body=true;else if(url.includes('profiles?username='))body=[];else if(path==='/auth/v1/admin/users')body={id:'new-id'};else if(path==='/rest/v1/profiles'&&options.method==='POST'&&fail){status=409;body={message:'unique violation'}}return Response.json(body,{status})});vi.stubGlobal('fetch',fetcher);return fetcher}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()});
describe('admin-created credentials',()=>{
 it('denies members before provisioning an account',async()=>{const f=setup('member');expect((await POST(request({username:'friend',password:'long-enough-password'}))).status).toBe(403);expect(f.mock.calls.some(([u])=>u.endsWith('/auth/v1/admin/users'))).toBe(false)});
 it('creates only member profiles and never returns the password',async()=>{const f=setup();const r=await POST(request({username:'Friend',password:'short6'}));expect(r.status).toBe(201);expect(await r.json()).toEqual({ok:true,username:'friend'});const call=f.mock.calls.find(([u,o])=>u.endsWith('/rest/v1/profiles')&&o?.method==='POST');expect(JSON.parse(String(call![1]?.body))).toEqual({id:'new-id',username:'friend',role:'member'})});
 it('rejects attempts to assign admin privileges',async()=>{setup();expect((await POST(request({username:'friend',password:'long-enough-password',role:'admin'}))).status).toBe(400)});
 it('removes the new Auth account if profile creation fails',async()=>{const f=setup('admin',true);expect((await POST(request({username:'friend',password:'long-enough-password'}))).status).toBe(409);expect(f.mock.calls.some(([u,o])=>u.endsWith('/auth/v1/admin/users/new-id')&&o?.method==='DELETE')).toBe(true)});
});

describe('admin account management',()=>{
 it('rejects member requests for every new admin action',async()=>{
  setup('member');for(const path of ['admin/password','admin/delete-user','admin/delete-idea'])expect((await POST(request({},path))).status).toBe(403);
 });
 it('updates an existing user password using the Auth admin API',async()=>{
  const f=setup();const id='00000000-0000-4000-8000-000000000001';
  expect((await POST(request({id,password:'short6'},'admin/password'))).status).toBe(200);
  expect(f.mock.calls.some(([u,o])=>u.endsWith('/auth/v1/admin/users/'+id)&&o?.method==='PUT')).toBe(true);
 });
 it('requires exact username confirmation before deleting an account',async()=>{
  const f=setup();expect((await POST(request({id:'00000000-0000-4000-8000-000000000002',username:'wrong'},'admin/delete-user'))).status).toBe(400);
  expect(f.mock.calls.some(([,o])=>o?.method==='DELETE')).toBe(false);
 });
});
