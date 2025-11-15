/**
 * Convert SVG favicon to ICO format
 * 
 * Option 1: Use this script (requires: npm install --save-dev sharp to-ico)
 * Option 2: Use online converter at https://realfavicongenerator.net/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../public/favicon.svg');
const icoPath = path.join(__dirname, '../public/favicon.ico');

async function convertSvgToIco() {
  try {
    // Try to import sharp and to-ico
    const sharp = (await import('sharp')).default;
    const toIco = (await import('to-ico')).default;

    console.log('📝 Reading SVG file...');
    const svgBuffer = fs.readFileSync(svgPath);

    console.log('🔄 Converting SVG to PNG...');
    const pngBuffer = await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();

    console.log('🔄 Converting PNG to ICO...');
    const icoBuffer = await toIco([pngBuffer], {
      sizes: [32]
    });

    console.log('💾 Saving favicon.ico...');
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log('✅ Successfully created favicon.ico!');
    console.log(`   Location: ${icoPath}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Required packages not found.');
      console.log('');
      console.log('📦 Install required packages:');
      console.log('   npm install --save-dev sharp to-ico');
      console.log('');
      console.log('🔄 Or use an online converter:');
      console.log('   1. Go to: https://realfavicongenerator.net/');
      console.log('   2. Upload: public/favicon.svg');
      console.log('   3. Download favicon.ico and save to public/ folder');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

convertSvgToIco();


