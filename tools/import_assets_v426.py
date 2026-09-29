"""Importação literal dos anexos: sem redesenho, recorte ou redimensionamento."""
from pathlib import Path
import json
import shutil
from PIL import Image
from import_cano_v425 import main as import_cano

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art_sources/v426'

def main():
    # A cópia recebida é idêntica à anterior, mas permanece como fonte desta entrega.
    shutil.copyfile(SRC / 'mao_costas.gif', ROOT / 'art_sources/v425/mao_costas.gif')
    import_cano()
    folder = ROOT / 'sprites/Spr_pause_fundo'
    path = folder / 'Spr_pause_fundo.yy'
    data = json.loads(path.read_text())
    with Image.open(SRC / 'carteira_original.jpg') as original:
        image = original.convert('RGBA')
    w, h = image.size
    data.update(width=w,height=h,bbox_left=0,bbox_top=0,bbox_right=w-1,bbox_bottom=h-1)
    data['sequence'].update(backdropWidth=w,backdropHeight=h,xorigin=0,yorigin=0)
    frame = data['frames'][0]['name']
    layer = data['layers'][0]['name']
    image.save(folder / (frame + '.png'))
    image.save(folder / 'layers' / frame / (layer + '.png'))
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(f'Carteira importada em {w}x{h}, sem alteração dos pixels decodificados do JPG.')

if __name__ == '__main__':
    main()
