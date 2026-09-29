#!/usr/bin/env node
'use strict';

// Importação dos três recortes produzidos pelo editor de imagens.
// Não desenha a formiga: a arte final está nos PNGs de art_sources.
// Uso opcional para reimportar os assets: node tools/apply_ant_logos.cjs
// Dependência de edição: sharp. O jogo não depende de Node nem de sharp.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'art_sources', 'logo_formiga_v418');
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, 'patches.json'), 'utf8'));

async function main() {
  const composites = manifest.patches.map(patch => ({
    input: path.join(sourceDir, patch.file), left: patch.left, top: patch.top,
  }));
  const sources = [
    'art_sources/menu_base_v42.png',
    'art_sources/menu_diegetico_v43.png',
    'art_sources/menu_diegetico_v44.png',
  ];
  const spriteDir = path.join(root, 'sprites', 'Spr_menu_bg');
  const sprite = JSON.parse(fs.readFileSync(path.join(spriteDir, 'Spr_menu_bg.yy'), 'utf8'));
  const layer = sprite.layers[0].name;
  // Atualiza também a cópia legada, para uma futura reimportação não trazer
  // o desenho antigo. Os quatro quadros ativos e suas layers são preservados.
  for (const file of fs.readdirSync(spriteDir).filter(file => file.endsWith('.png'))) {
    sources.push('sprites/Spr_menu_bg/' + file);
    const frame = path.basename(file, '.png');
    sources.push(`sprites/Spr_menu_bg/layers/${frame}/${layer}.png`);
  }

  for (const relative of sources) {
    const filename = path.join(root, relative);
    const original = fs.readFileSync(filename);
    const metadata = await sharp(original).metadata();
    if (metadata.width !== manifest.width || metadata.height !== manifest.height) {
      throw new Error(`Dimensão inesperada: ${relative}`);
    }
    const result = await sharp(original).composite(composites)
      .png({compressionLevel: 9, adaptiveFiltering: true}).toBuffer();
    const temporary = filename + '.importing';
    try {
      fs.writeFileSync(temporary, result);
      fs.renameSync(temporary, filename);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
    console.log('Atualizado: ' + relative);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
