// Testes dos eventos reais com APIs simuladas, sem compilação VM/YYC.
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict');
const {fixture,run,source,refs}=require('./test_regressions.cjs');
const file='objects/Obj_jogador/Step_0.gml';
const prefix=source(file).slice(0,source(file).indexOf('// Finalização furtiva:'));
let total=0;
function test(name,fn){fn();total++;console.log('OK: '+name);}
function setup(w=1366,h=768){
  const c=fixture();c.global.pause_aberto=true;
  c.display_get_gui_width=()=>w;c.display_get_gui_height=()=>h;
  c.tick=()=>run(c,file,prefix);
  c.point=(x,y)=>{const [s,ox,oy]=c.bunker_pause_layout(w,h);c.mouse_x=ox+x*s;c.mouse_y=oy+y*s;};
  return c;
}
for(const [w,h] of [[1366,768],[1024,768],[2560,1080],[768,1024]]){
  test(`carteira centralizada, proporcional e cliques alinhados em ${w}x${h}`,()=>{
    const c=setup(w,h),[s,ox,oy]=c.bunker_pause_layout(w,h);
    assert(Math.abs(ox+688*s-w/2)<=.5+1e-8);
    assert(Math.abs(oy+384*s-h/2)<=.5+1e-8);
    assert(ox+69*s>0 && ox+1306*s<w);
    assert(oy+75*s>0 && oy+695*s<h);
    for(const [i,x,y] of [[0,1000,210],[1,1000,285],[2,1000,355],[3,330,280]]){
      c.point(x,y);c.tick();assert.equal(c.global.pause_selecionado,i);
    }
  });
}
for(let i=0;i<4;i++)test(`hover sobe e volta ao sair do cartão ${i}`,()=>{
  const c=setup();const p=[[1000,210],[1000,285],[1000,355],[330,280]][i];
  c.point(...p);for(let n=0;n<35;n++)c.tick();
  assert(c.pause_animacao_cartao[i]>.99);
  c.mouse_x=0;c.mouse_y=0;for(let n=0;n<35;n++)c.tick();
  assert.equal(c.global.pause_selecionado,-1);assert(c.pause_animacao_cartao[i]<.01);
});
test('mouse parado não rouba seleção do teclado e clique preto não ativa',()=>{
  const c=setup();c.point(1000,210);c.tick();c.keys.add(c.vk_down);c.tick();
  assert.equal(c.global.pause_selecionado,1);c.keys.clear();c.tick();assert.equal(c.global.pause_selecionado,1);
  c.mouse_x=0;c.mouse_y=0;c.mouse_down=true;c.tick();assert(c.global.pause_aberto);assert.equal(c.eventos.length,0);
});
test('esquerda acessa Sair; direita retorna aos cartões; D-pad e analógico funcionam',()=>{
  const c=setup();c.gamepad_get_device_count=()=>1;c.gamepad_is_connected=()=>true;
  Object.assign(c,{gp_axislh:0,gp_axislv:1,gp_padl:2,gp_padr:3,gp_padu:4,gp_padd:5,gp_face1:6});
  let axis=-1,button=-1;c.gamepad_axis_value=(pad,a)=>a===0?axis:0;c.gamepad_button_check_pressed=(pad,b)=>b===button;
  c.tick();assert.equal(c.global.pause_selecionado,3);axis=0;c.tick();button=3;c.tick();assert.equal(c.global.pause_selecionado,0);
});
for(const i of [0,1,2,3])test(`ação ${i} preservada`,()=>{
  const c=setup();c.global.pause_selecionado=i;c.keys.add(c.vk_enter);c.tick();
  if(i===0)assert(!c.global.pause_aberto && c.activated);
  if(i===1)assert(c.eventos.some(e=>e[0]==='restart'));
  if(i===2)assert(c.global.config_aberta && c.global.pause_aberto);
  if(i===3)assert(c.eventos.some(e=>e[0]==='goto' && e[1]===refs.Room_Menu));
});
test('pause tem sprite frontal próprio e fundo preto opaco',()=>{
  const draw=source('objects/Obj_jogador/Draw_64.gml');
  assert(draw.includes('draw_sprite_ext(Spr_pause_fundo'));
  assert(draw.includes('draw_rectangle(0, 0, pause_gw, pause_gh, false)'));
  assert(draw.includes('draw_sprite_part_ext(Spr_pause_fundo'));
  assert(!source('objects/Obj_jogador/Draw_64.gml').includes('draw_sprite_ext(Spr_menu_fundo'));
});
console.log(`${total} testes específicos do pause frontal passaram.`);
