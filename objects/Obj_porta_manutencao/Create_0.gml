// Porta do bloco central. Usa o mesmo colisor do restante do jogo.
image_speed = 0;
aberta = global.manutencao_porta_aberta;
bloqueio = noone;
porta_l = 240;
porta_t = 247;
porta_w = 35;
porta_h = 6;
raio_interacao = 34;
mensagem_tempo = 0;
if (!aberta) {
    bloqueio = instance_create_depth(porta_l,porta_t,200,Obj_parede);
    bunker_parede_configurar(bloqueio,porta_w,porta_h);
}
var cenario = instance_find(Obj_sala_manutencao_cenario,0);
if (cenario != noone) cenario.image_index = aberta ? 1 : 0;

// Estado local de esforço e fala; abertura e crachá persistem nas globais.
esforco = 0;
fala_etapa = 0;
fala_espera = 0;
fala_texto = "";
input_liberado = false;
