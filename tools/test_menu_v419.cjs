// Executa eventos GML compatíveis com JS; não compila GameMaker.
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict');
const {fixture,run,refs,source}=require('./test_regressions.cjs');
let count=0;
function test(name,fn){fn();console.log('OK: '+name);count++;}
function setup(w=1366,h=768){
  const c=fixture();c.bloqueio_input=0;c.draws=[];
  Object.assign(c,{
    display_get_gui_width:()=>w,display_get_gui_height:()=>h,
    c_white:1,c_black:0,fa_left:0,fa_center:1,fa_top:0,fa_middle:1,
    draw_set_alpha:()=>{},draw_set_color:()=>{},draw_set_font:()=>{},draw_set_halign:()=>{},draw_set_valign:()=>{},
    draw_rectangle:()=>{},draw_text_transformed:()=>{},
    draw_sprite_ext:(...a)=>c.draws.push(a),draw_sprite_part_ext:()=>{},
    game_end:()=>c.eventos.push(['end']),
    gp_axislh:0,gp_axislv:1,gp_padl:2,gp_padr:3,gp_padu:4,gp_padd:5,gp_face1:6,gp_face2:7
  });
  return c;
}
const step=c=>run(c,'objects/Obj_menu/Step_0.gml');
const draw=c=>run(c,'objects/Obj_menu/Draw_64.gml');
const tick=(c,n)=>{for(let i=0;i<n;i++)step(c);};
function select(c,x,y){c.mouse_x=x;c.mouse_y=y;step(c);}
function exit(c){select(c,730,400);c.mouse_down=true;step(c);c.mouse_down=false;assert(c.saindo_jogo);}
test('texturas do menu sem recorte automático, preservando coordenadas de sprite_part',()=>{
 const project=JSON.parse(source('tcc.yyp'));
 assert.equal(project.TextureGroups.find(g=>g.name==='Menu_Carteira').autocrop,false);
 assert.equal(project.TextureGroups.find(g=>g.name==='Default').autocrop,true);
 for(const name of ['Spr_menu_fundo','Spr_menu_bolsos','Spr_menu_cartoes','Spr_menu_sair']){
  const yy=JSON.parse(source('sprites/'+name+'/'+name+'.yy'));
  assert.equal(yy.textureGroupId.name,'Menu_Carteira');
 }
});
for(const [index,x,y] of [[0,1090,340],[1,1090,395],[2,1090,463],[3,730,400]]){
 test('hover suave e retorno do cartão '+index,()=>{
   const c=setup();select(c,x,y);assert.equal(c.selecionado,index);
   const first=c.animacao_cartao[index];assert(first>0&&first<1);
   tick(c,40);assert(c.animacao_cartao[index]>.999);
   select(c,100,700);assert.equal(c.selecionado,-1);const leaving=c.animacao_cartao[index];assert(leaving>0&&leaving<1);
   tick(c,40);assert(c.animacao_cartao[index]<.001);
 });
}
test('mouse estacionado não toma seleção do teclado',()=>{
  const c=setup();select(c,1090,340);c.keys.add(c.vk_down);step(c);c.keys.clear();tick(c,20);assert.equal(c.selecionado,1);
});
test('área antiga de sair não aciona encerramento',()=>{
  const c=setup();select(c,730,570);c.mouse_down=true;step(c);assert.equal(c.selecionado,-1);assert(!c.saindo_jogo);
});
test('ponteiro na extensão elevada mantém foco sem piscar',()=>{
  const c=setup();select(c,1090,395);tick(c,30);select(c,1090,365);tick(c,60);assert.equal(c.selecionado,1);
});
test('direcional e analógico do controle; confirmar e voltar no painel',()=>{
  const c=setup();let pressed=new Set(),axes=[0,0];
  c.gamepad_get_device_count=()=>4;c.gamepad_is_connected=i=>i===2;
  c.gamepad_button_check_pressed=(i,b)=>{assert.equal(i,2);return pressed.has(b);};
  c.gamepad_axis_value=(i,a)=>axes[a];
  pressed.add(c.gp_padd);step(c);pressed.clear();assert.equal(c.selecionado,1);
  axes=[0,1];step(c);assert.equal(c.selecionado,2);tick(c,20);assert.equal(c.selecionado,2);
  axes=[0,0];step(c);pressed.add(c.gp_face1);step(c);pressed.clear();assert(c.global.config_aberta);
  pressed.add(c.gp_padr);step(c);pressed.clear();assert(c.global.audio_musica_mudo);
  pressed.add(c.gp_face2);step(c);pressed.clear();assert(!c.global.config_aberta);
  c.gamepad_is_connected=()=>false;tick(c,6);assert.equal(c.pad_anterior,-1);
});
test('Jogar conserva transição para Room_Externa',()=>{
  const c=setup();c.keys.add(c.vk_enter);step(c);c.keys.clear();assert(c.iniciando_jogo);
  for(let i=0;i<121;i++){step(c);draw(c);}
  assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Externa));assert(!c.saindo_jogo);
});
test('Controles abre e fecha sem acionar outro cartão',()=>{
  const c=setup();select(c,1090,395);c.mouse_down=true;step(c);assert(c.mostrar_controles);
  c.mouse_down=false;c.keys.add(c.vk_escape);step(c);c.keys.clear();assert(!c.mostrar_controles);assert(!c.saindo_jogo);
});
test('sem Draw nunca fecha, mesmo depois de muitos Steps',()=>{
  const c=setup();exit(c);tick(c,600);assert(!c.eventos.some(e=>e[0]==='end'));
  assert(!c.saida_coberta_desenhada);draw(c);assert(c.saida_coberta_desenhada);
  tick(c,10);assert.equal(c.eventos.filter(e=>e[0]==='end').length,1);
});
for(const [w,h] of [[1366,768],[1024,768],[2560,1080],[768,1024]]){
 test('cobertura total antes de fechar em '+w+'x'+h,()=>{
  const c=setup(w,h);exit(c);
  for(let i=0;i<110;i++){
   step(c);draw(c);
   if(c.eventos.some(e=>e[0]==='end'))assert(c.saida_coberta_desenhada);
  }
  const a=c.draws.at(-1);assert.equal(a[0],refs.Spr_menu_sair);
  assert(a[2]<=0&&a[3]<=0&&a[2]+224*a[4]>=w&&a[3]+104*a[5]>=h);
  assert.equal(c.eventos.filter(e=>e[0]==='end').length,1);
 });
}
test('retirada completa antes de ampliar e bloqueio de ações concorrentes',()=>{
 const c=setup();exit(c);c.keys.add(c.vk_enter);c.keys.add(c.vk_right);c.mouse_down=true;
 tick(c,31);draw(c);const a=c.draws.at(-1);
 assert.equal(a[0],refs.Spr_menu_sair);assert(a[3]+104*a[5]<c.cartao_limite[3]);
 assert(!c.iniciando_jogo&&!c.global.config_aberta&&!c.mostrar_controles);
});
test('tempo de animação consistente em 30, 60 e 144 FPS',()=>{
 let values=[];
 for(const fps of [30,60,144]){
  const c=setup();c.delta_time=1000000/fps;c.mouse_x=1090;c.mouse_y=395;tick(c,fps/2);values.push(c.animacao_cartao[1]);
  exit(c);let frames=0;while(!c.eventos.some(e=>e[0]==='end')&&frames<fps*3){step(c);draw(c);frames++;}
  assert(frames/fps>=1.3&&frames/fps<1.6);
 }
 assert(Math.max(...values)-Math.min(...values)<1e-8);
});
console.log(count+' testes específicos passaram. Validação VM/YYC ainda necessária.');
