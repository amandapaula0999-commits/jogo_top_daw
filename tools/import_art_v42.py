#!/usr/bin/env python3
"""Importa atlas RGBA já aprovados; apenas separa e registra quadros, sem retocar arte.

O Boss não é importado nem alterado: seu ataque é composto em GML a partir do original.
"""
import json
import re
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def yy(path):
    return json.loads(re.sub(r'("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])', lambda m: m[1] or '', path.read_text()))

def slices(path):
    image = Image.open(path)
    if image.mode != 'RGBA' or image.getchannel('A').getextrema() != (0, 255):
        raise ValueError(f'{path}: atlas deve possuir transparência real')
    w, h = image.size
    cells = [image.crop((round(c*w/4), round(r*h/5), round((c+1)*w/4), round((r+1)*h/5)))
             for r in range(5) for c in range(4)]
    boxes = [im.getbbox() for im in cells]
    if any(b is None for b in boxes):
        raise ValueError('Quadro vazio')
    return cells, boxes

def import_sprite(name, cells, boxes, indexes, size, height, origin):
    folder = ROOT/'sprites'/name
    data = yy(folder/(name+'.yy'))
    # Uma escala comum para todo o atlas, evitando pulsação de tamanho na caminhada.
    factor = height / max(b[3]-b[1] for b in boxes[:16])
    layer = data['layers'][0]['name']
    frames = data['frames']
    for i, frame in enumerate(frames):
        source_index = indexes[i % len(indexes)]
        source = cells[source_index].crop(boxes[source_index])
        source = source.resize((max(1,round(source.width*factor)), max(1,round(source.height*factor))), Image.Resampling.NEAREST)
        canvas = Image.new('RGBA', (size, size))
        canvas.paste(source, (round((size-source.width)/2), origin[1]-source.height))
        main = folder/(frame['name']+'.png')
        layer_path = folder/'layers'/frame['name']/(layer+'.png')
        layer_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(main)
        canvas.save(layer_path)
    data['width'] = size
    data['height'] = size
    data['origin'] = 9
    data['sequence']['xorigin'], data['sequence']['yorigin'] = origin
    data['bboxMode'] = 2
    data['bbox_left'], data['bbox_right'] = size//2-12, size//2+11
    data['bbox_top'], data['bbox_bottom'] = origin[1]-12, origin[1]
    data['edgeFiltering'] = False
    (folder/(name+'.yy')).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')

def main():
    enemy, people = map(Path, sys.argv[1:3])
    for source, name in [(enemy,'inimigo_comum_alpha_v42.png'),(people,'inspetor_e_npcs_v42.png')]:
        shutil.copy2(source, ROOT/'art_sources'/name)
    cells, boxes = slices(enemy)
    for direction, row in [('baixo',0),('cima',1),('esqueda',2),('direita',3)]:
        import_sprite('Spr_inimigo_andando_'+direction,cells,boxes,list(range(row*4,row*4+4)),128,102,(64,112))
    for direction, index in [('baixo',0),('cima',4),('esqueda',8),('direita',12)]:
        name = 'Spr_inimigo_parado_'+direction
        if (ROOT/'sprites'/name).exists(): import_sprite(name,cells,boxes,[index],128,102,(64,112))
    import_sprite('Spr_inimigo_morte',cells,boxes,[16,17,18,19],128,102,(64,112))
    cells, boxes = slices(people)
    for direction, row in [('baixo',0),('cima',1),('esquerda',2),('direita',3)]:
        import_sprite('Spr_jogador_andando_'+direction,cells,boxes,list(range(row*4,row*4+4)),64,42,(32,48))
        import_sprite('Spr_jogador_parado_'+direction,cells,boxes,[row*4],64,42,(32,48))
    for name, index in [('Spr_recepcionista',16),('Spr_cientista1',17),('Spr_cientista2',19)]:
        if (ROOT/'sprites'/name).exists(): import_sprite(name,cells,boxes,[index],64,42,(32,48))
    print('Atlas importados: inimigo, inspetor e NPCs. Sprites do Boss preservados.')

if __name__ == '__main__': main()
