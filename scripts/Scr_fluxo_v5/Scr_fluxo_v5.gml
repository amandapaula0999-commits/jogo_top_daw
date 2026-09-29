/// Progressão: salas independentes, checkpoints, dutos e chaves.
/// DEBUG / TESTE: ciclo sequencial de salas pela tecla P.
/// Não usa room_next para que a ordem permaneça estável mesmo se o Room Order
/// do projeto mudar. Retorna true quando agenda uma troca de Room.
function v5_debug_avancar_room() {
    var _destino = Room_Externa;
    var _spawn_x = 683;
    var _spawn_y = 500;

    switch (room) {
        // 1. Fachada -> 2. Dentro da Estrutura
        case Room_Externa:
            _destino = Room_Recepcao;
            _spawn_x = 320; _spawn_y = 326;
        break;

        // 2. Dentro da Estrutura -> 3. Sala da Explosão
        case Room_Recepcao:
            _destino = Room_Armadilha;
            _spawn_x = 256; _spawn_y = 250;
        break;

        // 3. Sala da Explosão -> 4. Sala após a queda/saída
        case Room_Armadilha:
            _destino = Room_Desmoronada;
            _spawn_x = 105; _spawn_y = 180;
        break;

        // 4. Sala demolida -> 5. Corredor da Fase 1
        case Room_Desmoronada:
            _destino = Room_Corredor;
            _spawn_x = 106; _spawn_y = 250;
        break;

        // 5. Corredor Fase 1 -> 6. Corredor Fase 2 pós-escadaria
        case Room_Corredor:
            _destino = Room_Corredor_N2;
            _spawn_x = 1030; _spawn_y = 186;
        break;

        // 6. Corredor Fase 2 -> 7. Nova sala de manutenção
        case Room_Corredor_N2:
            _destino = Room_Manutencao_N2;
            _spawn_x = 92; _spawn_y = 88;
        break;

        // 7. Manutenção -> 8. Sala dos Funcionários
        case Room_Manutencao_N2:
            _destino = Room_Funcionarios;
            _spawn_x = 90; _spawn_y = 310;
        break;

        // Salas da fase 2 permanecem disponíveis pelo atalho de teste.
        case Room_Funcionarios:
            _destino = Room_Ferramentas_N2;
            _spawn_x = 256; _spawn_y = 274;
        break;
        case Room_Ferramentas_N2:
            _destino = Room_Laboratorio_N2;
            _spawn_x = 320; _spawn_y = 344;
        break;
        case Room_Laboratorio_N2:
            _destino = Room_Externa;
            _spawn_x = 683; _spawn_y = 500;
        break;
        // P também funciona durante os créditos, que permanecem nesta Room.
        case Room_Corredor_Pos:
            _destino = Room_Corredor_N2;
            _spawn_x = 1030; _spawn_y = 186;
        break;
        case Room1:
            _destino = Room_Corredor_Pos;
            _spawn_x = 550; _spawn_y = 190;
        break;

        // Se o teste for acionado em uma Room que não faz parte da lista,
        // entra no ciclo pela Fachada.
        default:
            _destino = Room_Externa;
            _spawn_x = 683; _spawn_y = 500;
        break;
    }

    // O atalho é de navegação de teste: cancela estados temporários que
    // poderiam bloquear input/câmera na Room seguinte, sem apagar inventário,
    // vida, chaves, evidências ou demais globals persistentes do progresso.
    global.pause_aberto = false;
    global.diario_aberto = false;
    if (variable_global_exists("config_aberta")) global.config_aberta = false;
    global.dialogo_ativo = false;
    global.cutscene_ativa = false;
    if (variable_global_exists("vitoria_ativa")) global.vitoria_ativa = false;
    if (variable_global_exists("demo_creditos")) global.demo_creditos = false;
    global.vitoria_tempo = 0;
    global.creditos_scroll = 0;
    global.camera_zoom = 1;
    if (variable_global_exists("v5_duto_ativo")) global.v5_duto_ativo = false;
    if (variable_global_exists("v5_queda_pendente")) global.v5_queda_pendente = false;
    if (variable_global_exists("v5_checkpoint_transicao_pendente")) global.v5_checkpoint_transicao_pendente = false;

    // Salva estado imediato do jogador antes da troca para o sistema de
    // inventário/vida persistente continuar idêntico ao fluxo normal.
    var _j = instance_nearest(0, 0, Obj_jogador);
    if (_j != noone) {
        global.vida_jogador = _j.vida;
        global.caixas_mecanicas = _j.caixas_mecanicas;
    }

    instance_activate_all();
    audio_resume_all();
    global.spawn_room = _destino;
    global.spawn_x = _spawn_x;
    global.spawn_y = _spawn_y;
    room_goto(_destino);
    return true;
}

