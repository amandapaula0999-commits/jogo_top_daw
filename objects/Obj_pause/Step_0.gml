/// Pause - navegação e ações
if (keyboard_check_pressed(vk_f11)) {
    window_set_fullscreen(!window_get_fullscreen());
}

if (bloqueio_input > 0) bloqueio_input--;
pulso += 0.09;
quadro_formiga += 0.16;

if (modo_diario) {
    if (bloqueio_input <= 0) {
        if (keyboard_check_pressed(vk_right) || keyboard_check_pressed(ord("D"))) pagina_diario++;
        if (keyboard_check_pressed(vk_left) || keyboard_check_pressed(ord("A"))) pagina_diario--;
        pagina_diario = clamp(pagina_diario, 0, max(0, array_length(global.evidencias) - 1));
        if (keyboard_check_pressed(vk_escape) || keyboard_check_pressed(ord("J"))) {
            global.diario_aberto = false;
            instance_activate_all();
            audio_resume_all();
            instance_destroy();
        }
    }
    exit;
}

if (bloqueio_input <= 0) {
    if (keyboard_check_pressed(vk_up) || keyboard_check_pressed(ord("W"))) {
        selecionado = (selecionado + quantidade_opcoes - 1) mod quantidade_opcoes;
    }
    if (keyboard_check_pressed(vk_down) || keyboard_check_pressed(ord("S"))) {
        selecionado = (selecionado + 1) mod quantidade_opcoes;
    }

    var mx = device_mouse_x_to_gui(0);
    var my = device_mouse_y_to_gui(0);
    var ys = [278, 390, 502];
    var confirmar = keyboard_check_pressed(vk_enter) || keyboard_check_pressed(vk_space);

    for (var i = 0; i < quantidade_opcoes; i++) {
        if (point_in_rectangle(mx, my, 598, ys[i] - 45, 1130, ys[i] + 45)) {
            selecionado = i;
            if (mouse_check_button_pressed(mb_left)) confirmar = true;
        }
    }

    // ESC fecha a pausa; P é reservado para o ciclo de salas de debug.
    // durante o pequeno debounce de criação do menu.
    if (keyboard_check_pressed(vk_escape)) {
        instance_activate_all();
        audio_resume_all();
        instance_destroy();
        exit;
    }

    if (confirmar) {
        switch (selecionado) {
            case 0:
                instance_activate_all();
                audio_resume_all();
                instance_destroy();
                break;
            case 1:
                instance_activate_all();
                audio_resume_all();
                global.cutscene_ativa = false;
                global.dialogo_ativo = false;
                global.spawn_room = -1;
                instance_destroy();
                v5_reiniciar_checkpoint();
                exit;
            case 2:
                instance_activate_all();
                audio_resume_all();
                instance_destroy();
                room_goto(Room_Menu);
                exit;
        }
    }
}

for (var j = 0; j < quantidade_opcoes; j++) {
    puxado[j] = lerp(puxado[j], j == selecionado, 0.24);
}
