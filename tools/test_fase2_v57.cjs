/* Validação focal da Fase 2 / escadaria em build de testes v5.8.
 * Executa a lógica GML com o mesmo harness dos testes de regressão.
 * Não substitui compilação/execução no GameMaker.
 */
process.env.BUNKER_SKIP_TESTS = '1';
const assert = require('node:assert/strict');
const {fixture, run, refs} = require('./test_regressions.cjs');

const c = fixture();
c.room = refs.Room_Corredor_Pos;
c.actors = [];
c.walls = [];
run(c, 'objects/Obj_mapa/Create_0.gml');

const stair = c.actors.find(a => a.kind === refs.Obj_porta && a.tipo_passagem === 'escada');
assert(stair, 'escada do Nível 1 não foi criada');
Object.assign(stair, {mensagem_tempo: 0, tempo_duto: 0, mensagem_bloqueio: '', chave_exigida: 'escadaria'});
c.player.x = stair.x;
c.player.y = stair.y;
c.keys.add(c.ord('E'));

// Build de testes: a escada deve funcionar mesmo sem chave e sem derrotar o Boss.
c.global.v53_chave_escada = false;
c.global.boss_derrotado = false;
c.v5_passagem_atualizar(stair);
assert.equal(c.global.spawn_room, refs.Room_Corredor_N2);
assert.deepEqual([c.global.spawn_x, c.global.spawn_y], [1120, 384]);
assert.equal(c.global.v5_checkpoint_transicao_pendente, true);

// A chegada consome o spawn e grava o checkpoint no patamar seguro.
c.room = refs.Room_Corredor_N2;
c.actors = [];
c.walls = [];
run(c, 'objects/Obj_mapa/Create_0.gml');
c.x = 100;
c.y = 384;
c.window_get_fullscreen = () => true;
run(c, 'objects/Obj_jogador/Create_0.gml');
assert.deepEqual([c.x, c.y], [1120, 384]);
assert.equal(c.global.v5_checkpoint_room, refs.Room_Corredor_N2);
assert.deepEqual([c.global.v5_checkpoint_x, c.global.v5_checkpoint_y], [1120, 384]);
assert.equal(c.global.v5_checkpoint_transicao_pendente, false);

// A room do Nível 2 continua sem inimigos e agora contém a escada de retorno + porta da Sala dos Funcionários.
assert.equal(c.actors.filter(a => a.kind === refs.Obj_caracol).length, 0);
const passages = c.actors.filter(a => a.kind === refs.Obj_porta);
assert.equal(passages.length, 2);
const stairBack = passages.find(p => p.tipo_passagem === 'escada');
const staffDoor = passages.find(p => p.destino === refs.Room_Funcionarios);
assert(stairBack);
assert.equal(stairBack.destino, refs.Room_Corredor_Pos);
assert.deepEqual([stairBack.spawn_x, stairBack.spawn_y], [1120, 384]);
assert(staffDoor);
assert.deepEqual([staffDoor.spawn_x, staffDoor.spawn_y], [130, 430]);
assert.equal(staffDoor.visual_estatico, true);

console.log('OK: Fase 2 v5.9 TESTE — escada, checkpoint e acesso à Sala dos Funcionários validados.');