function v5_checkpoint_gravar(_sala,_x,_y) {
    global.v5_checkpoint_room=_sala;
    global.v5_checkpoint_x=_x;
    global.v5_checkpoint_y=_y;
    ini_open("checkpoint_v5.ini");
    ini_write_string("checkpoint","sala",room_get_name(_sala));
    ini_write_real("checkpoint","x",_x);
    ini_write_real("checkpoint","y",_y);
    ini_close();
}
function v5_reiniciar_checkpoint() {
    global.pause_aberto=false;global.diario_aberto=false;
    global.dialogo_ativo=false;global.cutscene_ativa=false;global.v5_duto_ativo=false;
    global.vida_jogador=100;
    global.v5_respawn_pendente=true;
    instance_activate_all();audio_resume_all();
    if(variable_global_exists("v5_checkpoint_room") && global.v5_checkpoint_room!=-1) {
        global.spawn_room=global.v5_checkpoint_room;
        global.spawn_x=global.v5_checkpoint_x;global.spawn_y=global.v5_checkpoint_y;
        if(room==global.v5_checkpoint_room) room_restart();
        else room_goto(global.v5_checkpoint_room);
    } else { global.spawn_room=-1;room_restart(); }
}
function v5_passagem_atualizar(_p) {
    if (variable_instance_exists(_p,"ativa") && !_p.ativa) return;
    if(global.pause_aberto || global.diario_aberto || global.config_aberta) return;
    if(_p.mensagem_tempo>0) _p.mensagem_tempo--;
    if(_p.tempo_duto>0) {
        _p.tempo_duto=max(0,_p.tempo_duto-min(delta_time/1000000,0.05));
        if(_p.tempo_duto<=0) room_goto(_p.destino);
        return;
    }
    if(global.cutscene_ativa || global.dialogo_ativo) return;
    var _j=instance_nearest(_p.x,_p.y,Obj_jogador);
    if(_j==noone || _j.vida<=0) return;
    var _fim_demo = global.demo_fim_na_escadaria && room == Room_Corredor_Pos
        && _p.tipo_passagem == "escada" && _p.destino == Room_Corredor_N2;
    var _chegou = _fim_demo && point_distance(_p.x,_p.y,_j.x,_j.y)<=64;
    var _usar = keyboard_check_pressed(ord("E"));
    if (!_usar && !_chegou) return;
    // Uma escada ainda trancada não repete o aviso/som a cada Step.
    if (!_usar && !v53_porta_liberada(_p)) return;
    if (variable_instance_exists(_p,"usar_area_interacao") && _p.usar_area_interacao) {
        if (!bunker_porta_em_alcance(_p,_j)) return;
    } else if (point_distance(_p.x,_p.y,_j.x,_j.y)>82) return;
    if(_p.tipo_passagem=="elevador") {
        _p.mensagem_tempo=210;
        return;
    }
    // Passagens especiais também respeitam as chaves/restrições da progressão.
    if(variable_instance_exists(_p,"chave_exigida") && _p.chave_exigida!="" && !v53_porta_liberada(_p)) {
        _p.mensagem_tempo=180;
        _p.mensagem_bloqueio=_p.chave_exigida=="cientista" ? "PRECISO DA CHAVE DO CIENTISTA" : (global.v53_chave_escada ? "PRECISO LIBERAR A SAÍDA DA ARENA" : "PRECISO DA CHAVE DA SALA DO BOSS");
        bunker_audio_tocar_efeito(Snd_luz_negada,15,false);
        return;
    }
    global.vida_jogador=_j.vida;
    global.caixas_mecanicas=_j.caixas_mecanicas;
    if (_fim_demo) {
        // Não agenda troca de Room nem checkpoint para a fase seguinte.
        global.spawn_room=-1;
        global.v5_duto_ativo=false;
        global.v5_checkpoint_transicao_pendente=false;
        _p.tempo_duto=0;
        bunker_audio_tocar_efeito(Snd_porta,12,false);
        bunker_vitoria_iniciar(_p.x,_p.y);
        return;
    }
    global.spawn_room=_p.destino;global.spawn_x=_p.spawn_x;global.spawn_y=_p.spawn_y;
    // A chegada pela escada passa a ser o novo respawn. O restante do estado
    // (inventário, chefe, chaves, evidências e coletas) já vive em globals e
    // portanto não é reiniciado durante a troca de room.
    if(_p.tipo_passagem=="escada") global.v5_checkpoint_transicao_pendente=true;
    global.v5_duto_ativo=true;global.cutscene_ativa=true;
    _p.tempo_duto=(_p.tipo_passagem=="escada") ? 0.42 : 1.1;
    bunker_audio_tocar_efeito(Snd_porta,12,false);
}
function v5_passagem_desenhar(_p) {
    draw_set_alpha(1);
    // No nível 2, o acesso à escadaria é um sprite colocado na Room.
    if (!_p.visual_estatico) {
    if(_p.tipo_passagem=="duto") {
        draw_set_color(make_color_rgb(22,28,26));draw_rectangle(_p.x-40,_p.y-28,_p.x+40,_p.y+28,false);
        draw_set_color(make_color_rgb(76,85,76));draw_rectangle(_p.x-37,_p.y-25,_p.x+37,_p.y+25,true);
        for(var _i=-30;_i<=30;_i+=10) {
            draw_set_color(make_color_rgb(98,107,93));draw_rectangle(_p.x+_i,_p.y-20,_p.x+_i+3,_p.y+20,false);
        }
    } else if(_p.tipo_passagem=="escada") {
        // Escadaria industrial no fim direito do corredor. A geometria é
        // puramente visual: a área de circulação em frente aos degraus fica livre.
        draw_set_color(make_color_rgb(24,27,25));draw_rectangle(_p.x-70,_p.y-114,_p.x+70,_p.y+116,false);
        draw_set_color(make_color_rgb(47,50,45));draw_rectangle(_p.x-62,_p.y-106,_p.x+62,_p.y+108,true);
        for(var _degrau=0;_degrau<9;_degrau++) {
            var _dy=_p.y-104+_degrau*23;
            draw_set_color(make_color_rgb(110,104,85));draw_rectangle(_p.x-50,_dy,_p.x+58,_dy+6,false);
            draw_set_color(make_color_rgb(42,44,39));draw_rectangle(_p.x-50,_dy+7,_p.x+58,_dy+21,false);
        }
        draw_set_color(make_color_rgb(128,120,92));
        draw_line_width(_p.x-58,_p.y-104,_p.x-58,_p.y+106,4);
        draw_line_width(_p.x+64,_p.y-104,_p.x+64,_p.y+106,4);
    } else {
        draw_set_color(make_color_rgb(21,26,24));draw_rectangle(_p.x-65,_p.y-52,_p.x+65,_p.y+54,false);
        draw_set_color(make_color_rgb(77,83,73));draw_rectangle(_p.x-58,_p.y-46,_p.x+58,_p.y+46,false);
        draw_set_color(make_color_rgb(37,45,41));draw_rectangle(_p.x-52,_p.y-40,_p.x+52,_p.y+42,false);
        draw_set_color(make_color_rgb(94,100,89));draw_rectangle(_p.x-1,_p.y-40,_p.x+1,_p.y+42,false);
        draw_set_color(make_color_rgb(159,66,43));draw_rectangle(_p.x+60,_p.y-15,_p.x+68,_p.y+4,false);
    }
    }
    if (room == Room_Corredor_Pos) {
        bunker_porta_rotulo_desenhar(_p);
        if (_p.mensagem_tempo > 0 && !global.pause_aberto && !global.diario_aberto
            && !global.config_aberta && !global.cutscene_ativa && !global.dialogo_ativo) {
            draw_set_font(Font_de_fala);draw_set_halign(fa_left);draw_set_color(c_white);
            draw_text_ext_transformed(472,232,_p.mensagem_bloqueio,20,290,0.65,0.65,0);
        }
        draw_set_font(-1);draw_set_halign(fa_left);draw_set_valign(fa_top);draw_set_color(c_white);
        return;
    }
    // O acesso à escada usa o mesmo nome branco das demais portas.
    if (bunker_interface_fase2()) {
        bunker_porta_rotulo_desenhar(_p);
        draw_set_font(-1);draw_set_halign(fa_left);draw_set_color(c_white);
        return;
    }
    var _j=instance_nearest(_p.x,_p.y,Obj_jogador);
    draw_set_font(Font_de_fala);draw_set_halign(fa_center);
    draw_set_color(make_color_rgb(224,208,162));
    var _texto_y=(_p.tipo_passagem=="escada") ? _p.y-140 : _p.y-65;
    if (room == Room_Corredor_N2) _texto_y = max(12, _p.y-62);
    if(_j!=noone && point_distance(_p.x,_p.y,_j.x,_j.y)<=82 && !global.cutscene_ativa && !global.pause_aberto && !global.diario_aberto && !global.config_aberta) {
        if (room == Room_Corredor_N2) draw_text_transformed(_p.x,_texto_y,"[E] SUBIR ESCADARIA",0.65,0.65,0);
        else draw_text(clamp(_p.x,280,room_width-280),_texto_y,"[E] "+_p.rotulo);
    }
    if(_p.mensagem_tempo>0) {
        var _msg=(_p.tipo_passagem=="elevador") ? "ELEVADOR QUEBRADO. NÃO HÁ ENERGIA." : _p.mensagem_bloqueio;
        draw_text(clamp(_p.x,280,room_width-280),_p.y+135,_msg);
    }
    draw_set_font(-1);draw_set_halign(fa_left);draw_set_color(c_white);
}

