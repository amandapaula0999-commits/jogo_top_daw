"""Confere importação literal: mesmos pixels, ordem, dimensões e transparência."""
import json
from PIL import Image, ImageSequence
from import_cano_v425 import ROOT, SOURCES, ITEMS

count = 0
for direction, filename in ITEMS:
    folder = ROOT / 'sprites' / ('Spr_cano_' + direction)
    data = json.loads((folder / ('Spr_cano_' + direction + '.yy')).read_text())
    layer = data['layers'][0]['name']
    with Image.open(SOURCES / filename) as gif:
        frames = [frame.convert('RGBA').copy() for frame in ImageSequence.Iterator(gif)]
    assert len(frames) == len(data['frames']) == 3
    for i, im in enumerate(frames):
        name = data['frames'][i]['name']
        for p in [folder / (name + '.png'), folder / 'layers' / name / (layer + '.png')]:
            result = Image.open(p).convert('RGBA')
            assert result.size == im.size == (32,32)
            assert result.tobytes() == im.tobytes(), str(p)
        assert im.getpixel((0,0))[3] == 0
        count += 1
    print('OK:', filename, '-> Spr_cano_' + direction)
print(f'OK: {count} quadros e suas layers preservam os pixels RGBA originais.')
