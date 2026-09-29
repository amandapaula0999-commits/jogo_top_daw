#!/usr/bin/env python3
"""Verifica identidades e referências YY. Não substitui o linker do GameMaker."""
import json,re,sys
from pathlib import Path
from collections import Counter
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
errors=[]
def load(p):
 text=p.read_text(encoding='utf-8-sig')
 return json.loads(re.sub(r'("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])',lambda m:m.group(1) or '',text))
def visit(v,file,loc=''):
 if isinstance(v,dict):
  if '%Name' in v and 'name' in v and v['%Name']!=v['name']:
   errors.append(f'{file}:{loc}: %Name={v["%Name"]} difere de name={v["name"]}')
  if isinstance(v.get('path'),str) and v['path'].endswith('.yy') and v['path'] not in folder_paths and not (root/v['path']).is_file():
   errors.append(f'{file}:{loc}: caminho ausente {v["path"]}')
  for k,a in v.items():visit(a,file,loc+'/'+k)
 elif isinstance(v,list):
  for i,a in enumerate(v):visit(a,file,loc+'/'+str(i))
project=load(root/'tcc.yyp');folder_paths={d['folderPath'] for d in project.get('Folders',[])};names=[r['id']['name'] for r in project['resources']]
for n,c in Counter(names).items():
 if c>1:errors.append('Recurso duplicado: '+n)
rooms=0;instances=0
for f in [root/'tcc.yyp',*root.rglob('*.yy')]:
 d=load(f);visit(d,str(f.relative_to(root)))
 if d.get('resourceType')!='GMRoom':continue
 rooms+=1
 def layers(ls):
  for l in ls:
   yield l
   yield from layers(l.get('layers',[]))
 all_i=[i for l in layers(d.get('layers',[])) for i in l.get('instances',[])]
 instances+=len(all_i);ids=[i['name'] for i in all_i];order=[i['name'] for i in d.get('instanceCreationOrder',[])]
 for n,c in Counter(ids).items():
  if c>1:errors.append(f'{f.name}: instância duplicada {n}')
 if Counter(ids)!=Counter(order):errors.append(f'{f.name}: ordem de criação não corresponde às instâncias')
 for i in all_i:
  if i['objectId']['name'] not in names:errors.append(f'{f.name}: objeto não registrado {i["objectId"]["name"]}')
for e in errors:print('ERRO:',e)
if errors:sys.exit(1)
print(f'OK: identidades e referências conferidas — {len(names)} recursos, {rooms} rooms, {instances} instâncias.')