// Desenho em cache; a colisão ocupa integralmente o mesmo retângulo.
function v5_entulho_desenhar() {
    v54_pilha_desenhar(1120,32,214,704);
}

function v53_porta_liberada(_p) {
    if (variable_instance_exists(_p,"chave_exigida")) {
        if (_p.chave_exigida == "laboratorio") return global.inventario_cartao_acesso;
    }
    // Sala 10 exige sua chave mesmo no modo de teste com portas livres.
    if(variable_instance_exists(_p,"chave_exigida") && _p.chave_exigida=="ferramentas") return global.chave_sala_ferramentas;
    // Gancho de progressão para a futura porta da sala fria.
    if(variable_instance_exists(_p,"chave_exigida") && _p.chave_exigida=="pe_cabra") return global.inventario_pe_cabra;
    // Em builds de teste, ignora chaves, boss e demais travas de progressao.
    if(variable_global_exists("modo_teste_portas_livres") && global.modo_teste_portas_livres) return true;
    if(!variable_instance_exists(_p,"chave_exigida")) return true;
    if(_p.chave_exigida=="cientista") return global.v53_chave_cientista;
    if(_p.chave_exigida=="escadaria") return global.v53_chave_escada && global.boss_derrotado;
    return true;
}
function v53_arquivo_liberado() {
    if(global.v53_arquivo_livre) return true;
    for(var i=0;i<instance_number(Obj_caracol);i++) {
        var inimigo=instance_find(Obj_caracol,i);
        if(variable_instance_exists(inimigo,"guarda_arquivo") && inimigo.guarda_arquivo && inimigo.vida>0) return false;
    }
    if(room==Room_Biblioteca) {global.v53_arquivo_livre=true;return true;}
    return false;
}
function v53_chave_boss_criar() {
    if(!global.v53_chave_escada && !instance_exists(Obj_chave_escadaria))
        instance_create_depth(266,153,0,Obj_chave_escadaria);
}

