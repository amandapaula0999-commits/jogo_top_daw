/* Executa o GML com APIs simuladas; sem compilação no GameMaker. */
process.env.BUNKER_SKIP_TESTS='1';
const assert=require('node:assert/strict');
const {fixture,run,refs}=require('./test_regressions.cjs');
let tests=0;
for(const kind of [refs.Obj_homem_lagarto,refs.Obj_caracol_lab]){
 const c=fixture();let ready=false,created=0,deleted=0;const rectangles=[];
 const wall=new Proxy({x:100,y:80,largura:64,altura:32},{get(target,key){if(!ready&&['largura','altura'].includes(key))throw Error('Parede ainda não executou Create');return target[key]}});
 c.instance_number=r=>r===refs.Obj_parede?1:0;c.instance_find=()=>wall;
 c.path_add=()=>({});c.path_exists=()=>true;c.path_delete=()=>{};
 c.mp_grid_create=()=>{created++;return {}};
 c.mp_grid_add_rectangle=(g,...v)=>rectangles.push(v);
 c.mp_grid_destroy=()=>deleted++;
 const e={object_index:kind};
 c.s8_lagarto_iniciar(e);assert.equal(created,0);assert.equal(e.grade,-1);
 ready=true;c.s8_lagarto_preparar_grade(e);c.s8_lagarto_preparar_grade(e);
 assert.equal(created,1);assert.equal(rectangles.length,1);
 assert.deepEqual(rectangles[0],[100-e.pe_r,80-e.pe_b,164+e.pe_l,112+e.pe_t]);
 c.grade=e.grade;c.caminho=e.caminho;run(c,`objects/${kind.description}/CleanUp_0.gml`);assert.equal(deleted,1);
 c.grade=-1;run(c,`objects/${kind.description}/CleanUp_0.gml`);assert.equal(deleted,1);
 tests++;console.log('OK:',kind.description,'aguarda paredes e libera recursos com segurança');
}
console.log(tests+' testes passaram.');
