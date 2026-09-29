"""Gera as rooms do protótipo no formato do GameMaker 2024.14."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def instance(name, obj, x, y, scale_x=1.0, scale_y=1.0):
    return (
        f'{{"$GMRInstance":"v4","%Name":"{name}","colour":4294967295,'
        f'"frozen":false,"hasCreationCode":false,"ignore":false,"imageIndex":0,'
        f'"imageSpeed":1.0,"inheritCode":false,"inheritedItemId":null,'
        f'"inheritItemSettings":false,"isDnd":false,"name":"{name}",'
        f'"objectId":{{"name":"{obj}","path":"objects/{obj}/{obj}.yy",}},'
        f'"properties":[],"resourceType":"GMRInstance","resourceVersion":"2.0",'
        f'"rotation":0.0,"scaleX":{float(scale_x)},"scaleY":{float(scale_y)},"x":{float(x)},"y":{float(y)},}}'
    )


def views(follow_player=True):
    data = []
    for i in range(8):
        visible = "true" if i == 0 and follow_player else "false"
        obj = '{"name":"Obj_jogador","path":"objects/Obj_jogador/Obj_jogador.yy",}' if i == 0 and follow_player else "null"
        data.append(
            f'{{"hborder":320,"hport":768,"hspeed":12,"hview":540,"inherit":false,'
            f'"objectId":{obj},"vborder":180,"visible":{visible},"vspeed":12,'
            f'"wport":1366,"wview":960,"xport":0,"xview":0,"yport":0,"yview":0,}}'
        )
    return ",\n    ".join(data)


def make_gameplay_room(name, player_x, player_y):
    inst_map = f"inst_MAP_{name.upper()}"
    inst_player = f"inst_PLAYER_{name.upper()}"
    map_data = instance(inst_map, "Obj_mapa", 0, 0)
    player_data = instance(inst_player, "Obj_jogador", player_x, player_y)
    return f'''{{
  "$GMRoom":"v1",
  "%Name":"{name}",
  "creationCodeFile":"",
  "inheritCode":false,
  "inheritCreationOrder":false,
  "inheritLayers":false,
  "instanceCreationOrder":[
    {{"name":"{inst_map}","path":"rooms/{name}/{name}.yy",}},
    {{"name":"{inst_player}","path":"rooms/{name}/{name}.yy",}},
  ],
  "isDnd":false,
  "layers":[
    {{"$GMRInstanceLayer":"","%Name":"Instances","depth":0,"effectEnabled":true,"effectType":null,"gridX":32,"gridY":32,"hierarchyFrozen":false,"inheritLayerDepth":false,"inheritLayerSettings":false,"inheritSubLayers":true,"inheritVisibility":true,"instances":[
      {player_data}
    ],"layers":[],"name":"Instances","properties":[],"resourceType":"GMRInstanceLayer","resourceVersion":"2.0","userdefinedDepth":false,"visible":true,}},
    {{"$GMRInstanceLayer":"","%Name":"Mapa","depth":1000,"effectEnabled":true,"effectType":null,"gridX":32,"gridY":32,"hierarchyFrozen":false,"inheritLayerDepth":false,"inheritLayerSettings":false,"inheritSubLayers":true,"inheritVisibility":true,"instances":[
      {map_data}
    ],"layers":[],"name":"Mapa","properties":[],"resourceType":"GMRInstanceLayer","resourceVersion":"2.0","userdefinedDepth":false,"visible":true,}},
  ],
  "name":"{name}",
  "parent":{{"name":"rooms","path":"folders/rooms.yy",}},
  "parentRoom":null,
  "physicsSettings":{{"inheritPhysicsSettings":false,"PhysicsWorld":false,"PhysicsWorldGravityX":0.0,"PhysicsWorldGravityY":10.0,"PhysicsWorldPixToMetres":0.1,}},
  "resourceType":"GMRoom",
  "resourceVersion":"2.0",
  "roomSettings":{{"Height":768,"inheritRoomSettings":false,"persistent":false,"Width":1366,}},
  "sequenceId":null,
  "views":[
    {views(True)}
  ],
  "viewSettings":{{"clearDisplayBuffer":false,"clearViewBackground":false,"enableViews":true,"inheritViewSettings":false,}},
  "volume":1.0,
}}'''


def make_menu_room():
    name = "Room_Menu"
    inst = "inst_MENU"
    obj_data = instance(inst, "Obj_menu", 0, 0)
    return f'''{{
  "$GMRoom":"v1",
  "%Name":"{name}",
  "creationCodeFile":"",
  "inheritCode":false,
  "inheritCreationOrder":false,
  "inheritLayers":false,
  "instanceCreationOrder":[{{"name":"{inst}","path":"rooms/{name}/{name}.yy",}},],
  "isDnd":false,
  "layers":[
    {{"$GMRInstanceLayer":"","%Name":"Instances","depth":0,"effectEnabled":true,"effectType":null,"gridX":32,"gridY":32,"hierarchyFrozen":false,"inheritLayerDepth":false,"inheritLayerSettings":false,"inheritSubLayers":true,"inheritVisibility":true,"instances":[{obj_data}],"layers":[],"name":"Instances","properties":[],"resourceType":"GMRInstanceLayer","resourceVersion":"2.0","userdefinedDepth":false,"visible":true,}},
  ],
  "name":"{name}",
  "parent":{{"name":"rooms","path":"folders/rooms.yy",}},
  "parentRoom":null,
  "physicsSettings":{{"inheritPhysicsSettings":false,"PhysicsWorld":false,"PhysicsWorldGravityX":0.0,"PhysicsWorldGravityY":10.0,"PhysicsWorldPixToMetres":0.1,}},
  "resourceType":"GMRoom",
  "resourceVersion":"2.0",
  "roomSettings":{{"Height":768,"inheritRoomSettings":false,"persistent":false,"Width":1366,}},
  "sequenceId":null,
  "views":[
    {views(False)}
  ],
  "viewSettings":{{"clearDisplayBuffer":false,"clearViewBackground":false,"enableViews":false,"inheritViewSettings":false,}},
  "volume":1.0,
}}'''


def make_boss_room():
    name = "Room1"
    map_item = ("inst_MAP_BOSS", "Obj_mapa", 0, 0, 1, 1)
    items = [
        # A área ocupa praticamente toda a contenção. O chefe precisa alcançar
        # qualquer barril, inclusive os dois do lado oposto da arena.
        ("inst_AREA_BOSS", "Obj_area_boos", 40, 40, 20.1, 10.7),
        ("inst_PLAYER_BOSS", "Obj_jogador", 150, 384, 1, 1),
        ("inst_BOSS", "Obj_boss", 700, 330, 1, 1),
        ("inst_BARRIL_1", "Obj_barril", 430, 220, 1, 1),
        ("inst_BARRIL_2", "Obj_barril", 880, 220, 1, 1),
        ("inst_BARRIL_3", "Obj_barril", 500, 540, 1, 1),
        ("inst_BARRIL_4", "Obj_barril", 980, 530, 1, 1),
    ]
    all_items = [map_item] + items
    order = "\n    ".join(
        f'{{"name":"{inst_name}","path":"rooms/{name}/{name}.yy",}},'
        for inst_name, *_ in all_items
    )
    room_instances = "\n      ".join(
        instance(inst_name, obj, x, y, scale_x, scale_y) + ","
        for inst_name, obj, x, y, scale_x, scale_y in items
    )
    map_instance = instance(*map_item)
    return f'''{{
  "$GMRoom":"v1",
  "%Name":"{name}",
  "creationCodeFile":"",
  "inheritCode":false,
  "inheritCreationOrder":false,
  "inheritLayers":false,
  "instanceCreationOrder":[
    {order}
  ],
  "isDnd":false,
  "layers":[
    {{"$GMRInstanceLayer":"","%Name":"Instances","depth":0,"effectEnabled":true,"effectType":null,"gridX":32,"gridY":32,"hierarchyFrozen":false,"inheritLayerDepth":false,"inheritLayerSettings":false,"inheritSubLayers":true,"inheritVisibility":true,"instances":[
      {room_instances}
    ],"layers":[],"name":"Instances","properties":[],"resourceType":"GMRInstanceLayer","resourceVersion":"2.0","userdefinedDepth":false,"visible":true,}},
    {{"$GMRInstanceLayer":"","%Name":"Mapa","depth":1000,"effectEnabled":true,"effectType":null,"gridX":32,"gridY":32,"hierarchyFrozen":false,"inheritLayerDepth":false,"inheritLayerSettings":false,"inheritSubLayers":true,"inheritVisibility":true,"instances":[
      {map_instance}
    ],"layers":[],"name":"Mapa","properties":[],"resourceType":"GMRInstanceLayer","resourceVersion":"2.0","userdefinedDepth":false,"visible":true,}},
  ],
  "name":"{name}",
  "parent":{{"name":"rooms","path":"folders/rooms.yy",}},
  "parentRoom":null,
  "physicsSettings":{{"inheritPhysicsSettings":false,"PhysicsWorld":false,"PhysicsWorldGravityX":0.0,"PhysicsWorldGravityY":10.0,"PhysicsWorldPixToMetres":0.1,}},
  "resourceType":"GMRoom",
  "resourceVersion":"2.0",
  "roomSettings":{{"Height":768,"inheritRoomSettings":false,"persistent":false,"Width":1366,}},
  "sequenceId":null,
  "views":[
    {views(True)}
  ],
  "viewSettings":{{"clearDisplayBuffer":false,"clearViewBackground":false,"enableViews":true,"inheritViewSettings":false,}},
  "volume":1.0,
}}'''


ROOMS = {
    "Room_Menu": make_menu_room(),
    "Room_Externa": make_gameplay_room("Room_Externa", 683, 500),
    "Room_Recepcao": make_gameplay_room("Room_Recepcao", 683, 500),
    "Room_Armadilha": make_gameplay_room("Room_Armadilha", 683, 405),
    "Room_Desmoronada": make_gameplay_room("Room_Desmoronada", 170, 390),
    "Room_Corredor": make_gameplay_room("Room_Corredor", 100, 384),
    "Room_Pesquisa": make_gameplay_room("Room_Pesquisa", 100, 384),
    "Room_Biblioteca": make_gameplay_room("Room_Biblioteca", 100, 610),
    "Room1": make_boss_room(),
}

for room_name, contents in ROOMS.items():
    directory = ROOT / "rooms" / room_name
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{room_name}.yy").write_text(contents + "\n", encoding="utf-8")

print("Rooms geradas:", ", ".join(ROOMS))