// v5.4: a chave inicia a cena. Reentrar após morrer reinicia a luta pendente.
function v54_boss_iniciar() {
    if(room!=Room1 || global.boss_derrotado || instance_exists(Obj_boss)) return;
    global.v54_boss=instance_create_depth(615,324,0,Obj_boss);
    global.v54_cena=1;global.v54_tempo=0;
    global.cutscene_ativa=true;global.camera_zoom=1;
    var _j = instance_find(Obj_jogador,0);
    global.v535_inicio_x = instance_exists(_j) ? _j.x : 615;
    global.v535_inicio_y = instance_exists(_j) ? _j.y : 324;
    global.camera_foco_x=global.v535_inicio_x;
    global.camera_foco_y=global.v535_inicio_y;
    global.saida_aberta=false;
    // Fecha logicamente já na coleta; os escombros chegam durante a cena.
    if(instance_exists(global.v54_porta) && !(variable_global_exists("modo_teste_portas_livres") && global.modo_teste_portas_livres)) global.v54_porta.ativa=false;
}
function v54_boss_concluir() {
    global.boss_derrotado=true;global.saida_aberta=true;
    global.v54_cena=0;global.cutscene_ativa=false;global.camera_zoom=1;
    if(instance_exists(global.v54_porta)) global.v54_porta.ativa=true;
    global.cenario_reconstruir=true;
    bunker_audio_tocar_efeito(Snd_impacto_boss,30,false);
}
function v54_atualizar() {
    if(global.pause_aberto || global.diario_aberto || global.config_aberta) return;
    global.v54_entulho_perto=false;
    if(global.v54_entulho_tempo>0) global.v54_entulho_tempo--;
    if(global.v54_cena>0) {
        global.v54_tempo++;
        var t=global.v54_tempo;
        var b=global.v54_boss;
        if(instance_exists(b)) {
            var golpe = max(0,t-40);
            b.ataque_ativo=t>=40 && golpe<106;b.ataque_tempo=min(golpe,106);
            b.impacto_x=b.x;b.impacto_y=b.y+35;
            b.sprite_index=Spr_parado_baixo;b.image_speed=0;b.image_index=0;
            if(t==106) {b.onda_tempo=22;bunker_audio_tocar_efeito(Snd_impacto_boss,30,false);}
            if(t>106) b.onda_tempo=max(0,22-(t-106));
        }
        // Aproximação, golpe completo, porta trancada e retorno ao jogador.
        var _u=clamp(t/40,0,1); _u=_u*_u*(3-2*_u);
        global.camera_foco_x=lerp(global.v535_inicio_x,615,_u);
        global.camera_foco_y=lerp(global.v535_inicio_y,324,_u);
        global.camera_zoom=lerp(1,1.6,_u);
        if(t>146) {
            _u=clamp((t-146)/36,0,1); _u=_u*_u*(3-2*_u);
            global.camera_foco_y=lerp(324,577,_u);
        }
        if(t>224) {
            var _j=instance_find(Obj_jogador,0);
            _u=clamp((t-224)/40,0,1); _u=_u*_u*(3-2*_u);
            if(instance_exists(_j)) {
                global.camera_foco_x=lerp(615,_j.x,_u);
                global.camera_foco_y=lerp(577,_j.y,_u);
            }
            global.camera_zoom=lerp(1.6,1,_u);
        }
        if(t==192 && !instance_exists(global.parede_saida)) {
            global.parede_saida=instance_create_depth(561,566,200,Obj_parede);
            bunker_parede_configurar(global.parede_saida,108,83);
            global.parede_saida.tipo=9;
            if(instance_exists(global.v54_porta)) global.v54_porta.ativa=false;
            bunker_audio_tocar_efeito(Snd_impacto_boss,28,false);
        }
        if(t>=264) {
            global.v54_cena=0;global.cutscene_ativa=false;global.camera_zoom=1;
            if(instance_exists(b)) {b.ataque_ativo=false;b.ataque_intervalo=100;b.onda_tempo=0;}
        }
        return;
    }
    if(global.cutscene_ativa || global.dialogo_ativo || global.vitoria_ativa) return;
    var j=instance_nearest(0,0,Obj_jogador);
    if(j==noone) return;
    if(room==Room_Corredor) global.v54_entulho_perto=(j.x>=1020 && j.x<1120 && j.y>40 && j.y<728);
    if(room==Room_Corredor_Pos) global.v54_entulho_perto=(j.x>104 && j.x<=162 && j.y>80 && j.y<322);
    if(global.v54_entulho_perto && keyboard_check_pressed(ord("E"))) global.v54_entulho_tempo=420;
}

