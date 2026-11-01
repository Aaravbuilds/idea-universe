import {describe,it,expect,vi,afterEach} from 'vitest';
import {GET,POST} from '../app/api/[...path]/route';
afterEach(()=>vi.unstubAllEnvs());
describe('server access gates',()=>{
 it('declares disconnected mode without returning data',async()=>{vi.stubEnv('SUPABASE_URL','');const r=await GET(new Request('https://example.com/api/session'));expect(await r.json()).toEqual({configured:false,user:null})});
 it('rejects cross-origin writes before reading credentials',async()=>{const r=await POST(new Request('https://example.com/api/ideas',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}));expect(r.status).toBe(403)});
 it('does not enable real operations in demo mode',async()=>{vi.stubEnv('SUPABASE_URL','');const r=await POST(new Request('https://example.com/api/admin/invite',{method:'POST',headers:{Origin:'https://example.com'},body:'{}'}));expect(r.status).toBe(503)});
 it('requires a session even when the server is configured',async()=>{vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_ANON_KEY','test');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test');const r=await GET(new Request('https://example.com/api/admin'));expect(r.status).toBe(401)});
});
