import {describe,it,expect} from 'vitest';
import {colorDistanceField,revealAlpha} from '../lib/color-field';
describe('continuous glyph color coverage',()=>{
 const w=90,h=60,input=new Uint8ClampedArray(w*h*4);for(let y=20;y<35;y++)for(let x=12;x<35;x++)input[(y*w+x)*4+3]=255;
 it('starts at the glyphs and covers every pixel before the route handoff',()=>{const field=colorDistanceField(input,w,h,411)!;expect(revealAlpha(field.pixels[(25*w+20)*4+3],0)).toBe(1);expect(revealAlpha(field.pixels[(59*w+89)*4+3],0)).toBe(0);for(let i=3;i<field.pixels.length;i+=4)expect(revealAlpha(field.pixels[i],1.025)).toBe(1)});
 it('expands monotonically with continuous opacity at the frontier',()=>{for(let a=0;a<=255;a+=5){let previous=0;for(let p=0;p<=1.026;p+=.002){const next=revealAlpha(a,p);expect(next).toBeGreaterThanOrEqual(previous);previous=next}}expect(revealAlpha(0,.99)).toBeGreaterThan(0);expect(revealAlpha(0,.99)).toBeLessThan(1)});
 it('keeps the geometry stable for an idea and distinct between seeds',()=>{const a=colorDistanceField(input,w,h,411)!,b=colorDistanceField(input,w,h,411)!,c=colorDistanceField(input,w,h,612)!;expect(a.pixels).toEqual(b.pixels);expect(a.pixels).not.toEqual(c.pixels)});
 it('handles missing glyphs without a stuck overlay',()=>expect(colorDistanceField(new Uint8ClampedArray(100*4),10,10,1)).toBeNull());
});