// Pedras em degraus de 2 px, com facetas e tamanhos alternados; sem textura borrada.
// Os limites visuais são exatamente os do sólido, inclusive nas bordas da room.
function v54_pilha_desenhar(_x,_y,_w,_h) {
    draw_set_alpha(1);
    draw_set_color(make_color_rgb(39,40,36));draw_rectangle(_x,_y,_x+_w,_y+_h,false);
    for(var row=0;row<ceil(_h/30);row++) {
        var yy=_y+row*30;
        var xx=_x;
        var col=0;
        while(xx<_x+_w) {
            var seed=(row*17+col*11) mod 13;
            var ww=min(22+2*(seed mod 10),_x+_w-xx);
            var hh=min(28+2*(seed mod 3),_y+_h-yy);
            var shade=58+seed*2;
            // Silhueta octogonal desenhada por faixas na mesma grade de pixels.
            for(var sy=0;sy<hh;sy+=2) {
                var edge=(sy<6 || sy>hh-8)?6:((sy<10 || sy>hh-12)?2:0);
                if(ww>edge*2) {
                    draw_set_color(make_color_rgb(shade,shade+1,shade-7));
                    draw_rectangle(xx+edge,yy+sy,xx+ww-edge-1,yy+min(sy+2,hh),false);
                }
            }
            draw_set_color(make_color_rgb(shade+26,shade+25,shade+14));
            if(ww>14) draw_rectangle(xx+6,yy+4,xx+ww-7,yy+6,false);
            draw_set_color(make_color_rgb(shade-19,shade-18,shade-20));
            if(ww>18 && hh>20) {
                var crack=xx+floor(ww/4)*2;
                draw_rectangle(crack,yy+10,crack+2,yy+16,false);
                draw_rectangle(crack+2,yy+16,crack+6,yy+18,false);
                draw_rectangle(crack+6,yy+18,crack+8,yy+hh-4,false);
            }
            xx+=ww;col++;
        }
    }
    draw_set_color(c_white);
}
function v54_bloqueio_desenhar() {
    if(room==Room1 && instance_exists(global.parede_saida)) v54_pilha_desenhar(561,566,108,83);
    if(room==Room1 && global.v54_cena>0 && global.v54_tempo>=102 && global.v54_tempo<116) {
        var queda=(global.v54_tempo-102)*8;
        v54_pilha_desenhar(561,465+queda,108,83);
    }
}
function v54_dinamico_desenhar() {
    // v5.36: Obj_boss_morto está colocado na room, com sprite próprio.
}
function v54_entulho_gui() {
    if(global.pause_aberto || global.diario_aberto || global.config_aberta || global.cutscene_ativa || global.vitoria_ativa) return;
    if(!global.v54_entulho_perto && global.v54_entulho_tempo<=0) return;
    var texto="[E] EXAMINAR ESCOMBROS";
    if(global.v54_entulho_tempo>0) texto="O terremoto que me fez cair aqui também fez esta parte ser obstruída. Bloqueia minha passagem, devo achar outra forma de continuar.";
    bunker_aviso_gui(texto, "");
}

/// Fase 2: a mesma caixa da recepcionista, sem painéis rasterizados sobrepostos.
function bunker_interface_fase2() {
    return room == Room_Corredor_N2 || room == Room_Funcionarios
        || room == Room_Manutencao_N2 || room == Room_Ferramentas_N2
        || room == Room_Laboratorio_N2;
}

function bunker_fase2_mensagem(_texto, _comando) {
    return {texto: _texto, comando: _comando};
}

function bunker_fase2_ferramentas_texto(_frame, _perto) {
    switch (_frame) {
        case 0: return bunker_fase2_mensagem("Ferramentas comuns, bancadas e prateleiras. À primeira vista, nada de especial.", "");
        case 1: return bunker_fase2_mensagem("Espere... tem um pé de cabra pendurado na parede. Vou dar uma olhada.", "");
        case 2: return bunker_fase2_mensagem("Há um pé de cabra pendurado na parede.", "[E] EXAMINAR PÉ DE CABRA");
        case 3: return bunker_fase2_mensagem("Um pé de cabra. Pode ser útil para abrir passagens emperradas.", _perto == "suporte" ? "[E] COLETAR" : "APROXIME-SE DO PÉ DE CABRA PARA COLETAR");
        case 4: return bunker_fase2_mensagem("Pé de cabra adicionado ao inventário. Vou guardá-lo para abrir passagens emperradas.", "");
        case 5: return bunker_fase2_mensagem("O suporte está vazio. Já guardei o pé de cabra.", "");
        case 6: return bunker_fase2_mensagem("Bancada de manutenção.", "[E] EXAMINAR BANCADA");
        case 7: return bunker_fase2_mensagem("Uma bancada com ferramentas de manutenção.", "");
        case 8: return bunker_fase2_mensagem("Prateleiras da sala de ferramentas.", "[E] EXAMINAR PRATELEIRAS");
        case 9: return bunker_fase2_mensagem("Caixas e ferramentas organizadas nas prateleiras.", "");
    }
    return bunker_fase2_mensagem("", "");
}

