import {z} from 'zod';
import {stages,identity} from './model';
export const env=(name:string)=>process.env[name]||'';
export const configured=()=>!!(env('SUPABASE_URL')&&env('SUPABASE_ANON_KEY')&&env('SUPABASE_SERVICE_ROLE_KEY'));
export class HttpError extends Error{constructor(public status:number,message:string,public code?:string){super(message)}}
export async function supa(path:string,options:RequestInit={},token=env('SUPABASE_SERVICE_ROLE_KEY')){const response=await fetch(env('SUPABASE_URL')+path,{...options,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),...(token.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+token}),'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)});const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null}catch{throw new HttpError(502,'The workspace returned an invalid response.')}if(!response.ok&&data?.code==='23505'&&data?.message?.includes('ideas_accent_key'))throw new HttpError(409,'This color was just used.','idea_color_conflict');if(!response.ok)throw new HttpError(data?.message?.includes('version_conflict')?409:response.status===409?409:502,data?.message?.includes('version_conflict')?'This idea changed. Reload and review the latest version.':data?.message?.includes('unique')?'That username or color is already in use.':'The workspace request could not be completed.');return data;}
export function cookie(req:Request,name:string){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
export async function actor(req:Request){const token=cookie(req,'iu_session');if(!token)throw new HttpError(401,'Your session has ended. Please sign in again.');let auth;try{auth=await supa('/auth/v1/user',{},token)}catch{throw new HttpError(401,'Your session has ended. Please sign in again.')}const rows=await supa('/rest/v1/profiles?id=eq.'+encodeURIComponent(auth.id)+'&select=id,username,role,disabled');const profile=rows?.[0];if(!profile||profile.disabled)throw new HttpError(403,'Workspace access is not available for this account.');return {...profile,token};}
export const entrySchema=z.object({id:z.string().max(100),text:z.string().max(10000),at:z.string().datetime()});
export const patchSchema=z.object({title:z.string().trim().min(1).max(500).optional(),description:z.string().max(2000).optional(),problem:z.string().max(10000).optional(),solution:z.string().max(10000).optional(),audience:z.string().max(10000).optional(),category:z.string().max(80).optional(),stage:z.enum(stages).optional(),notes:z.array(entrySchema).max(500).optional(),comments:z.array(entrySchema).max(500).optional(),references:z.array(entrySchema).max(500).optional(),deleted:z.boolean().optional()}).strict();
export const newIdeaSchema=patchSchema.omit({deleted:true}).extend({id:z.string().uuid(),title:z.string().trim().min(1).max(500),original:z.string().min(1).max(10000),accent:z.string().regex(/^#[0-9a-fA-F]{6}$/),ink:z.string().regex(/^#[0-9a-fA-F]{6}$/),seed:z.number().int().min(0).max(2147483647)}).strip();
export const refinementSchema=z.object({title:z.string().min(1).max(500),description:z.string().max(2000),problem:z.string().max(3000).default(''),solution:z.string().max(3000).default(''),audience:z.string().max(3000).default(''),category:z.string().max(80).default('Uncategorized')});
export async function limit(key:string,max:number,seconds:number){const result=await supa('/rest/v1/rpc/consume_limit',{method:'POST',body:JSON.stringify({p_key:key,p_max:max,p_seconds:seconds})});if(!result)throw new HttpError(429,'Too many attempts. Please wait and try again.');}
export async function getIdeas(admin=false){const rows=await supa('/rest/v1/ideas?select=data&order=created_at.asc'+(admin?'':'&deleted=eq.false'));return rows.map((r:{data:unknown})=>r.data);}
export function response(data:unknown,status=200,headers:HeadersInit={}){const h=new Headers(headers);h.set('Cache-Control','no-store');h.set('X-Content-Type-Options','nosniff');h.set('Referrer-Policy','same-origin');return Response.json(data,{status,headers:h})}

export async function createIdea(actorId:string,input:z.infer<typeof newIdeaSchema>){
 const data={...input};
 for(let attempt=0;attempt<4;attempt++){
  const rows=await supa('/rest/v1/ideas?select=accent');
  const used=rows.map((r:{accent:string})=>r.accent.toLowerCase());
  if(used.includes(data.accent.toLowerCase()))Object.assign(data,identity(used,data.seed));
  try{return await supa('/rest/v1/rpc/create_idea',{method:'POST',body:JSON.stringify({p_actor:actorId,p_data:data})})}
  catch(e){if(!(e instanceof HttpError)||e.code!=='idea_color_conflict')throw e}
 }
 throw new HttpError(409,'Several ideas were saved at once. Please press Save again; your writing is preserved.');
}
