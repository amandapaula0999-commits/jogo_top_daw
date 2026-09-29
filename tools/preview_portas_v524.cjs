/* Prévia com recursos reais e GML simulado. Não é captura do GameMaker. */
process.env.BUNKER_SKIP_TESTS='1';
const fs=require('fs'),path=require('path'),vm=require('vm');
const {fixture,refs}=require('./test_regressions.cjs');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const root=path.resolve(__dirname,'..'),src=p=>fs.readFileSync(path.join(root,p),'utf8');
const read=p=>JSON.parse(src(p).replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function sprite(d,n,x,y,sx=1,sy=sx){const s=read(`sprites/${n}/${n}.yy`),im=await loadImage(path.join(root,'sprites',n,s.frames[0].name+'.png'));d.drawImage(im,x-s.sequence.xorigin*sx,y-s.sequence.yorigin*sy,im.width*sx,im.height*sy);}
(async()=>{
 const r=read('rooms/Room_Corredor_N2/Room_Corredor_N2.yy'),map=createCanvas(r.roomSettings.Width,r.roomSettings.Height),d=map.getContext('2d');d.imageSmoothingEnabled=false;
 for(const l of [...r.layers].sort((a,b)=>b.depth-a.depth))for(const i of l.instances||[]){if(['Obj_parede','Obj_mapa','Obj_jogador'].includes(i.objectId.name))continue;const o=read(`objects/${i.objectId.name}/${i.objectId.name}.yy`);if(o.spriteId)await sprite(d,o.spriteId.name,i.x,i.y,i.scaleX,i.scaleY);}
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);await sprite(d,'Spr_jogador_idle_baixo',624,220,scale);
 const cv=createCanvas(1366,768),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(map,384,28,480,270,0,0,1366,768);
 const font=read('fonts/Font_de_fala/Font_de_fala.yy'),atlas=await loadImage(path.join(root,'fonts/Font_de_fala/Font_de_fala.png'));
 const c=fixture();c.room=refs.Room_Corredor_N2;c.c_white='#fff';c.c_black='#000';c.fa_left=0;c.fa_top=0;c.bm_normal=0;
 let color='#fff';const tinted=new Map(),glyph=ch=>font.glyphs[ch.codePointAt(0)]||font.glyphs[63];
 function lines(t,w){const result=[''];let width=0;for(const part of t.split(/(\s+)/)){if(part.includes('\n')){result.push('');width=0;continue;}const len=[...part].reduce((n,ch)=>n+glyph(ch).shift,0);if(width&&width+len>w){result.push('');width=0;}result[result.length-1]+=part;width+=len;}return result;}
 c.string_height_ext=(t,sep,w)=>(lines(t,w).length-1)*sep+font.lineHeight;
 if(!font.lineHeight)c.string_height_ext=(t,sep,w)=>(lines(t,w).length-1)*sep+22;
 c.make_color_rgb=(r,g,b)=>`rgb(${r},${g},${b})`;c.draw_set_color=v=>color=v;c.draw_set_alpha=v=>ctx.globalAlpha=v;
 c.draw_set_font=c.draw_set_halign=c.draw_set_valign=c.gpu_set_blendmode=()=>{};
 c.draw_rectangle=(x,y,x2,y2,outline)=>{ctx.fillStyle=ctx.strokeStyle=color;if(outline)ctx.strokeRect(x+.5,y+.5,x2-x,y2-y);else ctx.fillRect(x,y,x2-x,y2-y);};
 c.draw_text_ext_transformed=(x,y,t,sep,w,sx,sy)=>{
  if(!tinted.has(color)){const a=createCanvas(atlas.width,atlas.height),q=a.getContext('2d');q.drawImage(atlas,0,0);q.globalCompositeOperation='source-in';q.fillStyle=color;q.fillRect(0,0,a.width,a.height);tinted.set(color,a);}
  for(const [ln,line] of lines(t,w).entries()){let dx=0;for(const ch of line){const g=glyph(ch);ctx.drawImage(tinted.get(color),g.x,g.y,g.w,g.h,x+(dx+g.offset)*sx,y+ln*sep*sy,g.w*sx,g.h*sy);dx+=g.shift;}}
 };
 const v=src('scripts/Scr_visual_bunker/Scr_visual_bunker.gml'),a=v.indexOf('function bunker_painel('),b=v.indexOf('\nfunction ',a+1);new vm.Script(v.slice(a,b)).runInContext(c);
 c.bunker_painel(16,16,276,72);c.bunker_painel(1094,16,256,60);
 c.draw_set_color('#b49f6e');c.draw_text_ext_transformed(30,45,'CONDIÇÃO 100%',24,250,1,1);c.draw_text_ext_transformed(1110,37,'[J] DIÁRIO 0 / 7',24,225,1,1);
 c.player.x=624;c.player.y=220;c.fa_center=1;c.fa_bottom=2;c.string_width=t=>[...t].reduce((sum,ch)=>sum+glyph(ch).shift,0);
 c.draw_text_transformed=(x,y,t,sx,sy)=>c.draw_text_ext_transformed((x-384)*1366/480-c.string_width(t)*sx*1366/480/2,(y-28)*768/270-22*sy*768/270,t,24,2000,sx*1366/480,sy*768/270);
 c.bunker_porta_rotulo_desenhar({x:624,y:260,rotulo:'SALA DE MANUTENÇÃO',ativa:true,abrindo:false,usar_area_interacao:false,raio_interacao:82});
 fs.writeFileSync(path.join(root,'PREVIA_PORTAS_V5_24.png'),cv.toBuffer('image/png'));
 console.log('PREVIA_PORTAS_V5_24.png');
})();