function bunker_fase2_conteudo(_m) {
    if (room == Room_Manutencao_N2) {
        var _fria = instance_find(Obj_porta_manutencao, 0);
        if (_fria != noone && !global.pause_aberto && !global.diario_aberto && !global.config_aberta) {
            if (_fria.fala_etapa > 0) return bunker_fase2_mensagem(_fria.fala_texto, _fria.fala_espera > 0 ? "" : "ESPAÇO: CONTINUAR");
            if (_fria.esforco > 0) return bunker_fase2_mensagem("A porta está emperrada...", "SEGURE E: " + string(ceil(max(0, 3 - _fria.esforco))) + " s");
        }
    }
    if (room == Room_Laboratorio_N2) return lab11_conteudo(_m);
    if (!bunker_interface_fase2() || global.pause_aberto || global.config_aberta
        || global.diario_aberto || global.cutscene_ativa || global.dialogo_ativo
        || global.vitoria_ativa) return bunker_fase2_mensagem("", "");

    var _j = instance_find(Obj_jogador, 0);
    if (_j == noone) return bunker_fase2_mensagem("", "");

    // Só uma caixa por frame. A porta próxima tem prioridade sobre avisos
    // temporários, para a saída nunca ficar escondida atrás de uma narração.
    var _porta = noone;
    var _distancia = 1000000;
    for (var _i = 0; _i < instance_number(Obj_porta); _i++) {
        var _p = instance_find(Obj_porta, _i);
        if (!_p.ativa || _p.abrindo || !bunker_porta_em_alcance(_p, _j)) continue;
        var _d = point_distance(_p.x, _p.y, _j.x, _j.y);
        if (_d < _distancia) { _porta = _p; _distancia = _d; }
    }
    if (_porta != noone) {
        if (_porta.mensagem_tempo > 0) return bunker_fase2_mensagem(_porta.mensagem_bloqueio, "");
        return bunker_fase2_mensagem(_porta.rotulo, "[E] " + _porta.rotulo);
    }

    if (room == Room_Funcionarios) {
        if (_m.func_mensagem_tempo > 0) {
            switch (_m.func_feedback_frame) {
                case 4: return bunker_fase2_mensagem("Café quente: vida recuperada.", "");
                case 5: return bunker_fase2_mensagem("Já estou com a vida cheia.", "");
                case 6: return bunker_fase2_mensagem("Chave da sala de ferramentas adicionada ao inventário.", "");
                case 7: return bunker_fase2_mensagem("A caixinha está vazia. A chave já está comigo.", "");
                case 8: return bunker_fase2_mensagem("Dormitório trancado. Não tenho a chave desta porta.", "");
            }
        }
        switch (_m.func_interacao_proxima) {
            case "cafe": return bunker_fase2_mensagem("Cafeteira da sala de descanso.", "[E] TOMAR CAFÉ");
            case "chaves": return bunker_fase2_mensagem("Caixinha de chaves na parede.", "[E] EXAMINAR CHAVES");
            case "dormitorio": return bunker_fase2_mensagem("Porta do dormitório.", "[E] EXAMINAR PORTA");
        }
    }

    if (room == Room_Ferramentas_N2) {
        if (_m.s10_tempo > 0) return bunker_fase2_ferramentas_texto(_m.s10_frame, _m.s10_perto);
        switch (_m.s10_perto) {
            case "suporte": return bunker_fase2_ferramentas_texto(global.inventario_pe_cabra ? 5 : (_m.s10_examinada ? 3 : 2), _m.s10_perto);
            case "bancada": return bunker_fase2_ferramentas_texto(6, _m.s10_perto);
            case "prateleira": return bunker_fase2_ferramentas_texto(8, _m.s10_perto);
        }
    } else if (_m.tempo_apresentacao > 0) {
        return bunker_fase2_mensagem(_m.nome_area, _m.objetivo_area);
    }
    return bunker_fase2_mensagem("", "");
}

function bunker_fase2_gui(_m) {
    var _caixa = bunker_fase2_conteudo(_m);
    var _gw = display_get_gui_width();
    var _gh = display_get_gui_height();
    gpu_set_blendmode(bm_normal);
    // Avisos compactos no topo: portas inferiores sempre ficam visíveis.
    // Só a indicação da porta sai da GUI. Bloqueios e falas continuam legíveis.
    var _rotulo_porta = false;
    for (var _i = 0; _i < instance_number(Obj_porta); _i++) {
        var _porta = instance_find(Obj_porta, _i);
        if (_caixa.comando == "[E] " + _porta.rotulo) _rotulo_porta = true;
    }
    if (room == Room_Manutencao_N2 && _caixa.texto == "Porta da sala de manutenção.")
        _rotulo_porta = true;
    if (!_rotulo_porta) bunker_aviso_gui(_caixa.texto, _caixa.comando);
    if (_m.fade_entrada > 0) {
        draw_set_alpha(_m.fade_entrada);
        draw_set_color(c_black);
        draw_rectangle(0, 0, _gw, _gh, false);
    }
    draw_set_alpha(1);
    draw_set_color(c_white);
    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}

