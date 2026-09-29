/// V4.20: colisão contínua integrada à versão reenviada com carteira animada.
/// A máscara dos pés serve para andar, não para dano.
/// Retorna a primeira fração de contato [0,1], ou 2 quando não há contato.
function bunker_segmento_caixa(_x0, _y0, _x1, _y1, _l, _t, _r, _b) {
    var entrada = 0;
    var saida = 1;
    var dx = _x1 - _x0;
    var dy = _y1 - _y0;
    if (abs(dx) < 0.000001) {
        if (_x0 < _l || _x0 > _r) return 2;
    } else {
        var tx0 = (_l - _x0) / dx;
        var tx1 = (_r - _x0) / dx;
        entrada = max(entrada, min(tx0, tx1));
        saida = min(saida, max(tx0, tx1));
    }
    if (abs(dy) < 0.000001) {
        if (_y0 < _t || _y0 > _b) return 2;
    } else {
        var ty0 = (_t - _y0) / dy;
        var ty1 = (_b - _y0) / dy;
        entrada = max(entrada, min(ty0, ty1));
        saida = min(saida, max(ty0, ty1));
    }
    if (entrada > saida || saida < 0 || entrada > 1) return 2;
    return entrada;
}

function bunker_parede_configurar(_p, _w, _h) {
    _p.largura = max(1, round(_w));
    _p.altura = max(1, round(_h));
    _p.sprite_index = Spr_parede;
    _p.mask_index = Spr_parede;
    _p.image_angle = 0;
    _p.image_xscale = _p.largura / sprite_get_width(Spr_parede);
    _p.image_yscale = _p.altura / sprite_get_height(Spr_parede);
}

/// A mesma lista alimenta desenho e colisão dos props; nada nasce no Draw.
/// tipo: 0 caixa, 1 monitor, 2 tambor de cenário. w/h são o corpo visível.
function bunker_props_cenario(_sala) {
    if (_sala == Room_Externa) return [
        [0, 120, 530, 62, 48, false], [0, 1140, 520, 58, 52, false]];
    // A recepção usa apenas os móveis estáticos e colisores da própria Room.
    if (_sala == Room_Recepcao) return [];
    if (_sala == Room_Armadilha) return [];
    if (_sala == Room_Desmoronada) return []; // Colisões na Room; arte estática.
    if (_sala == Room_Corredor) return [];
    if (_sala == Room_Pesquisa) return [];
    if (_sala == Room_Biblioteca) return [];
    if (_sala == Room1) return [
        [1, 130, 100, 122, 48, true], [1, 1080, 120, 112, 46, true], [1, 1080, 510, 112, 46, false]];
    return [];
}

function bunker_varrer_paredes(_x0, _y0, _x1, _y1, _raio) {
    var resultado = {alvo: noone, t: 2, parede: true};
    for (var indice = 0; indice < instance_number(Obj_parede); indice++) {
        var p = instance_find(Obj_parede, indice);
        var contato = bunker_segmento_caixa(_x0, _y0, _x1, _y1,
            p.x - _raio, p.y - _raio, p.x + p.largura + _raio, p.y + p.altura + _raio);
        if (contato < resultado.t) {
            resultado.t = contato;
            resultado.alvo = p;
        }
    }
    return resultado;
}

function bunker_caixa_dano(_alvo) {
    var spr = _alvo.sprite_index;
    var origem_x = sprite_get_xoffset(spr);
    var origem_y = sprite_get_yoffset(spr);
    // O Draw do Boss ancora todos os sprites no centro original de 32x40.
    if (_alvo.object_index == Obj_boss) {
        origem_x = 16;
        origem_y = 20;
    }
    var x0 = (sprite_get_bbox_left(spr) - origem_x) * _alvo.image_xscale;
    var x1 = (sprite_get_bbox_right(spr) + 1 - origem_x) * _alvo.image_xscale;
    var y0 = (sprite_get_bbox_top(spr) - origem_y) * _alvo.image_yscale;
    var y1 = (sprite_get_bbox_bottom(spr) + 1 - origem_y) * _alvo.image_yscale;
    return {l: _alvo.x + min(x0, x1), r: _alvo.x + max(x0, x1),
        t: _alvo.y + min(y0, y1), b: _alvo.y + max(y0, y1)};
}

function bunker_alvo_atingivel(_alvo) {
    if (_alvo.object_index == Obj_caracol || _alvo.object_index == Obj_homem_lagarto || _alvo.object_index == Obj_caracol_lab) return !_alvo.morrendo && _alvo.vida > 0;
    if (_alvo.object_index == Obj_boss) return !_alvo.morto && !_alvo.fugindo && _alvo.vida > 0;
    if (_alvo.object_index == Obj_barril) return !_alvo.atingido;
    return false;
}

function bunker_varrer_impacto(_x0, _y0, _x1, _y1, _raio) {
    var resultado = bunker_varrer_paredes(_x0, _y0, _x1, _y1, _raio);
    var tipos = [Obj_caracol, Obj_homem_lagarto, Obj_caracol_lab, Obj_boss, Obj_barril];
    for (var tipo_indice = 0; tipo_indice < array_length(tipos); tipo_indice++) {
        for (var indice = 0; indice < instance_number(tipos[tipo_indice]); indice++) {
            var alvo = instance_find(tipos[tipo_indice], indice);
            if (!bunker_alvo_atingivel(alvo)) continue;
            var caixa = bunker_caixa_dano(alvo);
            var contato = bunker_segmento_caixa(_x0, _y0, _x1, _y1,
                caixa.l - _raio, caixa.t - _raio, caixa.r + _raio, caixa.b + _raio);
            // Parede vence o empate. A ordem de criação nunca escolhe o alvo.
            if (contato < resultado.t - 0.000001) {
                resultado.t = contato;
                resultado.alvo = alvo;
                resultado.parede = false;
            }
        }
    }
    return resultado;
}

