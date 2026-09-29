/// v5.36: golpe anunciado, ácido com janela definida e saída sem teleporte.
speed = 0;
if (global.pause_aberto || global.config_aberta || global.cutscene_ativa
|| global.dialogo_ativo || global.diario_aberto || global.vitoria_ativa) {
    image_speed = 0;
    exit;
}
var passo = min(3, delta_time * 0.00006);
feedback_tempo = max(0, feedback_tempo - passo);
if (feedback_tempo <= 0) tomou_dano = false;
onda_tempo = max(0, onda_tempo - passo);
contato_espera = max(0, contato_espera - passo);
acido_recarga = max(0, acido_recarga - passo);
visible = (room == Room1);
if (!visible) exit;

if (vida <= 0 && !fugindo && !morto && !saida_impacto) {
    vida = 0;
    fugindo = true;
    derrotado = false;
    vulneravel_tempo = 0;
    ataque_ativo = false;
    alarm[0] = -1;
    fuga_etapa = 0;
    fuga_tempo = 0;
    rota_tempo = 0;
    feedback_tempo = 120;
    feedback_texto = "ELE ESTÁ ROMPENDO A CONTENÇÃO!";
}
if (fugindo) {
    fuga_tempo += passo;
    var fuga_antes_x = x;
    var fuga_antes_y = y;
    if (fuga_etapa == 0) {
        // Contorna os móveis e se alinha à passagem inferior.
        v536_boss_mover(id, 615, 500, 3.5 * passo, passo);
        if (point_distance(x, y, 615, 500) <= 8) {
            fuga_etapa = 1;
            fuga_preparo = 24;
        }
    } else if (fuga_etapa == 1) {
        fuga_preparo -= passo;
        if (fuga_preparo <= 0) fuga_etapa = 2;
    } else if (fuga_etapa == 2) {
        // A parte frontal dos pés alcança a pedra em y=628.
        v536_boss_deslocar(id, 615, 523, 4.5 * passo);
        if (point_distance(x, y, 615, 523) <= 7 && !saida_impacto) {
            saida_impacto = true;
            if (instance_exists(global.parede_saida)) instance_destroy(global.parede_saida);
            global.parede_saida = noone;
            v54_boss_concluir();
            fuga_etapa = 3;
            feedback_tempo = 70;
            feedback_texto = "PASSAGEM LIBERADA";
        }
    } else {
        // Atravessa a porta aberta antes de deixar de existir na arena.
        v536_boss_deslocar(id, 615, 608, 3.5 * passo);
        if (point_distance(x, y, 615, 608) <= 6) {
            instance_destroy();
            exit;
        }
    }
    v536_boss_animar(id, x-fuga_antes_x, y-fuga_antes_y, passo);
    exit;
}
if (morto) {
    // Defesa para instâncias legadas: a carcaça verdadeira fica no corredor.
    instance_destroy();
    exit;
}

// Uma poça só causa dano uma vez; o chefe não espera que ela evapore.
var acido = collision_rectangle(x-pe_l, y-pe_t, x+pe_r, y+pe_b, Obj_acido, false, true);
em_acido = (acido != noone);
if (!derrotado && acido_recarga <= 0 && em_acido && acido != acido_ultimo) {
    acido_ultimo = acido;
    vida = max(0, vida - 35);
    derrotado = true;
    vulneravel_tempo = 270; // 4,5 segundos de oportunidade para atacar.
    esperando_levantar = false;
    alarm[0] = -1;
    ataque_ativo = false;
    ataque_tempo = 0;
    contato_espera = 60;
    tomou_dano = true;
    feedback_tempo = 80;
    feedback_texto = "-35  CARAPAÇA ABERTA!";
}
if (derrotado) {
    vulneravel_tempo = max(0, vulneravel_tempo - passo);
    sprite_index = Spr_boos_caido;
    image_index = 0;
    image_speed = 0;
    if (vulneravel_tempo <= 0) {
        derrotado = false;
        acido_recarga = 120;
        contato_espera = 60;
        ataque_intervalo = 90;
        feedback_tempo = 60;
        feedback_texto = "ELE SE LEVANTOU - AFASTE-SE";
    }
    exit;
}
if (!instance_exists(Obj_jogador)) exit;
var jogador = instance_find(Obj_jogador, 0);
if (jogador.vida <= 0) { image_speed = 0; exit; }
ataque_intervalo = max(0, ataque_intervalo - passo);
if (!ataque_ativo && ataque_intervalo <= 0
&& point_distance(x, y+35, jogador.x, jogador.y) <= impacto_raio+25
&& collision_line(x, y, jogador.x, jogador.y, Obj_parede, false, true) == noone) {
    ataque_ativo = true;
    ataque_tempo = 0;
    impacto_aplicado = false;
    impacto_x = x;
    impacto_y = y + 35;
}
if (ataque_ativo) {
    ataque_tempo += passo;
    sprite_index = Spr_parado_baixo;
    image_speed = 0;
    image_index = 0;
    if (ataque_tempo < 18) ataque_quadro = 0;
    else if (ataque_tempo < 35) ataque_quadro = 1;
    else if (ataque_tempo < 54) ataque_quadro = 2;
    else if (ataque_tempo < 66) ataque_quadro = 3;
    else if (ataque_tempo < 82) ataque_quadro = 4;
    else ataque_quadro = 5;
    if (ataque_tempo >= 66 && !impacto_aplicado) {
        impacto_aplicado = true;
        bunker_impacto(impacto_x, impacto_y, impacto_raio);
        onda_tempo = 22;
    }
    if (ataque_tempo >= 106) {
        ataque_ativo = false;
        ataque_intervalo = 105;
        contato_espera = 35;
        image_index = 0;
    }
    exit;
}
var anterior_x = x;
var anterior_y = y;
v536_boss_mover(id, jogador.x, jogador.y, 1.65 * passo, passo);
v536_boss_animar(id, x-anterior_x, y-anterior_y, passo);