/// SALA 10 / v5.18: pé de cabra pendurado e disponível desde a primeira entrada.
function sala10_entrar(_m) {
    _m.s10_tempo=180;_m.s10_frame=0;_m.s10_examinada=false;
    _m.s10_perto="";_m.s10_input=12;
    _m.s10_observar=!global.inventario_pe_cabra;
    sala10_sprites_atualizar();
}
function sala10_sprites_atualizar() {
    var suporte=instance_find(Obj_sala10_suporte,0);
    if(suporte!=noone) {suporte.image_speed=0;suporte.image_index=0;}
    var pe=instance_find(Obj_sala10_pe_cabra,0);
    if(pe!=noone) {pe.image_speed=0;pe.visible=!global.inventario_pe_cabra;}
}
function sala10_step(_m) {
    if(global.pause_aberto || global.config_aberta || global.diario_aberto || global.cutscene_ativa || global.dialogo_ativo) return;
    if(_m.s10_input>0) _m.s10_input--;
    if(_m.s10_tempo>0) _m.s10_tempo--;
    // Primeira impressão comum; depois, o protagonista percebe a ferramenta na parede.
    if(_m.s10_tempo<=0 && _m.s10_observar) {
        _m.s10_observar=false;_m.s10_frame=1;_m.s10_tempo=210;
    }
    _m.s10_perto="";
    var j=instance_find(Obj_jogador,0);
    if(j!=noone) {
        if(point_distance(j.x,j.y,290,115)<=28) _m.s10_perto="suporte";
        else if(point_distance(j.x,j.y,115,269)<=26) _m.s10_perto="bancada";
        else if(point_distance(j.x,j.y,421,144)<=26) _m.s10_perto="prateleira";
        if(_m.s10_input<=0 && keyboard_check_pressed(ord("E")) && _m.s10_perto!="") {
            _m.s10_observar=false;
            if(_m.s10_perto=="suporte") {
                if(global.inventario_pe_cabra) _m.s10_frame=5;
                else if(!_m.s10_examinada) {_m.s10_examinada=true;_m.s10_frame=3;}
                else {
                    global.inventario_pe_cabra=true;
                    sala10_sprites_atualizar();
                    _m.s10_frame=4;
                    bunker_audio_tocar_efeito(Snd_item,9,false);
                }
            } else _m.s10_frame=_m.s10_perto=="bancada" ? 7 : 9;
            _m.s10_tempo=210;_m.s10_input=12;
        }
    }
    var feedback=instance_find(Obj_sala10_feedback,0);
    if(feedback!=noone) {
        feedback.visible=false;feedback.image_speed=0;
        if(_m.s10_tempo>0) {feedback.visible=true;feedback.image_index=_m.s10_frame;}
        else if(_m.s10_perto!="") {
            feedback.visible=true;
            if(_m.s10_perto=="suporte") feedback.image_index=global.inventario_pe_cabra ? 5 : (_m.s10_examinada ? 3 : 2);
            if(_m.s10_perto=="bancada") feedback.image_index=6;
            if(_m.s10_perto=="prateleira") feedback.image_index=8;
        }
    }
}

/// v5.23: mesma moldura/fonte, na faixa superior entre condição e diário.
/// A altura acompanha as linhas; comandos idênticos ao título não se repetem.
/// _medida reserva a fala completa para a caixa não saltar durante a digitação.
function bunker_aviso_gui(_texto, _comando, _medida = "") {
    if (_texto == "" && _comando == "" && _medida == "") return;
    if (_comando == "[E] " + _texto) {
        _texto = "";
        _medida = "";
    }
    var _sx = display_get_gui_width() / 1366;
    var _sy = display_get_gui_height() / 768;
    var _escala = min(_sx, _sy);
    var _x = 310 * _sx;
    var _y = 16 * _sy;
    var _w = 746 * _sx;
    var _margem = 20 * _escala;
    var _largura = (_w - 2 * _margem) / _escala;
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    var _referencia = _medida != "" ? _medida : _texto;
    var _ht = _referencia == "" ? 0 : max(20, string_height_ext(_referencia, 24, _largura));
    var _hc = _comando == "" ? 0 : max(20, string_height_ext(_comando, 24, _largura));
    var _gap = _ht > 0 && _hc > 0 ? 10 : 0;
    var _h = max(48, 28 + _ht + _gap + _hc) * _escala;
    bunker_painel(_x, _y, _w, _h);
    draw_set_color(make_color_rgb(220, 223, 201));
    if (_texto != "") draw_text_ext_transformed(_x + _margem, _y + 14 * _escala,
        _texto, 24, _largura, _escala, _escala, 0);
    draw_set_color(make_color_rgb(180, 159, 110));
    if (_comando != "") draw_text_ext_transformed(_x + _margem,
        _y + (14 + _ht + _gap) * _escala, _comando, 24, _largura, _escala, _escala, 0);
    draw_set_alpha(1);
    draw_set_color(c_white);
    draw_set_font(-1);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}

/// Nome branco no mundo: acompanha a câmera e fica acima do sprite da porta.
function bunker_porta_rotulo_desenhar(_p) {
    if (!_p.ativa || _p.abrindo || global.pause_aberto || global.diario_aberto
        || global.config_aberta || global.cutscene_ativa || global.dialogo_ativo
        || global.vitoria_ativa) return;
    var _j = instance_find(Obj_jogador, 0);
    if (_j == noone || !bunker_porta_em_alcance(_p, _j)) return;
    draw_set_font(Font_de_fala);
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_alpha(1);
    draw_set_color(c_white);
    var _texto = "[E] " + _p.rotulo;
    var _escala = 0.65;
    var _metade = string_width(_texto) * _escala * 0.5;
    var _tx = clamp(_p.x, _metade + 8, room_width - _metade - 8);
    var _ty = max(18, _p.y - 52);
    if (room == Room_Corredor_N2) _ty = _p.y < 160 ? 34 : 227;
    if (room == Room_Corredor_Pos) _ty = _p.tipo_passagem == "escada" ? 136 : (_p.y < 160 ? 28 : 317);
    draw_text_transformed(_tx, _ty, _texto, _escala, _escala, 0);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_set_font(-1);
    draw_set_color(c_white);
}

