/// IA compartilhada dos lagartos e caracóis do laboratório.
function s8_lagarto_iniciar(_e) {
    _e.lab11_slot = -1;
    _e.lado_anim = 3;
    var _caracol = _e.object_index == Obj_caracol_lab;
    _e.vida_max = _caracol ? 30 : 40;
    _e.vida = _e.vida_max;
    _e.morrendo = false;
    _e.tomou_dano = false;
    _e.feedback_tempo = 0;
    _e.feedback_texto = "";
    _e.estado = "PERSEGUINDO";
    _e.image_speed = 0;
    _e.sprite_index = _caracol ? Spr_inimigo_parado_baixo : Spr_lagarto_parado_baixo;
    _e.mask_index = _caracol ? Spr_mascara_inimigo : Spr_mascara_jogador;
    _e.image_xscale = _caracol ? bunker_escala_inimigo() : 1;
    _e.image_yscale = _e.image_xscale;
    _e.image_index = 0;
    _e.velocidade_caca = _caracol ? 0.85 : 1.25;
    _e.dano_ataque = _caracol ? 10 : 12;
    _e.pe_l = _caracol ? 14 : 11;
    _e.pe_r = _caracol ? 14 : 10;
    _e.pe_t = _caracol ? 8 : 4;
    _e.pe_b = _caracol ? 8 : 11;
    _e.ataque_tempo = 0;
    _e.ataque_espera = 35;
    _e.rota_tempo = 0;
    _e.rota_indice = 0;
    _e.caminho = path_add();
    // A room ainda pode conter paredes cujo Create não foi executado.
    // A grade será construída no primeiro Step, após a inicialização da room.
    _e.grade = -1;
}

function s8_lagarto_preparar_grade(_e) {
    if (_e.grade != -1) return;
    // Células de 4 px preservam os corredores estreitos entre as cápsulas.
    _e.grade = mp_grid_create(0,0,ceil(room_width/4),ceil(room_height/4),4,4);
    // Dilata obstáculos pelos pés do inimigo para evitar cortar as quinas.
    for (var _i=0; _i<instance_number(Obj_parede); _i++) {
        var _w = instance_find(Obj_parede,_i);
        mp_grid_add_rectangle(_e.grade,_w.x-_e.pe_r,_w.y-_e.pe_b,_w.x+_w.largura+_e.pe_l,_w.y+_w.altura+_e.pe_t);
    }
}

function s8_lagarto_step(_e) {
    if (global.pause_aberto || global.config_aberta || global.diario_aberto
        || global.cutscene_ativa || global.dialogo_ativo) return;
    s8_lagarto_preparar_grade(_e);
    if (_e.vida <= 0) {
        if (room == Room_Laboratorio_N2 && _e.lab11_slot >= 0) global.lab11_derrotados[_e.lab11_slot] = true;
        bunker_audio_tocar_efeito(Snd_finalizacao,8,false);
        instance_destroy(_e);
        return;
    }
    var _j = instance_find(Obj_jogador,0);
    if (_j == noone || _j.vida <= 0) return;
    var _antes_x = _e.x; var _antes_y = _e.y;
    var _dist = point_distance(_e.x,_e.y,_j.x,_j.y);
    if (_e.ataque_espera > 0) _e.ataque_espera--;
    if (_e.ataque_tempo > 0) {
        _e.ataque_tempo--;
        if (_e.ataque_tempo == 0) {
            if (_dist <= 39 && !_j.invulneravel
                && collision_line(_e.x,_e.y,_j.x,_j.y,Obj_parede,false,true) == noone) {
                _j.vida = max(0,_j.vida-_e.dano_ataque);
                global.vida_jogador = _j.vida;
                _j.invulneravel = true;
                _j.alarm[0] = 60;
                bunker_audio_tocar_efeito(Snd_impacto_boss,8,false);
            }
            _e.ataque_espera = 55;
        }
    } else if (_dist <= 35 && _e.ataque_espera <= 0
        && collision_line(_e.x,_e.y,_j.x,_j.y,Obj_parede,false,true) == noone) {
        _e.ataque_tempo = 20; // Janela para esquivar antes do golpe.
    } else if (_dist > 29) {
        _e.rota_tempo--;
        if (_e.rota_tempo <= 0) {
            _e.rota_tempo = 20;
            _e.rota_indice = 1;
            path_clear_points(_e.caminho);
            mp_grid_path(_e.grade,_e.caminho,_e.x,_e.y,_j.x,_j.y,false);
        }
        var _tx = _j.x; var _ty = _j.y;
        var _n = path_get_number(_e.caminho);
        if (_e.rota_indice < _n) {
            _tx = path_get_point_x(_e.caminho,_e.rota_indice);
            _ty = path_get_point_y(_e.caminho,_e.rota_indice);
            if (point_distance(_e.x,_e.y,_tx,_ty) <= 3) _e.rota_indice++;
        }
        var _dir = point_direction(_e.x,_e.y,_tx,_ty);
        var _vx = lengthdir_x(_e.velocidade_caca,_dir); var _vy = lengthdir_y(_e.velocidade_caca,_dir);
        // Varredura contínua da máscara dos pés; respeita parede até sem rota.
        if (!s8_pe_bloqueado(_e,_e.x+_vx,_e.y)) _e.x += _vx;
        if (!s8_pe_bloqueado(_e,_e.x,_e.y+_vy)) _e.y += _vy;
    }
    if (_e.object_index == Obj_homem_lagarto) s34_lagarto_animar(_e, _e.x-_antes_x, _e.y-_antes_y);
    // Apenas propriedades de sprite; nenhum evento Draw no inimigo.
    _e.image_blend = _e.ataque_tempo > 0 ? make_color_rgb(245,150,115) : c_white;

}

function s8_pe_bloqueado(_e,_x,_y) {
    return collision_rectangle(_x-_e.pe_l,_y-_e.pe_t,_x+_e.pe_r,_y+_e.pe_b,Obj_parede,false,true) != noone;
}

// v5.34: animação de acordo com o deslocamento real, preservando a direção parado.
function s34_lagarto_animar(_e, _dx, _dy) {
    var _movendo = abs(_dx) + abs(_dy) > 0.01;
    if (_movendo) _e.lado_anim = floor((point_direction(0,0,_dx,_dy)+45)/90) mod 4;
    var _sprite = Spr_lagarto_parado_baixo;
    switch (_e.lado_anim) {
        case 0: _sprite = _movendo ? Spr_lagarto_andando_direita : Spr_lagarto_parado_direita; break;
        case 1: _sprite = _movendo ? Spr_lagarto_andando_cima : Spr_lagarto_parado_cima; break;
        case 2: _sprite = _movendo ? Spr_lagarto_andando_esquerda : Spr_lagarto_parado_esquerda; break;
        case 3: _sprite = _movendo ? Spr_lagarto_andando_baixo : Spr_lagarto_parado_baixo; break;
    }
    if (_e.sprite_index != _sprite) { _e.sprite_index = _sprite; _e.image_index = 0; }
    _e.image_speed = _movendo ? 1 : 0;
    if (!_movendo) _e.image_index = 0;
}
