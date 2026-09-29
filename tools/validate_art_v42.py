#!/usr/bin/env python3
"""Verificação de invariantes visuais e de recursos. Requer Pillow."""
import hashlib
import json
import re
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
def yy(p):
    return json.loads(re.sub(r'("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])',lambda m:m[1] or '',p.read_text()))

hashes = json.loads((root/'tools/boss_original_sha256.json').read_text())
for name, expected in hashes.items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected, name
print(f'OK: {len(hashes)} arquivos do Boss preservados byte por byte.')

count=0
for folder in root.glob('sprites/Spr_inimigo*'):
    for p in folder.glob('*.png'):
        im=Image.open(p).convert('RGBA')
        alpha_min,alpha_max=im.getchannel('A').getextrema()
        assert alpha_min==0 and alpha_max>=250,p
        for r,g,b,a in getattr(im,'get_flattened_data',im.getdata)():
            # Detecta resíduos brancos/cinzentos visíveis do antigo fundo falso.
            assert not (a>16 and min(r,g,b)>185 and max(r,g,b)-min(r,g,b)<22),p
        count+=1
print(f'OK: {count} quadros do inimigo têm alpha real e nenhum halo claro visível detectado.')

for room in root.glob('rooms/*/*.yy'):
    d=yy(room)
    instances=[i for layer in d['layers'] for i in layer.get('instances',[])]
    names={i['name'] for i in instances}
    assert {i['name'] for i in d['instanceCreationOrder']}==names,room
    assert not any(i['objectId']['name']=='Obj_caixaPregos' for i in instances),room
print('OK: sem caixas legadas nas rooms; ordem de criação consistente.')

for obj in root.glob('objects/*/*.yy'):
    for ev in yy(obj)['eventList']:
        if ev['eventType'] in [0,3,8,12]:
            prefix={0:'Create',3:'Step',8:'Draw',12:'CleanUp'}[ev['eventType']]
            assert (obj.parent/f'{prefix}_{ev["eventNum"]}.gml').is_file(),obj
print('OK: eventos Create, Step, Draw e CleanUp apontam para código existente.')
