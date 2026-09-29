/* Prévia com os sprites reais. Não é captura de execução no GameMaker. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
async function draw(d,n,x,y,scale=1){
 const s=read(`sprites/${n}/${n}.yy`),im=await loadImage(path.join(root,'sprites',n,s.frames[0].name+'.png'));
 d.drawImage(im,x-s.sequence.xorigin*scale,y-s.sequence.yorigin*scale,im.width*scale,im.height*scale);
}
(async()=>{
 const r=read('rooms/Room_Recepcao/Room_Recepcao.yy'),c=createCanvas(640,427),d=c.getContext('2d');d.imageSmoothingEnabled=false;
 await draw(d,'Spr_recepcao_cenario',0,0);
 const npc=r.layers.flatMap(l=>l.instances||[]).find(i=>i.objectId.name==='Obj_recepcionista');await draw(d,'Spr_recepcionista',npc.x,npc.y,1.25);
 const en=read('sprites/Spr_inimigo_parado_baixo/Spr_inimigo_parado_baixo.yy'),pl=read('sprites/Spr_jogador_parado_baixo/Spr_jogador_parado_baixo.yy');
 const scale=(en.bbox_bottom+1-en.bbox_top)*.55*.8/(pl.bbox_bottom+1-pl.bbox_top);
 await draw(d,'Spr_jogador_idle_cima',584,218,scale);
 const vm=require('vm'),font=read('fonts/Font_de_fala/Font_de_fala.yy');
 const atlas=await loadImage(path.join(root,'fonts/Font_de_fala/Font_de_fala.png'));
 const glyph=ch=>font.glyphs[ch.codePointAt(0)]||font.glyphs[63];
 const white=createCanvas(atlas.width,atlas.height),wd=white.getContext('2d');wd.drawImage(atlas,0,0);wd.globalCompositeOperation='source-in';wd.fillStyle='#fff';wd.fillRect(0,0,white.width,white.height);
 const calls=[],ctx={x:601,y:217,room_width:640,destino:1,Room_Armadilha:1,rotulo:'SALA DE ESPERA',fa_bottom:2,fa_top:0,
  string_width:t=>[...t].reduce((n,ch)=>n+glyph(ch).shift,0),clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),max:Math.max,draw_set_valign:()=>{},
  draw_text_transformed:(x,y,t,sx,sy)=>{calls.push({x,y,text:t});let dx=-[...t].reduce((n,ch)=>n+glyph(ch).shift,0)/2;for(const ch of t){const g=glyph(ch);d.drawImage(white,g.x,g.y,g.w,g.h,x+(dx+g.offset)*sx,y-22*sy,g.w*sx,g.h*sy);dx+=g.shift;}}
 };
 const code=fs.readFileSync(path.join(root,'objects/Obj_porta/Draw_0.gml'),'utf8');const start=code.indexOf('        // Centraliza na porta real;'),end=code.indexOf('    } else if',start);
 vm.runInNewContext(code.slice(start,end),ctx);
 if(Math.abs(calls[0].x-601)>1||calls[0].y>=164)throw Error('Nome não está acima da porta.');
 console.log(JSON.stringify(calls));
 const out=createCanvas(1280,854),g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,1280,854);
 fs.writeFileSync(path.join(root,'PREVIA_PORTA_RECEPCAO_V5_25.png'),out.toBuffer('image/png'));
 console.log('PREVIA_PORTA_RECEPCAO_V5_25.png');
})();
