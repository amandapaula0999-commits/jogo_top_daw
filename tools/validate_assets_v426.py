"""Compara o sprite integrado com o anexo original, sem tolerância de pixels."""
from pathlib import Path
from PIL import Image, ImageSequence
import json

ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'sprites/Spr_pause_fundo'
data=json.loads((folder/'Spr_pause_fundo.yy').read_text())
frame=data['frames'][0]['name'];layer=data['layers'][0]['name']
source=Image.open(ROOT/'art_sources/v426/carteira_original.jpg').convert('RGBA')
assert source.size==(1376,768)
for p in [folder/(frame+'.png'),folder/'layers'/frame/(layer+'.png')]:
    im=Image.open(p).convert('RGBA')
    assert im.size==source.size and im.tobytes()==source.tobytes()
assert data['width']==1376 and data['height']==768
print('OK: carteira e layer preservam todos os pixels decodificados do JPG original.')
original=ROOT/'art_sources/v426/mao_costas.gif'
active=ROOT/'art_sources/v425/mao_costas.gif'
assert original.read_bytes()==active.read_bytes()
folder=ROOT/'sprites/Spr_cano_cima'
data=json.loads((folder/'Spr_cano_cima.yy').read_text())
frames=[f.convert('RGBA').copy() for f in ImageSequence.Iterator(Image.open(original))]
assert len(frames)==len(data['frames'])==3
for i,frame in enumerate(data['frames']):
    im=Image.open(folder/(frame['name']+'.png')).convert('RGBA')
    assert im.tobytes()==frames[i].tobytes()
print('OK: os três quadros para cima são cópias exatas do GIF reenviado.')
