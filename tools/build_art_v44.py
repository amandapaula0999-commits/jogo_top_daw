#!/usr/bin/env python3
"""Gera a carteira diegética do menu e importa o idle novo do inspetor.

O texto do menu é rasterizado no PNG com a mesma folha de fonte do projeto;
o Draw GUI apenas marca o objeto selecionado. O atlas do protagonista vem da
arte gerada para esta revisão e é reduzido com nearest-neighbour para 64 px,
sem alpha semitransparente nas bordas.
"""
from __future__ import annotations

import copy
import json
import random
import re
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
MENU_BASE = ROOT / "art_sources" / "menu_base_v42.png"
MENU_OUT = ROOT / "art_sources" / "menu_diegetico_v44.png"
IDLE_ATLAS = ROOT / "art_sources" / "protagonista_idle_v43_generated.png"
FONT_PNG = ROOT / "fonts" / "Font_de_fala" / "Font_de_fala.png"
FONT_YY = ROOT / "fonts" / "Font_de_fala" / "Font_de_fala.yy"


def read_yy(path: Path):
    raw = re.sub(r'("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])', lambda m: m.group(1) or "", path.read_text())
    return json.loads(raw)


def glyphs():
    data = read_yy(FONT_YY)
    atlas = Image.open(FONT_PNG).convert("RGBA")
    result = {}
    for key, item in data["glyphs"].items():
        result[int(key)] = (atlas.crop((item["x"], item["y"], item["x"] + item["w"], item["y"] + item["h"])), item["shift"])
    return result


def text_image(text: str, colour, scale: int, font):
    parts = []
    width = 0
    for char in text:
        item = font.get(ord(char), font.get(ord("?")))
        if item is None:
            continue
        glyph, shift = item
        parts.append((glyph, shift))
        width += shift * scale
    image = Image.new("RGBA", (max(1, width + 2 * scale), 18 * scale), (0, 0, 0, 0))
    x = 0
    for glyph, shift in parts:
        mask = glyph.getchannel("A").resize((glyph.width * scale, glyph.height * scale), Image.Resampling.NEAREST)
        layer = Image.new("RGBA", mask.size, colour)
        layer.putalpha(mask)
        image.alpha_composite(layer, (x, 0))
        x += shift * scale
    return image


def paste_text(canvas, text, centre, top, colour, scale, font, shadow=True):
    rendered = text_image(text, colour, scale, font)
    x = round(centre[0] - rendered.width / 2)
    y = round(top)
    if shadow:
        shadow_img = text_image(text, (18, 18, 16, 210), scale, font)
        canvas.alpha_composite(shadow_img, (x + scale, y + scale))
    canvas.alpha_composite(rendered, (x, y))


def shifted(points, dx, dy):
    return [(x + dx, y + dy) for x, y in points]


def restore_wallet_surface(canvas):
    """Limpa os botões antigos sem desenhar outra carteira por cima.

    A arte base já tem a aba direita, a dobradiça e o contorno do couro. O
    menu anterior cobria essa área com um painel independente, por isso os
    documentos pareciam uma janela de interface. Aqui copiamos apenas o
    couro vazio que já existe na parte inferior da mesma carteira, em tiles
    discretos, mantendo intactos as bordas e a iluminação da ilustração.
    """
    # A parte acima da aba é cenário (árvores e céu), não couro. Recuperá-la
    # primeiro evita que o menu crie um retângulo marrom flutuando sobre o
    # topo da carteira.
    # A faixa é preenchida com a copa escura que já existe imediatamente à
    # esquerda. Um espelhamento único evita tanto o céu deslocado quanto uma
    # repetição de azulejos perceptível no fundo.
    bg_source = canvas.crop((840, 280, 918, 315)).convert("RGBA")
    bg_wide = Image.new("RGBA", (bg_source.width * 6, bg_source.height), (0, 0, 0, 0))
    for index in range(6):
        tile = bg_source if index % 2 == 0 else bg_source.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        bg_wide.paste(tile, (index * bg_source.width, 0))
    bg = bg_wide.crop((0, 0, 326, 35))
    canvas.paste(bg, (930, 280))

    x0, y0, x1, y1 = (918, 315, 1260, 535)
    source = canvas.crop((944, 545, 1148, 624)).convert("RGBA")
    patch = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    tile_w, tile_h = source.size
    for ty, y in enumerate(range(0, patch.height, tile_h)):
        for tx, x in enumerate(range(0, patch.width, tile_w)):
            tile = source
            if (tx + ty) % 2:
                tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if ty % 3 == 2:
                tile = tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            patch.alpha_composite(tile, (x, y))
    canvas.paste(patch.crop((0, 0, x1 - x0, y1 - y0)), (x0, y0))
    draw = ImageDraw.Draw(canvas)
    # Uma única costura superior liga a aba direita à aba esquerda; não há
    # contorno vertical de painel.
    draw.line((916, 315, 1260, 318), fill=(30, 17, 10, 235), width=4)
    draw.line((923, 316, 1252, 319), fill=(190, 118, 44, 165), width=2)
    for stitch_x in range(940, 1246, 30):
        draw.rectangle((stitch_x, 321, stitch_x + 7, 322), fill=(218, 142, 54, 145))


