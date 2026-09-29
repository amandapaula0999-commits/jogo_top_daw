#region/////////------MOVIMENTAÇÃO E ORIGEM

velocidade_boss = 2; // Velocidade de caminhada ao perseguir o jogador
velocidade_retorno = 3; // Velocidade de caminhada ao voltar para a posição inicial
alcance_aggro = 1600; // cobre toda a arena de contenção

// O sprite original possui apenas 32x40. O chefe recebe escala própria para
// continuar grande com a nova câmera de tela cheia.
image_xscale = 3.0;
image_yscale = 3.0;
mask_index = Spr_mascara_boss; // Pés separados das antenas e ombros.
ataque_ativo = false;
ataque_tempo = 0;
ataque_quadro = 0;
ataque_intervalo = 150;
impacto_aplicado = false;
impacto_raio = 135;
impacto_x = x;
impacto_y = y;
onda_tempo = 0;
vulneravel_tempo = 0;
acido_recarga = 0;
acido_ultimo = noone;
contato_espera = 90;
fuga_etapa = 0;
fuga_preparo = 0;
// Preparada depois da introdução, quando as pedras já existem.
grade = -1;
caminho = path_add();
rota_tempo = 0;
rota_indice = 1;
pe_l = 30; pe_r = 29; pe_t = 0; pe_b = 47;

x_inicial = x; // Guarda a coordenada X onde o chefe foi colocado no mapa
y_inicial = y; // Guarda a coordenada Y onde o chefe foi colocado no mapa

speed = 0; // Velocidade inicial do movimento nativo do GameMaker
dir_olhando = 270; // Direção para onde está olhando em graus (270 = Baixo)

#endregion////////////////////////////////


#region/////////------ESTADOS E VISIBILIDADE

visible = (room == Room1); // Na arena do chefe ele já começa visível

derrotado = false; // Indica se o chefe está caído por causa do ácido (true/false)
esperando_levantar = false; // Controla se o tempo de 5 segundos para se levantar já está contando

vida_max = 180;
vida = vida_max;
morto = false;
tomou_dano = false;
feedback_tempo = 0;
feedback_texto = "";
em_acido = false;
fugindo = false;
fuga_tempo = 0;
saida_impacto = false;
fuga_alvo_x = 683;
fuga_alvo_y = 640;
if (variable_global_exists("boss_derrotado") && global.boss_derrotado) {
    vida = 0;
    morto = true;
    saida_impacto = true;
}

// Ao voltar para a arena depois da vitória, o chefe não renasce inteiro.
if (variable_global_exists("boss_derrotado") && global.boss_derrotado) vida = 0;

#endregion////////////////////////////////
