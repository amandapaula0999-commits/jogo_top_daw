/// Pause - congela o mundo e mantém somente o menu ativo
// Abertura do diário define a flag antes de criar esta instância. Ler a flag
// aqui evita que o primeiro Draw GUI ainda seja tratado como pause comum.
modo_diario = variable_global_exists("diario_aberto") && global.diario_aberto;
pagina_diario = max(0, array_length(global.evidencias) - 1);
selecionado = 0;
quantidade_opcoes = 3;
puxado = [1, 0, 0];
bloqueio_input = 9;
pulso = 0;
quadro_formiga = 0;

instance_deactivate_all(true);
audio_pause_all();
