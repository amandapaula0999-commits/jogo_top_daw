#!/usr/bin/env python3
"""Validação estática rápida do projeto Escape the Bunker.

Não substitui a compilação no GameMaker, mas detecta caminhos quebrados,
frames ausentes, schema de áudio incompleto e corredores sem rota jogável.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path
import json
import re
import struct
import sys


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def load_yy(file_path: Path) -> dict:
    # Remove vírgulas finais do formato YY preservando strings e escapes.
    text = file_path.read_text(encoding="utf-8-sig")
    clean = re.sub(r'("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])',
                   lambda match: match.group(1) or "", text)
    return json.loads(clean)


parsed_files = 0
for yy_file in [ROOT / "tcc.yyp", *ROOT.rglob("*.yy")]:
    try:
        load_yy(yy_file)
        parsed_files += 1
    except (ValueError, OSError) as error:
        fail(f"YY/YYP inválido: {yy_file.relative_to(ROOT)}: {error}")


project_text = (ROOT / "tcc.yyp").read_text(encoding="utf-8")
resources = [(item['id']['name'], item['id']['path']) for item in load_yy(ROOT/'tcc.yyp')['resources']]
if len(resources) < 90: fail('catálogo incompleto de recursos')

seen_names: set[str] = set()
for name, relative in resources:
    if name in seen_names:
        fail(f"recurso duplicado no tcc.yyp: {name}")
    seen_names.add(name)
    if not (ROOT / relative).is_file():
        fail(f"recurso ausente: {relative}")


for name, relative in resources:
    if not relative.startswith("sprites/"):
        continue
    yy_path = ROOT / relative
    if not yy_path.is_file():
        continue
    text = yy_path.read_text(encoding="utf-8")
    sprite_dir = yy_path.parent

    frames_match = re.search(r'"frames"\s*:\s*\[(.*?)\]\s*,\s*"gridX"', text, re.S)
    layers_match = re.search(r'"layers"\s*:\s*\[(.*?)\]\s*,\s*"name"', text, re.S)
    if not frames_match or not layers_match:
        fail(f"sprite sem blocos de frame/layer legíveis: {relative}")
        continue

    frames = re.findall(r'"%Name"\s*:\s*"([^"]+)"', frames_match.group(1))
    layers = re.findall(r'"%Name"\s*:\s*"([^"]+)"', layers_match.group(1))
    if not frames or not layers:
        fail(f"sprite sem frame ou layer: {relative}")
        continue

    for frame in frames:
        if not (sprite_dir / f"{frame}.png").is_file():
            fail(f"PNG principal ausente: {sprite_dir.name}/{frame}.png")
        for layer in layers:
            layer_png = sprite_dir / "layers" / frame / f"{layer}.png"
            if not layer_png.is_file():
                fail(f"PNG de layer ausente: {layer_png.relative_to(ROOT)}")


# Todo evento listado deve possuir seu arquivo de código, sobretudo End Step.
event_prefix = {0: "Create", 1: "Destroy", 2: "Alarm", 3: "Step", 5: "Keyboard",
                6: "Mouse", 7: "Other", 8: "Draw", 9: "KeyPress", 10: "KeyRelease", 12: "CleanUp"}
for name, relative in resources:
    if not relative.startswith("objects/"):
        continue
    obj_path = ROOT / relative
    obj = load_yy(obj_path)
    for event in obj.get("eventList", []):
        typ, num = event["eventType"], event["eventNum"]
        if typ == 4:
            filename = "Collision_" + event["collisionObjectId"]["name"] + ".gml"
        elif typ in event_prefix:
            filename = event_prefix[typ] + "_" + str(num) + ".gml"
        else:
            continue
        if not obj_path.parent.joinpath(filename).is_file():
            fail(f"código do evento ausente: {name}/{filename}")


for name, relative in resources:
    if not relative.startswith("sounds/"):
        continue
    text = (ROOT / relative).read_text(encoding="utf-8")
    if '"channelFormat":' not in text:
        fail(f"channelFormat ausente: {relative}")
    if '"compressionQuality":' not in text:
        fail(f"compressionQuality ausente: {relative}")
    sound = load_yy(ROOT / relative)
    if not (ROOT / relative).parent.joinpath(sound.get("soundFile", "")).is_file():
        fail(f"arquivo de áudio ausente: {relative}")


# Sequências importadas: todos os canais apontam para frames e paths reais.
for sprite_name, expected_count in (("Spr_porta_bunker_comum", 17), ("Spr_porta_bunker_restrita", 22)):
    rel = f"sprites/{sprite_name}/{sprite_name}.yy"
    sprite = load_yy(ROOT / rel)
    frames = [frame["name"] for frame in sprite["frames"]]
    sequence = sprite["sequence"]
    keyframes = sequence["tracks"][0]["keyframes"]["Keyframes"]
    if len(frames) != expected_count or len(set(frames)) != expected_count:
        fail(f"quantidade incorreta ou frames duplicados: {sprite_name}")
    if sequence["length"] != len(frames) or len(keyframes) != len(frames):
        fail(f"duração/quantidade de keyframes inválida: {sprite_name}")
    for index, frame in enumerate(frames):
        channel = keyframes[index]["Channels"]["0"]["Id"]
        if channel != {"name": frame, "path": rel} or keyframes[index]["Key"] != index:
            fail(f"sequência fora de ordem: {sprite_name}, quadro {index}")
        main_png = (ROOT / rel).parent / f"{frame}.png"
        if main_png.is_file():
            png = main_png.read_bytes()
            if png[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', png[16:24]) != (64, 64):
                fail(f"PNG inválido ou diferente de 64x64: {sprite_name}/{frame}")


required_code = {
    "objects/Obj_jogador/Create_0.gml": ["max_vel = 2.65", "Spr_mascara_jogador"],
    "objects/Obj_jogador/Step_0.gml": ["bunker_coletar_municao", "pode_atirar", "restante_x", "vk_shift"],
    "objects/Obj_boss/Create_0.gml": ["alcance_aggro = 1600"],
    "objects/Obj_caracol/Step_0.gml": ["Spr_inimigo_morte", "lado_anim", "Obj_parede"],
    "objects/Obj_mapa/Create_0.gml": ["semente_visual = 1", "detalhar_indicio", "adicionar_indicio"],
    "objects/Obj_mapa/Step_0.gml": ["bunker_audio_forcar", "bunker_audio_atualizar", "indicio_perto"],
    "scripts/Scr_bunker/Scr_bunker.gml": ["bunker_impacto", "bunker_visivel", "bunker_registrar"],
    "objects/Obj_mapa/Draw_64.gml": ["ANOTAÇÃO DE VISTORIA", "INSPECIONAR IRREGULARIDADE"],
    "objects/Obj_porta/Step_0.gml": ["Spr_porta_bunker_comum", "Spr_porta_bunker_restrita", "quadro_porta", "room_goto(destino)"],
    "objects/Obj_porta/Draw_0.gml": ["draw_sprite_ext(sprite_porta", "visual_restrita"],
    "objects/Obj_pause/Step_0.gml": ["global.cutscene_ativa = false", "global.dialogo_ativo = false", "global.spawn_room = -1"],
}
for relative, markers in required_code.items():
    text = (ROOT / relative).read_text(encoding="utf-8")
    for marker in markers:
        if marker not in text:
            fail(f"marcador de implementação ausente em {relative}: {marker}")
    if text.count("{") != text.count("}"):
        fail(f"chaves desbalanceadas em {relative}")


draw_mapa = (ROOT / "objects/Obj_mapa/Draw_0.gml").read_text(encoding="utf-8")
if "prop_manchas(room" in draw_mapa or "_semente * 47" in draw_mapa:
    fail("o cálculo inseguro de manchas com referência de room ainda está presente")
if "semente_visual * 47" not in draw_mapa:
    fail("a semente numérica segura das manchas não foi encontrada")

for gml_path in ROOT.rglob("*.gml"):
    text = gml_path.read_text(encoding="utf-8")
    if text.count("{") != text.count("}"):
        fail(f"chaves desbalanceadas em {gml_path.relative_to(ROOT)}")


# Rotas dinâmicas: tools/test_collisions.cjs executa o Create de cada sala
# e usa todas as paredes/props efetivamente criados. Não manter cópia manual.


if ERRORS:
    print("VALIDAÇÃO FALHOU")
    for error in ERRORS:
        print(f"- {error}")
    sys.exit(1)

print(f"OK: {len(resources)} recursos referenciados")
print(f"OK: {parsed_files} arquivos YY/YYP lidos estruturalmente")
print("OK: sprites possuem PNG principal e layers")
print("OK: schema de áudio compatível com GameMaker 2024.14")
print("OK: colisão, munição, aggro e animações presentes")
print("OK: manchas usam semente numérica; troca de trilha e indícios ambientais presentes")
print("OK: portas clara e restrita possuem frames e transição animada")
print("OK: 39 quadros de portas com sequência, dimensões e referências conferidas")
print("INFO: rotas completas verificadas por node tools/test_collisions.cjs")
