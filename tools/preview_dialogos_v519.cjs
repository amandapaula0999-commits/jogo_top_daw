/* Renders the actual panel function and Font_de_fala atlas for visual review.
 * This is an offline UI preview, not a GameMaker screenshot.
 */
process.env.BUNKER_SKIP_TESTS='1';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture,run,refs}=require('./test_regressions.cjs');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
const root=path.resolve(__dirname,'..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const font=JSON.parse(src('fonts/Font_de_fala/Font_de_fala.yy').replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(_,s)=>s||''));
(async()=>{
 const atlas=await loadImage(path.join(root,'fonts/Font_de_fala/Font_de_fala.png'));
 const preview=createCanvas(1126,700),out=preview.getContext('2d');out.fillStyle='#17201e';out.fillRect(0,0,1126,700);
 out.fillStyle='#dce0c9';out.font='18px sans-serif';out.fillText('Prévia da interface — recursos reais do projeto; não é captura do GameMaker.',28,29);
 const cases=[['Referência: diálogo da parte 1',null],['Fase 2: tomar café','cafe'],['Fase 2: coleta do pé de cabra','ferramenta']];
 for(let n=0;n<cases.length;n++){
  const c=fixture(),cv=createCanvas(1366,768),ctx=cv.getContext('2d');let color='#ffffff';ctx.imageSmoothingEnabled=false;
  c.room=cases[n][1]==='ferramenta'?refs.Room_Ferramentas_N2:refs.Room_Funcionarios;
  c.actors=[];c.player.x=300;c.player.y=230;c.fade_entrada=0;c.tempo_apresentacao=0;
  c.func_mensagem_tempo=0;c.func_interacao_proxima='cafe';c.s10_tempo=100;c.s10_frame=3;c.s10_perto='suporte';
  const find=c.instance_find;c.instance_find=(k,i)=>find(k,i)||c.noone;
  c.make_color_rgb=(r,g,b)=>`rgb(${r},${g},${b})`;c.c_white='#fff';c.c_black='#000';c.bm_normal=0;c.fa_left=0;c.fa_top=0;
  c.gpu_set_blendmode=c.draw_set_font=c.draw_set_halign=c.draw_set_valign=()=>{};
  c.draw_set_color=v=>{color=v;};c.draw_set_alpha=v=>{ctx.globalAlpha=v;};
  c.draw_rectangle=(x1,y1,x2,y2,outline)=>{ctx.fillStyle=color;ctx.strokeStyle=color;if(outline)ctx.strokeRect(x1+.5,y1+.5,x2-x1,y2-y1);else ctx.fillRect(x1,y1,x2-x1,y2-y1);};
  const tinted=new Map();
  function glyph(ch){return font.glyphs[ch.codePointAt(0)]||font.glyphs[63];}
  function text(x,y,t,sep,width,sx=1,sy=1){
   if(!t)return;
   if(!tinted.has(color)){const ac=createCanvas(atlas.width,atlas.height),d=ac.getContext('2d');d.drawImage(atlas,0,0);d.globalCompositeOperation='source-in';d.fillStyle=color;d.fillRect(0,0,ac.width,ac.height);tinted.set(color,ac);}
   const img=tinted.get(color);let dx=0,dy=0;
   for(const word of t.split(/(\s+)/)){
    const ww=[...word].reduce((sum,ch)=>sum+glyph(ch).shift,0);
    if(dx&&dx+ww>width){dx=0;dy+=sep;}
    for(const ch of word){if(ch==='\n'){dx=0;dy+=sep;continue;}const g=glyph(ch);ctx.drawImage(img,g.x,g.y,g.w,g.h,x+(dx+g.offset)*sx,y+dy*sy,g.w*sx,g.h*sy);dx+=g.shift;}
   }
  }
  c.draw_text_ext_transformed=text;c.draw_text_ext=text;c.draw_text=(x,y,t)=>text(x,y,t,24,2000);
  const visual=src('scripts/Scr_visual_bunker/Scr_visual_bunker.gml'),a=visual.indexOf('function bunker_painel('),b=visual.indexOf('\nfunction ',a+1);new vm.Script(visual.slice(a,b)).runInContext(c);
  if(n===0){c.exibir_dialogo=true;c.texto_atual='SECRETÁRIA: Bom dia. O inspetor ambiental, correto? Seu protocolo.';run(c,'objects/Obj_recepcionista/Draw_64.gml');}
  else c.bunker_fase2_gui(c);
  out.fillStyle='#c4b58f';out.font='16px sans-serif';out.fillText(cases[n][0],50,65+n*213);
  out.drawImage(cv,168,552,1030,168,48,78+n*213,1030,168);
 }
 const dest=path.join(root,'PREVIA_DIALOGOS_V5_19.png');fs.writeFileSync(dest,preview.toBuffer('image/png'));console.log(dest);
})();