def draw_pocket_insert(canvas, points, fill, outline=(37, 22, 12, 255), width=2):
    """Desenha só o papel/cartão que sai da fenda, nunca uma moldura de UI."""
    draw = ImageDraw.Draw(canvas)
    draw.polygon(points, fill=fill, outline=outline, width=width)


def draw_jogar(canvas, font, dx=0, dy=0):
    draw = ImageDraw.Draw(canvas)
    # Crachá azul: só a faixa superior escapa do bolso, como o detalhe azul
    # original da referência. As bordas laterais ficam escondidas no couro.
    draw_pocket_insert(canvas, shifted([(958, 323), (1234, 325), (1236, 331), (1233, 358), (965, 356), (955, 350)], dx, dy), (42, 65, 78, 255), (22, 25, 22, 255), 1)
    draw.line((966 + dx, 327 + dy, 1227 + dx, 329 + dy), fill=(112, 126, 126, 150), width=1)
    draw.rectangle((971 + dx, 329 + dy, 1020 + dx, 353 + dy), fill=(168, 157, 119, 255), outline=(32, 31, 24, 255), width=2)
    draw.rectangle((977 + dx, 333 + dy, 1014 + dx, 341 + dy), fill=(86, 104, 106, 255))
    draw.rectangle((977 + dx, 345 + dy, 1010 + dx, 347 + dy), fill=(73, 74, 67, 255))
    paste_text(canvas, "JOGAR", (1124 + dx, 328 + dy), 328 + dy, (228, 209, 159, 255), 2, font)


def draw_controles(canvas, font, dx=0, dy=0):
    draw = ImageDraw.Draw(canvas)
    # Papel dobrado, curto e preso pela costura do bolso intermediário.
    draw_pocket_insert(canvas, shifted([(963, 378), (1233, 380), (1237, 385), (1233, 410), (969, 408), (959, 402)], dx, dy), (173, 149, 106, 255), (68, 42, 22, 255), 1)
    draw.polygon(shifted([(1218, 379), (1233, 380), (1237, 385), (1224, 388)], dx, dy), fill=(210, 181, 128, 255))
    draw.line((976 + dx, 391 + dy, 1018 + dx, 389 + dy), fill=(111, 73, 37, 180), width=1)
    paste_text(canvas, "CONTROLES", (1114 + dx, 382 + dy), 382 + dy, (57, 39, 23, 255), 2, font)


def draw_configuracoes(canvas, font, dx=0, dy=0):
    draw = ImageDraw.Draw(canvas)
    # Cartão técnico amarelado. Ele aparece como uma aba estreita; a metade
    # inferior continua escondida atrás do couro.
    draw_pocket_insert(canvas, shifted([(964, 446), (1233, 448), (1237, 454), (1233, 478), (970, 476), (960, 470)], dx, dy), (157, 137, 77, 255), (61, 39, 20, 255), 1)
    draw.rectangle((974 + dx, 451 + dy, 1221 + dx, 453 + dy), fill=(198, 171, 90, 150))
    paste_text(canvas, "CONFIGURAÇÕES", (1098 + dx, 449 + dy), 449 + dy, (55, 38, 19, 255), 1, font)
    paste_text(canvas, "ÁUDIO / EFEITOS", (1098 + dx, 464 + dy), 464 + dy, (216, 168, 83, 220), 1, font, shadow=False)


