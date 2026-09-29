/* Créditos provisórios e bypass P: eventos GML reais, APIs simuladas, sem VM/YYC. */
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict');
const {fixture,run,source,refs}=require('./test_regressions.cjs');
let count=0;function test(n,f){f();count++;console.log('OK: '+n);}
function stairs(name='Room_Corredor_Pos'){
 const c=fixture();c.room=refs[name];c.actors=[];c.walls=[];run(c,'objects/Obj_mapa/Create_0.gml');
 c.global.modo_teste_portas_livres=false;c.global.v53_chave_escada=true;c.global.boss_derrotado=true;
 c.stair=c.actors.find(a=>a.tipo_passagem==='escada');
 Object.assign(c.stair,{ativa:true,mensagem_tempo:0,tempo_duto:0,usar_area_interacao:false});
 c.player.x=name==='Room_Corredor_Pos'?1190:1030;c.player.y=name==='Room_Corredor_Pos'?384:145;
 return c;
}
function enterCredits(c){c.v5_passagem_atualizar(c.stair);assert(c.global.vitoria_ativa&&c.global.demo_creditos);}
test('chegar à escada encerra fase 1 sem E nem troca de Room; créditos só disparam uma vez',()=>{
 const c=stairs();c.player.x=1120;c.v5_passagem_atualizar(c.stair);assert(!c.global.vitoria_ativa);
 c.player.x=1190;enterCredits(c);assert(c.global.cutscene_ativa);assert.equal(c.global.spawn_room,-1);assert(!c.global.v5_duto_ativo&&!c.global.v5_checkpoint_transicao_pendente);
 c.global.vitoria_tempo=100;for(let i=0;i<100;i++)c.v5_passagem_atualizar(c.stair);assert.equal(c.global.vitoria_tempo,100);
 assert.equal(c.eventos.filter(e=>e[0]==='play'&&e[1]===refs.Snd_porta).length,1);assert(!c.eventos.some(e=>e[0]==='goto'));
});
test('chaves, boss, interfaces, escada inativa e jogador morto impedem encerramento indevido',()=>{
 for(const flag of ['pause_aberto','diario_aberto','config_aberta','cutscene_ativa','dialogo_ativo']){
  const c=stairs();c.global[flag]=true;c.v5_passagem_atualizar(c.stair);assert(!c.global.vitoria_ativa,flag);
 }
 for(const flag of ['v53_chave_escada','boss_derrotado']){
  const c=stairs();c.global[flag]=false;for(let i=0;i<30;i++)c.v5_passagem_atualizar(c.stair);
  assert(!c.global.vitoria_ativa);assert(!c.eventos.some(e=>e[0]==='play'));
 }
 const c=stairs();c.stair.ativa=false;c.v5_passagem_atualizar(c.stair);assert(!c.global.vitoria_ativa);
 c.stair.ativa=true;c.player.vida=0;c.v5_passagem_atualizar(c.stair);assert(!c.global.vitoria_ativa);
});
test('E também encerra ao usar a escada; não marca a fase 2 como visitada',()=>{
 const c=stairs();c.player.x=1172;c.keys.add(c.ord('E'));enterCredits(c);assert(!c.global.v5_nivel2_visitado);
});
test('P no evento real do jogador sai dos créditos e chega em área segura da fase 2',()=>{
 const c=stairs();enterCredits(c);c.global.vitoria_tempo=500;c.global.creditos_scroll=130;c.global.camera_zoom=1.32;
 c.global.inventario_cartao_acesso=true;c.global.inventario_pe_cabra=true;c.global.lab11_derrotados=[true,false,true];
 c.keys.add(c.ord('P'));
 const s=source('objects/Obj_jogador/Step_0.gml');run(c,'atalho_P_real',s.slice(0,s.indexOf('// Pause e diário')));
 assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Corredor_N2));assert.deepEqual([c.global.spawn_x,c.global.spawn_y],[1030,186]);
 assert(!c.global.vitoria_ativa&&!c.global.demo_creditos&&!c.global.cutscene_ativa&&!c.global.v5_duto_ativo);
 assert.equal(c.global.camera_zoom,1);assert.equal(c.global.creditos_scroll,0);
 assert(c.global.inventario_cartao_acesso&&c.global.inventario_pe_cabra&&c.global.lab11_derrotados[0]);
});
test('P continua pelas salas 10 e 11 sem apagar inventário ou exigir suas chaves',()=>{
 const c=fixture();c.global.inventario_cartao_acesso=false;
 for(const [from,to]of[['Room_Funcionarios','Room_Ferramentas_N2'],['Room_Ferramentas_N2','Room_Laboratorio_N2']]){
  c.room=refs[from];c.v5_debug_avancar_room();assert.equal(c.global.spawn_room,refs[to]);assert(!c.global.inventario_cartao_acesso);
 }
});
test('desligar apenas a configuração restaura descida; escada de retorno não encerra',()=>{
 for(const name of ['Room_Corredor_Pos','Room_Corredor_N2']){
  const c=stairs(name);if(name==='Room_Corredor_Pos'){c.global.demo_fim_na_escadaria=false;c.bunker_iniciar(false);assert(!c.global.demo_fim_na_escadaria);}
  c.v5_passagem_atualizar(c.stair);assert(!c.global.vitoria_ativa&&!c.global.v5_duto_ativo);
  c.keys.add(c.ord('E'));c.v5_passagem_atualizar(c.stair);c.keys.clear();assert(c.global.v5_duto_ativo&&!c.global.vitoria_ativa);
  for(let i=0;i<30;i++)c.v5_passagem_atualizar(c.stair);
  assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs[name==='Room_Corredor_Pos'?'Room_Corredor_N2':'Room_Corredor_Pos']));
 }
});
test('créditos mantêm nomes, rolam e permitem retornar ao menu sem fechar o aplicativo',()=>{
 const c=stairs();enterCredits(c);for(let i=0;i<730;i++)c.bunker_vitoria_atualizar();assert(c.global.creditos_scroll>0);
 const gui=source('objects/Obj_mapa/Draw_64.gml');assert(gui.includes('FIM DA FASE 1')&&gui.includes('Luiz Henrique Matos Muller'));
 c.keys.add(c.vk_enter);c.bunker_vitoria_atualizar();assert(c.eventos.some(e=>e[0]==='goto'&&e[1]===refs.Room_Menu));assert(!c.global.vitoria_ativa&&!c.global.cutscene_ativa&&!c.global.demo_creditos);
 assert(!source('scripts/Scr_fluxo_v5/Scr_fluxo_v5.gml').includes('game_end('));
});
console.log(count+' testes do encerramento temporário passaram (GML simulado; sem runtime GameMaker).');
