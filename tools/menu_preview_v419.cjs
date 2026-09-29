// Prévia técnica dos eventos reais, com APIs de desenho Canvas. Não é runtime GM.
process.env.BUNKER_SKIP_TESTS='1';
const fs=require('node:fs'),path=require('node:path');
const {fixture,run,refs,root}=require('./test_regressions.cjs');
const canvasModule=require.resolve('@napi-rs/canvas',{paths:[__dirname,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)});
const {createCanvas,loadImage}=require(canvasModule);
async function renderer(width=1366,height=768){
  const sprites=new Map();
  for(const name of ['Spr_menu_fundo','Spr_menu_bolsos','Spr_menu_cartoes','Spr_menu_sair','Spr_pause_cartoes','Spr_pause_fundo']){
    const dir=path.join(root,'sprites',name),data=JSON.parse(fs.readFileSync(path.join(dir,name+'.yy')));
    sprites.set(refs[name],await Promise.all(data.frames.map(f=>loadImage(path.join(dir,f.name+'.png')))));
  }
  const c=fixture(),screen=createCanvas(width,height),dc=screen.getContext('2d');
  dc.imageSmoothingEnabled=false;
  Object.assign(c,{
    sprite_get_width:s=>sprites.get(s)[0].width,sprite_get_height:s=>sprites.get(s)[0].height,
    display_get_gui_width:()=>screen.width,display_get_gui_height:()=>screen.height,
    c_white:'#fff',c_black:'#000',fa_left:'left',fa_center:'center',fa_top:'top',fa_middle:'middle',
    draw_set_alpha:a=>dc.globalAlpha=a,make_color_rgb:(r,g,b)=>`rgb(${r},${g},${b})`,
    draw_set_color:col=>{dc.fillStyle=dc.strokeStyle=col;},
    draw_set_font:()=>{},draw_set_halign:a=>dc.textAlign=a,draw_set_valign:a=>dc.textBaseline=a,
    draw_rectangle:(x,y,x2,y2,outline)=>dc[outline?'strokeRect':'fillRect'](x,y,x2-x,y2-y),
    draw_sprite_ext:(s,f,x,y,sx,sy,angle,col,a)=>{dc.save();dc.globalAlpha=a;dc.translate(x,y);dc.rotate(-angle*Math.PI/180);dc.scale(sx,sy);dc.drawImage(sprites.get(s)[f],0,0);dc.restore();},
    draw_sprite_part_ext:(s,f,l,t,w,h,x,y,sx,sy,col,a)=>{if(h<=0)return;dc.save();dc.globalAlpha=a;dc.drawImage(sprites.get(s)[f],l,t,w,h,x,y,w*sx,h*sy);dc.restore();},
    draw_text_transformed:(x,y,t,sx,sy,angle)=>{dc.save();dc.translate(x,y);dc.rotate(-angle*Math.PI/180);dc.scale(sx,sy);dc.font='14px sans-serif';dc.fillText(t,0,0);dc.restore();},
    game_end:()=>c.eventos.push(['end'])
  });
  c.bloqueio_input=0;
  return {c,screen,draw:()=>run(c,'objects/Obj_menu/Draw_64.gml'),step:()=>run(c,'objects/Obj_menu/Step_0.gml')};
}
async function main(){
  const out=path.resolve(root,'../preview_v419_frames');fs.mkdirSync(out,{recursive:true});
  const dest=path.resolve(root,'../deliverables');fs.mkdirSync(dest,{recursive:true});
  const r=await renderer();let ticks=0,index=0;
  function frame(){r.step();r.draw();if(ticks++%4===0){fs.writeFileSync(path.join(out,String(index++).padStart(4,'0')+'.png'),r.screen.toBuffer('image/png'));}}
  function point(x,y,n){r.c.mouse_x=x;r.c.mouse_y=y;for(let i=0;i<n;i++)frame();}
  point(100,700,24);
  for(const y of [340,395,463]){point(1090,y,55);point(100,700,22);}
  point(730,400,60);
  fs.writeFileSync(path.join(dest,'Menu_v4_19.png'),r.screen.toBuffer('image/png'));
  r.c.mouse_down=true;frame();r.c.mouse_down=false;
  for(let i=0;i<100;i++)frame();
  fs.writeFileSync(path.join(dest,'Saida_Cobertura_v4_19.png'),r.screen.toBuffer('image/png'));
  if(!r.c.saida_coberta_desenhada || r.c.eventos.filter(e=>e[0]==='end').length!==1)throw new Error('Saída sem cobertura ou encerramento duplicado');
  console.log(index+' quadros; cobertura completa antes de um único game_end simulado.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={renderer};