// v5.36: navegação do chefe; a grade existe somente durante a luta.
function v536_boss_mover(_e, _tx, _ty, _vel, _passo) {
    if (_e.grade == -1) {
        _e.grade = mp_grid_create(0,0,ceil(room_width/8),ceil(room_height/8),8,8);
        for (var _i=0; _i<instance_number(Obj_parede); _i++) {
            var _w = instance_find(Obj_parede,_i);
            mp_grid_add_rectangle(_e.grade,_w.x-_e.pe_r,_w.y-_e.pe_b,
                _w.x+_w.largura+_e.pe_l,_w.y+_w.altura+_e.pe_t);
        }
    }
    // Se ficou na borda de uma célula dilatada, entra numa célula livre
    // visível antes de pedir rota. Nunca reposiciona o chefe por teleporte.
    if (mp_grid_get_cell(_e.grade,floor(_e.x/8),floor(_e.y/8)) < 0) {
        for (var _raio=8; _raio<=160; _raio+=8) {
            for (var _ang=0; _ang<360; _ang+=45) {
                var _sx=_e.x+lengthdir_x(_raio,_ang);
                var _sy=_e.y+lengthdir_y(_raio,_ang);
                if (mp_grid_get_cell(_e.grade,floor(_sx/8),floor(_sy/8)) >= 0
                && v536_boss_trecho_livre(_e,_sx,_sy)) {
                    v536_boss_deslocar(_e,_sx,_sy,_vel);
                    _e.rota_tempo=0;
                    return;
                }
            }
        }
    }
    _e.rota_tempo -= _passo;
    if (_e.rota_tempo <= 0) {
        _e.rota_tempo = 24;
        _e.rota_indice = 1;
        path_clear_points(_e.caminho);
        var _gx = clamp(_tx,66,room_width-66);
        var _gy = clamp(_ty,54,room_height-90);
        // Jogador encostado na parede: a máscara maior busca uma célula próxima.
        if (mp_grid_get_cell(_e.grade,floor(_gx/8),floor(_gy/8)) < 0) {
            var _achou = false;
            for (var _r=12; _r<=96 && !_achou; _r+=12) {
                for (var _a=0; _a<360 && !_achou; _a+=45) {
                    var _cx=clamp(_gx+lengthdir_x(_r,_a),66,room_width-66);
                    var _cy=clamp(_gy+lengthdir_y(_r,_a),54,room_height-90);
                    if (mp_grid_get_cell(_e.grade,floor(_cx/8),floor(_cy/8)) >= 0) {
                        _gx=_cx; _gy=_cy; _achou=true;
                    }
                }
            }
        }
        mp_grid_path(_e.grade,_e.caminho,_e.x,_e.y,_gx,_gy,false);
    }
    var _n=path_get_number(_e.caminho);
    while (_e.rota_indice < _n
    && point_distance(_e.x,_e.y,path_get_point_x(_e.caminho,_e.rota_indice),path_get_point_y(_e.caminho,_e.rota_indice)) <= 3) {
        _e.rota_indice++;
    }
    if (_e.rota_indice < _n) {
        _tx=path_get_point_x(_e.caminho,_e.rota_indice);
        _ty=path_get_point_y(_e.caminho,_e.rota_indice);
    }
    v536_boss_deslocar(_e,_tx,_ty,_vel);
}
function v536_boss_deslocar(_e, _tx, _ty, _vel) {
    var _d=point_distance(_e.x,_e.y,_tx,_ty);
    if (_d <= 0.01) return;
    var _dir=point_direction(_e.x,_e.y,_tx,_ty);
    var _dist=min(_d,_vel);
    var _partes=max(1,ceil(_dist/3));
    var _vx=lengthdir_x(_dist/_partes,_dir);
    var _vy=lengthdir_y(_dist/_partes,_dir);
    for (var _i=0; _i<_partes; _i++) {
        if (!s8_pe_bloqueado(_e,_e.x+_vx,_e.y)) _e.x+=_vx;
        if (!s8_pe_bloqueado(_e,_e.x,_e.y+_vy)) _e.y+=_vy;
    }
}
function v536_boss_animar(_e, _dx, _dy, _passo) {
    var _movendo=abs(_dx)+abs(_dy)>0.01;
    if (_movendo) _e.dir_olhando=point_direction(0,0,_dx,_dy);
    var _dir=floor((_e.dir_olhando+45)/90) mod 4;
    var _spr=Spr_andando_baixo;
    switch (_dir) {
        case 0: _spr=Spr_andando_direita; break;
        case 1: _spr=Spr_andando_cima; break;
        case 2: _spr=Spr_andando_esquerda; break;
    }
    if (_e.sprite_index != _spr) { _e.sprite_index=_spr; _e.image_index=0; }
    _e.image_speed=_movendo ? 0.85*_passo : 0;
    if (!_movendo) _e.image_index=0;
}

function v536_boss_trecho_livre(_e,_tx,_ty) {
    for (var _i=0; _i<instance_number(Obj_parede); _i++) {
        var _w=instance_find(Obj_parede,_i);
        if (bunker_segmento_caixa(_e.x,_e.y,_tx,_ty,
            _w.x-_e.pe_r,_w.y-_e.pe_b,
            _w.x+_w.largura+_e.pe_l-0.01,_w.y+_w.altura+_e.pe_t-0.01) <= 1) return false;
    }
    return true;
}
