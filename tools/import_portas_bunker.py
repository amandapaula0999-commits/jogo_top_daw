#!/usr/bin/env python3
"""Importa os quadros enviados para dois sprites de porta do bunker.

Uso:
    python3 tools/import_portas_bunker.py /caminho/para/os/arquivos

O diretório informado deve conter Sprite1.yy, Sprite2.yy e os PNGs citados
nesses arquivos. Quadros ausentes são ignorados com aviso; nenhum quadro é
inventado ou redesenhado.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def stable_uuid(value: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"escape-the-bunker/{value}"))


def frame_names(source_yy: Path) -> list[str]:
    # Arquivos .yy do GameMaker aceitam vírgulas finais, por isso extraímos
    # somente a primeira lista de frames sem tentar carregá-la como JSON puro.
    header = source_yy.read_text(encoding="utf-8").split('"gridX"', 1)[0]
    return re.findall(r'"%Name":"([0-9a-f-]{36})"', header)


def sprite_data(name: str, frames: list[str], speed: float, bbox: tuple[int, int, int, int]) -> dict:
    layer_id = stable_uuid(f"{name}/default-layer")
    sprite_path = f"sprites/{name}/{name}.yy"
    keyframes = []
    for index, frame_id in enumerate(frames):
        keyframes.append(
            {
                "$Keyframe<SpriteFrameKeyframe>": "",
                "Channels": {
                    "0": {
                        "$SpriteFrameKeyframe": "",
                        "Id": {"name": frame_id, "path": sprite_path},
                        "resourceType": "SpriteFrameKeyframe",
                        "resourceVersion": "2.0",
                    }
                },
                "Disabled": False,
                "id": stable_uuid(f"{name}/keyframe/{index}/{frame_id}"),
                "IsCreationKey": False,
                "Key": float(index),
                "Length": 1.0,
                "resourceType": "Keyframe<SpriteFrameKeyframe>",
                "resourceVersion": "2.0",
                "Stretch": False,
            }
        )

    left, top, right, bottom = bbox
    return {
        "$GMSprite": "v2",
        "%Name": name,
        "bboxMode": 0,
        "bbox_bottom": bottom,
        "bbox_left": left,
        "bbox_right": right,
        "bbox_top": top,
        "collisionKind": 1,
        "collisionTolerance": 0,
        "DynamicTexturePage": False,
        "edgeFiltering": False,
        "For3D": False,
        "frames": [
            {
                "$GMSpriteFrame": "v1",
                "%Name": frame_id,
                "name": frame_id,
                "resourceType": "GMSpriteFrame",
                "resourceVersion": "2.0",
            }
            for frame_id in frames
        ],
        "gridX": 0,
        "gridY": 0,
        "height": 64,
        "HTile": False,
        "layers": [
            {
                "$GMImageLayer": "",
                "%Name": layer_id,
                "blendMode": 0,
                "displayName": "default",
                "isLocked": False,
                "name": layer_id,
                "opacity": 100.0,
                "resourceType": "GMImageLayer",
                "resourceVersion": "2.0",
                "visible": True,
            }
        ],
        "name": name,
        "nineSlice": None,
        "origin": 4,
        "parent": {"name": "sprites", "path": "folders/sprites.yy"},
        "preMultiplyAlpha": False,
        "resourceType": "GMSprite",
        "resourceVersion": "2.0",
        "sequence": {
            "$GMSequence": "v1",
            "%Name": name,
            "autoRecord": True,
            "backdropHeight": 768,
            "backdropImageOpacity": 0.5,
            "backdropImagePath": "",
            "backdropWidth": 1366,
            "backdropXOffset": 0.0,
            "backdropYOffset": 0.0,
            "events": {
                "$KeyframeStore<MessageEventKeyframe>": "",
                "Keyframes": [],
                "resourceType": "KeyframeStore<MessageEventKeyframe>",
                "resourceVersion": "2.0",
            },
            "eventStubScript": None,
            "eventToFunction": {},
            "length": float(len(frames)),
            "lockOrigin": False,
            "moments": {
                "$KeyframeStore<MomentsEventKeyframe>": "",
                "Keyframes": [],
                "resourceType": "KeyframeStore<MomentsEventKeyframe>",
                "resourceVersion": "2.0",
            },
            "name": name,
            "playback": 1,
            "playbackSpeed": speed,
            "playbackSpeedType": 0,
            "resourceType": "GMSequence",
            "resourceVersion": "2.0",
            "showBackdrop": True,
            "showBackdropImage": False,
            "timeUnits": 1,
            "tracks": [
                {
                    "$GMSpriteFramesTrack": "",
                    "builtinName": 0,
                    "events": [],
                    "inheritsTrackColour": True,
                    "interpolation": 1,
                    "isCreationTrack": False,
                    "keyframes": {
                        "$KeyframeStore<SpriteFrameKeyframe>": "",
                        "Keyframes": keyframes,
                        "resourceType": "KeyframeStore<SpriteFrameKeyframe>",
                        "resourceVersion": "2.0",
                    },
                    "modifiers": [],
                    "name": "frames",
                    "resourceType": "GMSpriteFramesTrack",
                    "resourceVersion": "2.0",
                    "spriteId": None,
                    "trackColour": 0,
                    "tracks": [],
                    "traits": 0,
                }
            ],
            "visibleRange": None,
            "volume": 1.0,
            "xorigin": 32,
            "yorigin": 32,
        },
        "swatchColours": None,
        "swfPrecision": 0.5,
        "textureGroupId": {"name": "Default", "path": "texturegroups/Default"},
        "type": 0,
        "VTile": False,
        "width": 64,
    }


def import_sprite(
    source_dir: Path,
    source_name: str,
    target_name: str,
    speed: float,
    bbox: tuple[int, int, int, int],
) -> tuple[int, list[str]]:
    source_yy = source_dir / source_name
    all_frames = frame_names(source_yy)
    frames = [frame for frame in all_frames if (source_dir / f"{frame}.png").is_file()]
    missing = [frame for frame in all_frames if frame not in frames]
    if not frames:
        raise SystemExit(f"Nenhum PNG de {source_name} foi encontrado em {source_dir}")

    target_dir = ROOT / "sprites" / target_name
    target_dir.mkdir(parents=True, exist_ok=True)
    layer_id = stable_uuid(f"{target_name}/default-layer")

    for frame in frames:
        source_png = source_dir / f"{frame}.png"
        shutil.copy2(source_png, target_dir / f"{frame}.png")
        layer_dir = target_dir / "layers" / frame
        layer_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_png, layer_dir / f"{layer_id}.png")

    yy_data = sprite_data(target_name, frames, speed, bbox)
    (target_dir / f"{target_name}.yy").write_text(
        json.dumps(yy_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return len(frames), missing


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python3 tools/import_portas_bunker.py DIRETORIO_DOS_ARQUIVOS")
    source_dir = Path(sys.argv[1]).resolve()

    imports = (
        ("Sprite1.yy", "Spr_porta_bunker_restrita", 15.0, (16, 5, 48, 56)),
        ("Sprite2.yy", "Spr_porta_bunker_comum", 12.0, (13, 7, 45, 58)),
    )
    for source_name, target_name, speed, bbox in imports:
        count, missing = import_sprite(source_dir, source_name, target_name, speed, bbox)
        print(f"OK: {target_name} importado com {count} quadros")
        if missing:
            print(f"AVISO: {len(missing)} quadros não enviados foram ignorados")


if __name__ == "__main__":
    main()
