"""Importa os quatro GIFs direcionais sem girar, espelhar ou redesenhar pixels."""
from pathlib import Path
import copy
import json
import uuid
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'art_sources/v425'
ITEMS = [('direita', 'mao_lado.gif'), ('cima', 'mao_costas.gif'),
         ('esquerda', 'mao_cano_esquerda.gif'), ('baixo', 'mao_frente.gif')]

def load(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def main():
    project = load(ROOT / 'tcc.yyp')
    template = load(ROOT / 'sprites/Spr_canoAtaque/Spr_canoAtaque.yy')
    geometry = []
    for direction, filename in ITEMS:
        name = 'Spr_cano_' + direction
        folder = ROOT / 'sprites' / name
        folder.mkdir(parents=True, exist_ok=True)
        with Image.open(SOURCES / filename) as gif:
            frames = [f.convert('RGBA').copy() for f in ImageSequence.Iterator(gif)]
            assert len(frames) == 3 and all(f.size == (32, 32) for f in frames)
        data = copy.deepcopy(template)
        data['name'] = data['%Name'] = name
        data['origin'] = 9
        data['bboxMode'] = 0
        bounds = [im.getbbox() for im in frames]
        data.update(bbox_left=min(b[0] for b in bounds), bbox_top=min(b[1] for b in bounds),
                    bbox_right=max(b[2] for b in bounds)-1, bbox_bottom=max(b[3] for b in bounds)-1)
        seq = data['sequence']
        seq['name'] = seq['%Name'] = name
        seq['xorigin'] = seq['yorigin'] = 16
        seq['length'] = 3.0
        seq['playbackSpeed'] = 12.5
        layer = data['layers'][0]['name']
        keys = []
        data['frames'] = []
        metal_frames = []
        for i, im in enumerate(frames):
            fid = str(uuid.uuid5(uuid.NAMESPACE_URL, f'bunker-v425/{name}/{i}'))
            data['frames'].append({'$GMSpriteFrame':'v1','%Name':fid,'name':fid,
                                  'resourceType':'GMSpriteFrame','resourceVersion':'2.0'})
            (folder / 'layers' / fid).mkdir(parents=True, exist_ok=True)
            im.save(folder / (fid + '.png'))
            im.save(folder / 'layers' / fid / (layer + '.png'))
            key = copy.deepcopy(template['sequence']['tracks'][0]['keyframes']['Keyframes'][0])
            key['id'] = str(uuid.uuid5(uuid.NAMESPACE_URL, fid + '/key'))
            key['Key'], key['Length'] = float(i), 1.0
            key['Channels']['0']['Id'] = {'name':fid,'path':f'sprites/{name}/{name}.yy'}
            keys.append(key)
            # Metal = os dois tons cinza do GIF; exclui o braço e o fundo alpha.
            pixels = [(x,y) for y in range(32) for x in range(32)
                      if im.getpixel((x,y))[3] and
                      max(im.getpixel((x,y))[:3])-min(im.getpixel((x,y))[:3]) <= 4]
            metal_frames.append(pixels)
        seq['tracks'][0]['keyframes']['Keyframes'] = keys
        (folder / (name + '.yy')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
        if not any(r['id']['name'] == name for r in project['resources']):
            project['resources'].append({'id':{'name':name,'path':f'sprites/{name}/{name}.yy'}})
        geometry.append(metal_frames)
    (ROOT / 'tcc.yyp').write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
    # Geometria compilada: sem ler arquivos, criar surfaces ou sprites em runtime.
    code = ('// Gerado por tools/import_cano_v425.py. Pixels de metal dos GIFs originais.\n'
            'function bunker_cano_pixels(_dir, _quadro) {\n    if (!variable_global_exists("cano_geometria")) global.cano_geometria = '+
            json.dumps(geometry,separators=(',',':'))+';\n'
            '    return global.cano_geometria[clamp(_dir, 0, 3)][clamp(_quadro, 0, 2)];\n}\n')
    # Integra a função ao script existente, mantendo todos os outros sistemas.
    p = ROOT / 'scripts/Scr_bunker/Scr_bunker.gml'
    text = p.read_text()
    marker = '// GEOMETRIA CANO V4.25\n'
    if marker in text:
        text = text.split(marker)[0]
    p.write_text(text.rstrip()+'\n\n'+marker+code)
    print('4 sprites, 12 quadros com alpha e geometria do metal importados.')

if __name__ == '__main__':
    main()
