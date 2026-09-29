#!/usr/bin/env python3
"""Separa os elementos do menu usando o gerador original (sem alterar gameplay).

Reimportação opcional; os PNGs e YYs prontos já acompanham o projeto.
"""
import copy
import json
import uuid
from pathlib import Path
from PIL import Image, ImageDraw
import build_art_v44 as art

ROOT = Path(__file__).resolve().parents[1]

def uid(name):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'bunker-v419-' + name))

def sprite(name, frames):
    data = art.read_yy(ROOT / 'sprites/Spr_menu_bg/Spr_menu_bg.yy')
    data['name'] = data['%Name'] = name
    data['textureGroupId'] = {'name':'Menu_Carteira','path':'texturegroups/Menu_Carteira'}
    w,h = frames[0].size
    data.update(width=w, height=h, bbox_left=0, bbox_top=0, bbox_right=w-1, bbox_bottom=h-1)
    data['frames'] = []
    data['layers'][0]['name'] = data['layers'][0]['%Name'] = uid(name+'-layer')
    seq = data['sequence']
    seq['name'] = seq['%Name'] = name
    seq['length'] = len(frames)
    seq['xorigin'] = seq['yorigin'] = 0
    seq['backdropWidth'],seq['backdropHeight'] = w,h
    track = seq['tracks'][0]
    template = copy.deepcopy(track['keyframes']['Keyframes'][0])
    track['keyframes']['Keyframes'] = []
    folder = ROOT / 'sprites' / name
    folder.mkdir(parents=True,exist_ok=True)
    for i,im in enumerate(frames):
        fid = uid(name+str(i))
        data['frames'].append({'$GMSpriteFrame':'v1','%Name':fid,'name':fid,'resourceType':'GMSpriteFrame','resourceVersion':'2.0'})
        key = copy.deepcopy(template)
        key['id'],key['Key'] = uid(fid+'key'),float(i)
        key['Channels']['0']['Id'] = {'name':fid,'path':f'sprites/{name}/{name}.yy'}
        track['keyframes']['Keyframes'].append(key)
        art.save_png_atomic(im,folder/(fid+'.png'))
        layer = folder/'layers'/fid/(data['layers'][0]['name']+'.png')
        layer.parent.mkdir(parents=True,exist_ok=True)
        art.save_png_atomic(im,layer)
    (folder/(name+'.yy')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    return {'id':{'name':name,'path':f'sprites/{name}/{name}.yy'}}

def main():
    base = Image.open(art.MENU_BASE).convert('RGBA')
    art.restore_wallet_surface(base)
    art.draw_slot_backings(base)
    font = art.glyphs()
    lips = Image.new('RGBA',base.size)
    for box in [(942,355,1248,368),(942,409,1248,422),(942,477,1248,490)]:
        art.draw_slot_lip(lips,box)
    # Couro original da frente do bolso esquerdo, acima do cartão no Draw.
    mask = Image.new('L',base.size)
    ImageDraw.Draw(mask).polygon([(620,416),(841,433),(840,451),(619,434)],fill=255)
    leather = base.copy()
    leather.putalpha(mask)
    lips.alpha_composite(leather)
    right = []
    for draw,top,colour in [(art.draw_jogar,323,(42,65,78,255)),(art.draw_controles,378,(173,149,106,255)),(art.draw_configuracoes,446,(157,137,77,255))]:
        layer = Image.new('RGBA',base.size)
        # Parte escondida do documento: ao subir, ele continua dentro do bolso.
        ImageDraw.Draw(layer).polygon([(965,top+20),(1233,top+22),(1230,top+100),(970,top+100)],
                                      fill=colour,outline=(61,39,20,255),width=1)
        draw(layer,font)
        right.append(layer.crop((942,top,1262,top+110)))
    # Cartão inteiro e opaco: o mesmo asset serve ao hover e à cobertura final.
    card = Image.new('RGBA',(224,104),(104,39,29,255))
    d = ImageDraw.Draw(card)
    d.rectangle((1,1,222,102),outline=(42,23,16,255),width=3)
    d.rectangle((6,6,217,97),outline=(180,113,58,255),width=1)
    d.line((12,31,211,31),fill=(155,82,43,255),width=1)
    art.paste_text(card,'SAIR',(112,8),8,(232,190,128,255),2,font)
    art.paste_text(card,'PASSE DE SAÍDA',(112,40),40,(222,165,93,255),1,font,False)
    art.paste_text(card,'HORIZON CORP.',(112,62),62,(192,130,71,255),1,font,False)
    for x in range(20,205,6):
        d.rectangle((x,83,x+2,90),fill=(61,27,19,255))
    new = [sprite('Spr_menu_fundo',[base]),sprite('Spr_menu_bolsos',[lips]),
           sprite('Spr_menu_cartoes',right),sprite('Spr_menu_sair',[card])]
    project_path = ROOT/'tcc.yyp'
    project = art.read_yy(project_path)
    if not any(g['name'] == 'Menu_Carteira' for g in project['TextureGroups']):
        group = copy.deepcopy(project['TextureGroups'][0])
        group['name'] = group['%Name'] = 'Menu_Carteira'
        group['autocrop'] = False
        project['TextureGroups'].append(group)
    names = {r['id']['name'] for r in project['resources']}
    project['resources'].extend(r for r in new if r['id']['name'] not in names)
    project_path.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
    print('4 sprites registrados; fundo, bolsos e cartões separados. Gameplay preservado.')

if __name__ == '__main__':
    main()
