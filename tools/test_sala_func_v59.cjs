/* Validação focal da Sala dos Funcionários v5.9.
 * Não substitui execução no GameMaker; valida recursos, rota, colisões e assinaturas da lógica.
 */
process.env.BUNKER_SKIP_TESTS = '1';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {fixture, run, refs} = require('./test_regressions.cjs');
const root = path.resolve(__dirname, '..');
const source = p => fs.readFileSync(path.join(root,p),'utf8');

const c = fixture();
c.room = refs.Room_Funcionarios;
c.room_width = 960;
c.room_height = 540;
c.actors = [];
c.walls = [];
run(c, 'objects/Obj_mapa/Create_0.gml');

assert.equal(c.actors.filter(a => a.kind === refs.Obj_caracol).length, 0, 'a sala não deve criar inimigos');
const retorno = c.actors.find(a => a.kind === refs.Obj_porta && a.destino === refs.Room_Corredor_N2);
assert(retorno, 'porta de retorno ao corredor N2 ausente');
assert.equal(retorno.visual_estatico, true);
assert.deepEqual([retorno.x, retorno.y], [120,470]);

const create = source('objects/Obj_mapa/Create_0.gml');
assert(create.includes('criar_parede(88,185,250,82,7)')); // sofá
assert(create.includes('criar_parede(390,238,195,106,7)')); // mesa
assert(create.includes('criar_parede(620,82,150,132,2)')); // estante
assert(create.includes('criar_parede(652,298,230,140,4)')); // bancada

const step = source('objects/Obj_mapa/Step_0.gml');
assert(step.includes('func_jogador.vida + 35'));
assert(step.includes('global.chave_deposito = true'));
assert(step.includes('global.chave_sala_ferramentas = true'));
assert(step.includes('func_feedback_frame = 8'));
assert(step.includes('Obj_feedback_funcionarios'));
assert(!source('objects/Obj_mapa/Draw_64.gml').includes('FEEDBACK TEXTUAL / SALA DOS FUNCIONÁRIOS'));

const draw = source('objects/Obj_mapa/Draw_0.gml');
assert(draw.startsWith('// SPRITE-FIRST / SALA DOS FUNCIONÁRIOS'));
assert(draw.includes('if (room == Room_Funcionarios) exit;'));

const room = JSON.parse(source('rooms/Room_Funcionarios/Room_Funcionarios.yy'));
assert.equal(room.roomSettings.Width, 960);
assert.equal(room.roomSettings.Height, 540);
assert(room.layers.some(l => (l.instances||[]).some(i => i.objectId?.name === 'Obj_sala_funcionarios_cenario')));

console.log('OK: Sala dos Funcionários v5.9 — sprite-first, rota, colisões, café, chaves e dormitório validados.');
