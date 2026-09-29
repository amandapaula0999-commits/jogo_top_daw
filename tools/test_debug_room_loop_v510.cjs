/* Validação focal do atalho P / loop de salas v5.10.
 * Não compila GML; valida a função de navegação com o harness existente.
 */
process.env.BUNKER_SKIP_TESTS = '1';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture, refs} = require('./test_regressions.cjs');
const root = path.resolve(__dirname, '..');
const source = p => fs.readFileSync(path.join(root,p),'utf8');

const seq = [
  ['Room_Externa',      'Room_Recepcao',    320, 326],
  ['Room_Recepcao',     'Room_Armadilha',   683, 405],
  ['Room_Armadilha',    'Room_Desmoronada', 210, 360],
  ['Room_Desmoronada',  'Room_Corredor',    140, 630],
  ['Room_Corredor',     'Room_Corredor_N2',1030, 186],
  ['Room_Corredor_N2',  'Room_Manutencao_N2',92, 88],
  ['Room_Manutencao_N2','Room_Funcionarios',90, 310],
  ['Room_Funcionarios', 'Room_Ferramentas_N2',256,274],
  ['Room_Ferramentas_N2','Room_Deposito_N2',236,345],
  ['Room_Deposito_N2','Room_Laboratorio_N2',320,344],
  ['Room_Laboratorio_N2','Room_Externa',683,500],
  ['Room_Corredor_Pos','Room_Corredor_N2',1030,186],
  ['Room1','Room_Corredor_Pos',1120,384],
];

for (const [from,to,x,y] of seq) {
  const c = fixture();
  c.room = refs[from];
  c.global.pause_aberto = true;
  c.global.diario_aberto = true;
  c.global.config_aberta = true;
  c.global.dialogo_ativo = true;
  c.global.cutscene_ativa = true;
  c.global.vitoria_ativa = true;
  c.global.v5_duto_ativo = true;
  c.global.v5_queda_pendente = true;
  c.global.v5_checkpoint_transicao_pendente = true;
  c.global.chave_deposito = true; // deve persistir
  c.player.vida = 67;
  c.player.caixas_mecanicas = 4;
  c.v5_debug_avancar_room();
  const go = c.eventos.find(e => e[0] === 'goto');
  assert(go, `${from}: room_goto ausente`);
  assert.equal(go[1], refs[to], `${from}: destino incorreto`);
  assert.equal(c.global.spawn_room, refs[to]);
  assert.equal(c.global.spawn_x, x);
  assert.equal(c.global.spawn_y, y);
  assert.equal(c.global.vida_jogador, 67);
  assert.equal(c.global.caixas_mecanicas, 4);
  assert.equal(c.global.chave_deposito, true);
  assert.equal(c.global.pause_aberto, false);
  assert.equal(c.global.diario_aberto, false);
  assert.equal(c.global.config_aberta, false);
  assert.equal(c.global.dialogo_ativo, false);
  assert.equal(c.global.cutscene_ativa, false);
  assert.equal(c.global.vitoria_ativa, false);
}

// Room fora do ciclo entra pela Fachada.
{
  const c = fixture();
  c.room = refs.Room_Pesquisa;
  c.v5_debug_avancar_room();
  const go = c.eventos.find(e => e[0] === 'goto');
  assert.equal(go[1], refs.Room_Externa);
}

const playerStep = source('objects/Obj_jogador/Step_0.gml');
assert(playerStep.includes('if (keyboard_check_pressed(ord("P")))'));
assert(playerStep.includes('v5_debug_avancar_room();'));
assert(!playerStep.includes('apertou_p'));
assert(playerStep.includes('if (apertou_escape && !global.cutscene_ativa && !global.dialogo_ativo)'));

const flux = source('scripts/Scr_fluxo_v5/Scr_fluxo_v5.gml');
for (const name of ['Room_Externa','Room_Recepcao','Room_Armadilha','Room_Desmoronada','Room_Corredor','Room_Corredor_N2','Room_Manutencao_N2','Room_Funcionarios']) {
  assert(flux.includes(`case ${name}:`), `case ausente: ${name}`);
}

console.log('OK: ciclo P de 11 salas e entradas pelo boss/escadaria usam spawns seguros e preservam estado.');
