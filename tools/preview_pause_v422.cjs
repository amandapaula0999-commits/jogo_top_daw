// Executa o Draw GUI real via Canvas; prévia técnica, não captura do GameMaker.
process.env.BUNKER_SKIP_TESTS='1';
const fs=require('node:fs'),path=require('node:path');
const {renderer}=require('./menu_preview_v419.cjs');
const {run,root}=require('./test_regressions.cjs');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{
  paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
async function preview(){
  const r=await renderer();
  // Usa a própria fonte bitmap do projeto, inclusive métricas e cor do Draw.
  const fontDir=path.join(root,'fonts/Font_de_fala');
  const fy=JSON.parse(fs.readFileSync(path.join(fontDir,'Font_de_fala.yy'),'utf8')
    .replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g,(m,s)=>s||''));
  const atlas=await loadImage(path.join(fontDir,'Font_de_fala.png'));
  const dc=r.screen.getContext('2d');
  r.c.draw_text_transformed=(x,y,text,sx,sy)=>{
    const glyphs=[...text].map(ch=>fy.glyphs[ch.codePointAt(0)]);
    const w=glyphs.reduce((n,g)=>n+g.shift,0),h=18;
    const tmp=createCanvas(w,h),t=tmp.getContext('2d');let pen=0;
    for(const g of glyphs){t.drawImage(atlas,g.x,g.y,g.w,g.h,pen+g.offset,0,g.w,g.h);pen+=g.shift;}
    t.globalCompositeOperation='source-in';t.fillStyle=dc.fillStyle;t.fillRect(0,0,w,h);
    dc.drawImage(tmp,x-w*sx/2,y-h*sy/2,w*sx,h*sy);
  };
  r.c.global.pause_aberto=true;
  r.c.pause_couro_faixas=r.c.bunker_pause_recorte();
  r.c.pause_animacao_cartao=[1,0,0,0];
  run(r.c,'objects/Obj_jogador/Draw_64.gml');
  const out=path.join(root,'PREVIA_MENU_PAUSA_V4_26.png');
  fs.writeFileSync(out,r.screen.toBuffer('image/png'));
  console.log(out);
}
preview().catch(e=>{console.error(e);process.exitCode=1;});
