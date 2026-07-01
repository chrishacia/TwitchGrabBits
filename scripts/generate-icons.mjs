import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(__dirname, '../assets/logo/logo-full.png');
const outputDir = path.resolve(__dirname, '../public/icon');

const sizes = [16, 32, 48, 96, 128];

const metadata = await sharp(source).metadata();
if (!metadata.width || !metadata.height) {
  throw new Error('Unable to read source logo dimensions');
}

const minDimension = Math.min(metadata.width, metadata.height);
const cropSize = Math.round(minDimension * 0.62);
const left = Math.max(0, Math.round((metadata.width - cropSize) / 2));
const top = Math.max(0, Math.round(metadata.height * 0.1));
const safeTop = Math.min(top, metadata.height - cropSize);

const emblemBuffer = await sharp(source)
  .extract({
    left,
    top: safeTop,
    width: cropSize,
    height: cropSize,
  })
  .png()
  .toBuffer();

await Promise.all(
  sizes.map(async (size) => {
    const outputPath = path.join(outputDir, `${size}.png`);
    await sharp(emblemBuffer)
      .resize(size, size, {
        fit: 'cover',
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }),
);