def draw_sair(canvas, font, dx=0, dy=0):
    # Etiqueta vermelha de emergência, encaixada na fenda inferior da aba
    # esquerda. O couro da carteira nunca é redesenhado ao redor dela.
    draw = ImageDraw.Draw(canvas)
    draw.polygon(shifted([(632, 543), (837, 546), (843, 553), (839, 577), (641, 574), (630, 567)], dx, dy), fill=(104, 39, 29, 255), outline=(46, 23, 14, 255), width=2)
    paste_text(canvas, "SAIR", (735 + dx, 548 + dy), 548 + dy, (232, 190, 128, 255), 2, font)
    paste_text(canvas, "PASSE DE SAÍDA", (735 + dx, 569 + dy), 570 + dy, (204, 139, 67, 220), 1, font, shadow=False)
    draw.rectangle((805 + dx, 556 + dy, 816 + dx, 576 + dy), fill=(50, 24, 15, 255))


def draw_slot_backings(canvas):
    """Cria apenas as sombras horizontais das fendas já existentes."""
    draw = ImageDraw.Draw(canvas)
    # Não há moldura, topo ou laterais novas: são só três aberturas costuradas
    # na superfície contínua da aba direita.
    openings = [
        [(946, 355), (1247, 358), (1244, 365), (950, 362)],
        [(946, 408), (1247, 411), (1244, 418), (950, 415)],
        [(946, 476), (1247, 479), (1244, 486), (950, 483)],
    ]
    for points in openings:
        draw.polygon(points, fill=(37, 21, 12, 190), outline=(30, 17, 10, 180), width=2)
        draw.line((points[0][0] + 9, points[0][1] + 2, points[1][0] - 9, points[1][1] + 3), fill=(181, 111, 43, 130), width=1)


def draw_slot_lip(canvas, box):
    """Tira frontal que prende a peça na fenda quando ela não está focada."""
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(canvas)
    draw.polygon([(x0, y0), (x1, y0 + 2), (x1 - 5, y1), (x0 + 8, y1 - 2)], fill=(77, 39, 20, 255), outline=(31, 17, 11, 255), width=3)
    draw.line((x0 + 12, y0 + 3, x1 - 12, y0 + 5), fill=(194, 119, 44, 190), width=2)
    for stitch_x in range(x0 + 20, x1 - 14, 28):
        draw.rectangle((stitch_x, y0 + 7, stitch_x + 7, y0 + 8), fill=(231, 155, 62, 180))


def menu_frame(base, font, selected):
    image = base.copy()
    # O foco sai da fenda: os três documentos da aba direita deslizam para a
    # direita; a etiqueta da aba esquerda desliza para a esquerda.
    offsets = [(12, 0) if selected == 0 else (0, 0),
               (12, 0) if selected == 1 else (0, 0),
               (12, 0) if selected == 2 else (0, 0),
               (-12, 0) if selected == 3 else (0, 0)]
    draw_slot_backings(image)
    draw_jogar(image, font, *offsets[0])
    draw_controles(image, font, *offsets[1])
    draw_configuracoes(image, font, *offsets[2])
    draw_sair(image, font, *offsets[3])
    # As tiras ficam na frente dos itens não focados; o item selecionado sai
    # da fenda e passa por cima da tira como uma peça realmente puxada.
    if selected != 0:
        draw_slot_lip(image, (942, 355, 1248, 368))
    if selected != 1:
        draw_slot_lip(image, (942, 409, 1248, 422))
    if selected != 2:
        draw_slot_lip(image, (942, 477, 1248, 490))
    if selected != 3:
        draw_slot_lip(image, (621, 568, 846, 580))
    return image


def save_png_atomic(image, path: Path):
    """Evita PNG parcialmente escrito se o editor vigiar a pasta de assets."""
    temp = path.with_name(path.name + ".tmp")
    try:
        image.save(temp, format="PNG")
        temp.replace(path)
    finally:
        if temp.exists():
            temp.unlink()