function bunker_aplicar_impacto(_alvo, _dano) {
    if (!instance_exists(_alvo) || !bunker_alvo_atingivel(_alvo)) return;
    if (_alvo.object_index == Obj_barril) {
        bunker_derrubar_barril(_alvo);
        return;
    }
    if (_alvo.object_index == Obj_boss && !_alvo.derrotado) {
        _alvo.feedback_tempo = 34;
        _alvo.feedback_texto = "CARAPAÇA BLOQUEOU";
        return;
    }
    _alvo.vida = max(0, _alvo.vida - _dano);
    _alvo.tomou_dano = true;
    _alvo.feedback_tempo = 28;
    _alvo.feedback_texto = "-" + string(_dano);
    if (_alvo.object_index == Obj_caracol) {
        _alvo.alarm[0] = 5;
        // Um golpe letal nunca fica preso no estado de finalização.
        if (_alvo.vida <= 0) _alvo.takedown_ativo = false;
    }
}

function bunker_raio_projetil(_spr, _escala) {
    var w = (sprite_get_bbox_right(_spr) + 1 - sprite_get_bbox_left(_spr)) * abs(_escala);
    var h = (sprite_get_bbox_bottom(_spr) + 1 - sprite_get_bbox_top(_spr)) * abs(_escala);
    // Envolve o sprite inteiro em qualquer ângulo, inclusive durante o giro.
    return ceil(sqrt(w * w + h * h) * 0.5);
}

function bunker_lancar_projetil(_tipo, _dono, _destino_x, _destino_y, _direcao, _raio) {
    var inicio_x = _dono.x;
    var inicio_y = _dono.y;
    var livre = bunker_varrer_paredes(inicio_x, inicio_y, inicio_x, inicio_y, _raio).t > 1;
    // Encostado num canto: procura só uma origem próxima e visível. Não
    // teleporta para o outro lado da parede; se não couber, conserva o item.
    for (var tentativa = 0; tentativa < 48 && !livre; tentativa++) {
        var distancia = 4 + floor(tentativa / 8) * 4;
        var angulo = (tentativa - floor(tentativa / 8) * 8) * 45;
        var cx = _dono.x + lengthdir_x(distancia, angulo);
        var cy = _dono.y + lengthdir_y(distancia, angulo);
        if (bunker_varrer_paredes(_dono.x, _dono.y, cx, cy, 0).t > 1
        && bunker_varrer_paredes(cx, cy, cx, cy, _raio).t > 1) {
            inicio_x = cx;
            inicio_y = cy;
            livre = true;
        }
    }
    if (!livre) return noone;
    var proj = instance_create_layer(inicio_x, inicio_y, "Instances", _tipo);
    proj.direction = _direcao;
    proj.image_angle = _direcao;
    proj.raio_colisao = _raio;
    proj.inicial_pendente = true;
    proj.inicial_x = _destino_x;
    proj.inicial_y = _destino_y;
    return proj;
}

function bunker_projetil_mover(_proj, _destino_x, _destino_y) {
    if (!_proj.em_voo || _proj.impacto_registrado) return false;
    var impacto = bunker_varrer_impacto(_proj.x, _proj.y, _destino_x, _destino_y, _proj.raio_colisao);
    var distancia = point_distance(_proj.x, _proj.y, _destino_x, _destino_y);
    var fracao = impacto.t <= 1 ? max(0, impacto.t - 0.25 / max(0.25, distancia)) : 1;
    _proj.x = lerp(_proj.x, _destino_x, fracao);
    _proj.y = lerp(_proj.y, _destino_y, fracao);
    if (impacto.t > 1) return true;
    _proj.impacto_registrado = true;
    _proj.em_voo = false;
    _proj.velocidade = 0;
    _proj.speed = 0;
    if (!impacto.parede) bunker_aplicar_impacto(impacto.alvo, _proj.dano);
    if (_proj.object_index != Obj_canoAremesado) instance_destroy(_proj);
    return false;
}

function bunker_projetil_passo(_proj) {
    if (!_proj.em_voo) return;
    // Inclui o trajeto pés -> mão -> boca da arma, impedindo nascer além do
    // obstáculo ou pular um inimigo muito próximo do jogador.
    if (_proj.inicial_pendente) {
        _proj.inicial_pendente = false;
        if (!bunker_projetil_mover(_proj, _proj.inicial_x, _proj.inicial_y)) return;
    }
    if (!bunker_projetil_mover(_proj,
        _proj.x + lengthdir_x(_proj.velocidade, _proj.direction),
        _proj.y + lengthdir_y(_proj.velocidade, _proj.direction))) return;
    _proj.image_angle += _proj.rotacao_velocidade;
}

function bunker_projetil_desenhar(_proj) {
    var spr = _proj.sprite_index;
    var centro_x = (sprite_get_bbox_left(spr) + sprite_get_bbox_right(spr) + 1) * 0.5;
    var centro_y = (sprite_get_bbox_top(spr) + sprite_get_bbox_bottom(spr) + 1) * 0.5;
    var dx = (sprite_get_xoffset(spr) - centro_x) * _proj.image_xscale;
    var dy = (sprite_get_yoffset(spr) - centro_y) * _proj.image_yscale;
    var ang = _proj.image_angle;
    draw_sprite_ext(spr, _proj.image_index,
        _proj.x + lengthdir_x(dx, ang) - lengthdir_y(dy, ang),
        _proj.y + lengthdir_y(dx, ang) + lengthdir_x(dy, ang),
        _proj.image_xscale, _proj.image_yscale, ang, c_white, 1);
}
