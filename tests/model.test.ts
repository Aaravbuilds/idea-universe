import {describe,it,expect} from 'vitest';
import {identity,makeIdea,searchIdeas,safeLink} from '../lib/model';
import {patchSchema,newIdeaSchema,refinementSchema} from '../lib/server';
describe('idea identity and privacy input boundary',()=>{
 it('assigns distinct identities beyond the curated palette',()=>{const colors:string[]=[];for(let n=0;n<150;n++){const id=identity(colors,n+1);expect(colors).not.toContain(id.accent);expect(id.accent).toMatch(/^#[a-fA-F0-9]{6}$/);colors.push(id.accent)}});
 it('preserves original input separately from the final title',()=>{const i=makeIdea('Final',[],{original:'my first thought'});expect(i.original).toBe('my first thought');expect(i.title).toBe('Final')});
 it('searches notes and excludes removed ideas',()=>{const i=[makeIdea('Search fixture',[])];i[0].notes=[{id:'1',text:'interview evidence',at:new Date().toISOString()}];expect(searchIdeas(i,'evidence')).toHaveLength(1);i[0].deleted=true;expect(searchIdeas(i,'evidence')).toHaveLength(0)});
 it('rejects script and data reference URLs',()=>{expect(safeLink('javascript:alert(1)')).toBeNull();expect(safeLink('data:text/html,x')).toBeNull();expect(safeLink('https://example.com')).toBeTruthy()});
 it('rejects client attribution, role, history and identity changes',()=>{for(const key of ['creator_id','role','history','accent','original','version'])expect(patchSchema.safeParse({[key]:'forged'}).success).toBe(false)});
 it('strips unknown creation fields and AI identity fields',()=>{const i=makeIdea('Hello',[]);const parsed=newIdeaSchema.parse({...i,creator_id:'forged'});expect(parsed).not.toHaveProperty('creator_id');expect(refinementSchema.parse({title:'x',description:'y',creator_id:'z'})).not.toHaveProperty('creator_id')});
});
