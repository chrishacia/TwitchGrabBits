import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(__dirname, '../assets/logo/logo-emblem.svg');
const outputDir = path.resolve(__dirname, '../public/icon');

const sizes = [16, 32, 48, 128];

await Promise.all(
  sizes.map(async (size) => {
    const outputPath = path.join(outputDir, `${size}.png`);
    await sharp(source)
      .resize(size, size, {
        fit: 'cover',
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }),
);
