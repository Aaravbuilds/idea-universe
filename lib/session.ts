import {z} from 'zod';
import {cookie,env,HttpError,supa} from './server';
export const authSessionSchema=z.object({access_token:z.string().min(1),refresh_token:z.string().min(1),expires_in:z.number().positive()});
export function sessionHeaders(session:z.infer<typeof authSessionSchema>|null){
 const headers=new Headers();const suffix='; HttpOnly;'+(process.env.NODE_ENV==='development'?'':' Secure;')+' SameSite=Lax; Path=/';
 headers.append('Set-Cookie',`iu_session=${session?.access_token||''}${suffix}; Max-Age=${session?Math.min(Math.floor(session.expires_in),3600):0}`);
 headers.append('Set-Cookie',`iu_refresh=${session?.refresh_token||''}${suffix}; Max-Age=${session?2592000:0}`);
 return headers;
}
export async function refreshSession(req:Request){
 const refresh=cookie(req,'iu_refresh');if(!refresh)throw new HttpError(401,'Please sign in again. Your draft is preserved.');
 const r=await fetch(env('SUPABASE_URL')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:env('SUPABASE_ANON_KEY'),'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new HttpError(401,'Please sign in again. Your draft is preserved.');const session=authSessionSchema.parse(await r.json());
 const auth=await supa('/auth/v1/user',{},session.access_token);const rows=await supa('/rest/v1/profiles?id=eq.'+encodeURIComponent(auth.id)+'&select=id,disabled');
 if(!rows[0]||rows[0].disabled)throw new HttpError(403,'Workspace access is not available for this account.');
 return session;
}
