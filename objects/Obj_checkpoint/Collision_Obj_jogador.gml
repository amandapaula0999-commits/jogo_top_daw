#region/////////------ATIVAÇÃO DO CHECKPOINT

// Se o checkpoint salvo no jogador ainda não for este objeto
if (other.checkpoint_x != x || other.checkpoint_y != y) {
    
    // Marca ess objeto como o novo ponto de renascimento
    other.checkpoint_x = x;
    other.checkpoint_y = y;
    v5_checkpoint_gravar(room,x,y);
    bunker_audio_tocar_efeito(Snd_checkpoint, 14, false);
    
}

#endregion////////////////////////////////
