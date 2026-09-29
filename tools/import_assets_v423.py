"""Importação determinística dos arquivos fornecidos; sem redesenhar os pixels."""
from pathlib import Path
import copy, json, re, uuid, shutil
from PIL import Image, ImageDraw, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art_sources/v423'
def load(path):
    return json.loads(re.sub(r',\s*([}\]])', r'\1', path.read_text(encoding='utf-8-sig')))

def sprite(name, images, origin, bbox, fps):
    folder = ROOT / 'sprites' / name
    is_new = not (folder / (name + '.yy')).exists()
    data = load(ROOT/'sprites/Spr_menu_fundo/Spr_menu_fundo.yy') if is_new else load(folder / (name + '.yy'))
    folder.mkdir(parents=True,exist_ok=True)
    data['name']=data['%Name']=name
    data['sequence']['name']=data['sequence']['%Name']=name
    template = copy.deepcopy(data['sequence']['tracks'][0]['keyframes']['Keyframes'][0])
    old_frames = [] if is_new else [f['name'] for f in data['frames']]
    layer = data['layers'][0]['name']
    frames, keys = [], []
    for i, im in enumerate(images):
        fid = str(uuid.uuid5(uuid.NAMESPACE_URL, 'bunker-v423/' + name + '/' + str(i)))
        frames.append({'$GMSpriteFrame':'v1','%Name':fid,'name':fid,'resourceType':'GMSpriteFrame','resourceVersion':'2.0'})
        im.save(folder / (fid + '.png'))
        dest = folder / 'layers' / fid
        dest.mkdir(parents=True, exist_ok=True)
        im.save(dest / (layer + '.png'))
        key = copy.deepcopy(template)
        key['id'] = str(uuid.uuid5(uuid.NAMESPACE_URL, fid + '/key'))
        key['Key'], key['Length'] = float(i), 1.0
        key['Channels']['0']['Id'] = {'name':fid,'path':f'sprites/{name}/{name}.yy'}
        keys.append(key)
    data['frames'] = frames
    data['width'], data['height'] = images[0].size
    data['origin'] = 9
    data['bboxMode'] = 2
    data['bbox_left'], data['bbox_top'], data['bbox_right'], data['bbox_bottom'] = bbox
    data['collisionKind'] = 1
    seq = data['sequence']
    seq['length'] = float(len(images))
    seq['xorigin'], seq['yorigin'] = origin
    seq['backdropWidth'], seq['backdropHeight'] = images[0].size
    seq['playbackSpeed'], seq['playbackSpeedType'] = fps, 0
    seq['tracks'][0]['keyframes']['Keyframes'] = keys
    (folder / (name + '.yy')).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
    if is_new:
        p=ROOT/'tcc.yyp'; project=load(p)
        project['resources'].append({'id':{'name':name,'path':f'sprites/{name}/{name}.yy'}})
        p.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Only superseded frames in the new version are removed; v4.22 is intact.
    keep = {f['name'] for f in frames}
    for fid in old_frames:
        if fid not in keep:
            p = folder / (fid + '.png')
            if p.exists(): p.unlink()
            p = folder / 'layers' / fid
            if p.is_dir(): shutil.rmtree(p)

walk = Image.open(SRC / 'Agente_prota_andando.png').convert('RGBA')
idle = Image.open(SRC / 'Agente_prota_parado.png').convert('RGBA')
assert walk.size == (128,128) and idle.size == (64,64)
directions = ['direita','baixo','cima','esquerda']
for row, direction in enumerate(directions):
    frames = [walk.crop((col*32,row*32,col*32+32,row*32+32)) for col in range(4)]
    still = idle.crop(((row%2)*32,(row//2)*32,(row%2+1)*32,(row//2+1)*32))
    # Same 32x32 canvas and foot origin for every direction/state.
    boxes=[im.getbbox() for im in frames]
    box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes)-1,max(b[3] for b in boxes)-1)
    sprite('Spr_jogador_andando_'+direction, frames, (16,32), box, 8)
    for kind in ['idle','parado']:
        b=still.getbbox()
        sprite('Spr_jogador_'+kind+'_'+direction, [still], (16,32), (b[0],b[1],b[2]-1,b[3]-1), 1)

with Image.open(SRC / 'Cano_ataque.gif') as gif:
    attack = [frame.convert('RGBA').copy() for frame in ImageSequence.Iterator(gif)]
with Image.open(SRC / 'Atendente.gif') as gif:
    npc = [frame.convert('RGBA').copy() for frame in ImageSequence.Iterator(gif)]
sprite('Spr_canoAtaque', attack, (12,18), (5,3,31,30), 12.5)
sprite('Spr_recepcionista', npc, (26,35), (20,30,32,34), 4)
with Image.open(SRC / 'Pregos_direcional.gif') as gif:
    pregos=[frame.convert('RGBA').copy() for frame in ImageSequence.Iterator(gif)]
sprite('Spr_arma_pregos', pregos, (16,16), (2,6,29,22), 1)
wallet=Image.open(SRC/'Carteira_frontal.png').convert('RGBA')
sprite('Spr_pause_fundo', [wallet], (0,0), (0,0,wallet.width-1,wallet.height-1), 1)
gun_sheet=Image.new('RGBA',(512,148),(28,33,39,255))
for i,im in enumerate(pregos):
    gun_sheet.alpha_composite(im.resize((128,128),Image.Resampling.NEAREST),(i*128,20))
    ImageDraw.Draw(gun_sheet).text((i*128+4,3),str(i),fill='white')
gun_sheet.save(ROOT/'PISTOLA_QUADROS_V4_23.png')

# Enlarged inspection sheet, with original transparency over a neutral grid.
out = Image.new('RGBA',(13*128,150),(28,33,39,255))
for i,im in enumerate(attack):
    out.alpha_composite(im.resize((128,128),Image.Resampling.NEAREST),(i*128,20))
    ImageDraw.Draw(out).text((i*128+4,3),str(i),fill='white')
out.save(ROOT/'ATAQUE_QUADROS_V4_23.png')
print('Importados: 16 caminhada, 4 idle, 4 aliases parado, 10 ataque do cano, 4 pistola, 10 NPC.')
tips=[]
for im in attack[:9]:
    points=[(x,y) for y in range(32) for x in range(32)
        if im.getpixel((x,y))[3]>0 and max(im.getpixel((x,y))[:3])-min(im.getpixel((x,y))[:3])<18]
    tips.append(max(points,key=lambda p:(p[0]-12)**2+(p[1]-18)**2))
print('Pontas do cano por quadro:',tips)