def update_menu_sprite(frames):
    folder = ROOT / "sprites" / "Spr_menu_bg"
    yy_path = folder / "Spr_menu_bg.yy"
    data = read_yy(yy_path)
    layer_name = data["layers"][0]["name"]
    frame_names = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"escape-the-bunker-menu-v44-{i}")) for i in range(len(frames))]
    data["frames"] = [{"$GMSpriteFrame": "v1", "%Name": name, "name": name,
                        "resourceType": "GMSpriteFrame", "resourceVersion": "2.0"}
                       for name in frame_names]
    track = data["sequence"]["tracks"][0]
    template = track["keyframes"]["Keyframes"][0]
    keyframes = []
    for index, name in enumerate(frame_names):
        key = copy.deepcopy(template)
        key["id"] = str(uuid.uuid5(uuid.NAMESPACE_URL, f"escape-the-bunker-menu-v44-key-{index}"))
        key["Key"] = float(index)
        key["Channels"]["0"]["Id"]["name"] = name
        key["Channels"]["0"]["Id"]["path"] = "sprites/Spr_menu_bg/Spr_menu_bg.yy"
        keyframes.append(key)
    track["keyframes"]["Keyframes"] = keyframes
    data["sequence"]["length"] = float(len(frames))
    yy_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    for image, name in zip(frames, frame_names):
        save_png_atomic(image, folder / f"{name}.png")
        layer = folder / "layers" / name / f"{layer_name}.png"
        layer.parent.mkdir(parents=True, exist_ok=True)
        save_png_atomic(image, layer)
    return frames[0]


def build_menu():
    base = Image.open(MENU_BASE).convert("RGBA")
    font = glyphs()

    # Retira os botões antigos copiando couro da própria carteira. Nenhuma
    # moldura independente é adicionada: a aba original continua sendo uma
    # única peça de couro com fendas horizontais.
    restore_wallet_surface(base)
    frames = [menu_frame(base, font, selected) for selected in range(4)]
    default = update_menu_sprite(frames)
    save_png_atomic(default, MENU_OUT)


def largest_component_box(alpha, cell_box):
    x0, y0, x1, y1 = cell_box
    mask = alpha[y0:y1, x0:x1] >= 32
    labels, count = ndimage.label(mask, structure=np.ones((3, 3), dtype=np.uint8))
    if count == 0:
        raise ValueError(f"quadro vazio: {cell_box}")
    sizes = np.bincount(labels.ravel())
    label = int(np.argmax(sizes[1:]) + 1)
    ys, xs = np.where(labels == label)
    return (x0 + int(xs.min()), y0 + int(ys.min()), x0 + int(xs.max()) + 1, y0 + int(ys.max()) + 1)


def idle_frame(source, box, target_height=42):
    crop = source.crop(box)
    alpha = np.array(crop.getchannel("A"))
    alpha = (alpha >= 32).astype(np.uint8) * 255
    crop.putalpha(Image.fromarray(alpha, "L"))
    bbox = crop.getchannel("A").getbbox()
    crop = crop.crop(bbox)
    scale = target_height / crop.height
    size = (max(1, round(crop.width * scale)), target_height)
    crop = crop.resize(size, Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    canvas.alpha_composite(crop, (round((64 - crop.width) / 2), 48 - crop.height))
    return canvas


def import_idle():
    source = Image.open(IDLE_ATLAS).convert("RGBA")
    alpha = np.array(source.getchannel("A"))
    w, h = source.size
    x_edges = [round(i * w / 4) for i in range(5)]
    y_edges = [round(i * h / 4) for i in range(5)]
    rows = [("baixo", 0), ("cima", 1), ("direita", 2), ("esquerda", 3)]
    for direction, row in rows:
        name = f"Spr_jogador_idle_{direction}"
        folder = ROOT / "sprites" / name
        data = read_yy(folder / f"{name}.yy")
        for col, frame in enumerate(data["frames"]):
            cell = (x_edges[col], y_edges[row], x_edges[col + 1], y_edges[row + 1])
            box = largest_component_box(alpha, cell)
            canvas = idle_frame(source, box)
            main = folder / f"{frame['name']}.png"
            layer = folder / "layers" / frame["name"] / f"{data['layers'][0]['name']}.png"
            layer.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(main)
            canvas.save(layer)

    # A pose parada usada pelo pause/diário precisa ser a mesma pose nova.
    for direction, row in rows:
        name = f"Spr_jogador_parado_{direction}"
        folder = ROOT / "sprites" / name
        data = read_yy(folder / f"{name}.yy")
        cell = (x_edges[0], y_edges[row], x_edges[1], y_edges[row + 1])
        canvas = idle_frame(source, largest_component_box(alpha, cell))
        frame = data["frames"][0]
        main = folder / f"{frame['name']}.png"
        layer = folder / "layers" / frame["name"] / f"{data['layers'][0]['name']}.png"
        layer.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(main)
        canvas.save(layer)


if __name__ == "__main__":
    build_menu()
    import_idle()
    print("Menu diegético v44 e idle importados.")
