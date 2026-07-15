#!/usr/bin/env node

import {deflateSync} from 'node:zlib';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(__dirname, '../assets/eyouel-markets-icon.png');
const width = 1024;
const height = 1024;
const pixels = Buffer.alloc(width * height * 4);

const colors = {
  navy: [7, 18, 37, 255],
  grid: [17, 38, 70, 255],
  cyan: [34, 199, 242, 255],
  gold: [242, 201, 76, 255],
  green: [39, 217, 136, 255],
  white: [239, 246, 255, 255]
};

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    setPixel(x, y, colors.navy);
  }
}

for (let x = 96; x <= width - 96; x += 96) {
  fillRect(x, 96, 2, height - 192, colors.grid);
}
for (let y = 96; y <= height - 96; y += 96) {
  fillRect(96, y, width - 192, 2, colors.grid);
}

fillRect(250, 286, 86, 420, colors.cyan);
fillRect(250, 286, 278, 82, colors.cyan);
fillRect(250, 455, 232, 76, colors.cyan);
fillRect(250, 624, 278, 82, colors.cyan);

fillRect(570, 286, 78, 420, colors.gold);
fillRect(790, 286, 78, 420, colors.gold);
drawThickLine(640, 300, 720, 505, 64, colors.gold);
drawThickLine(720, 505, 800, 300, 64, colors.gold);

drawThickLine(244, 792, 410, 742, 18, colors.green);
drawThickLine(410, 742, 548, 772, 18, colors.green);
drawThickLine(548, 772, 690, 684, 18, colors.green);
drawThickLine(690, 684, 838, 718, 18, colors.green);
fillCircle(244, 792, 20, colors.white);
fillCircle(410, 742, 20, colors.white);
fillCircle(548, 772, 20, colors.white);
fillCircle(690, 684, 20, colors.white);
fillCircle(838, 718, 20, colors.white);

writeFileSync(output, encodePng(width, height, pixels));
console.log(output);

function setPixel(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return;
  }
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function fillRect(x, y, rectWidth, rectHeight, color) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) {
      setPixel(col, row, color);
    }
  }
}

function fillCircle(cx, cy, radius, color) {
  const radiusSquared = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(x, y, color);
      }
    }
  }
}

function drawThickLine(x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    fillCircle(
      Math.round(x1 + dx * ratio),
      Math.round(y1 + dy * ratio),
      Math.round(thickness / 2),
      color
    );
  }
}

function encodePng(pngWidth, pngHeight, rgba) {
  const raw = Buffer.alloc((pngWidth * 4 + 1) * pngHeight);
  for (let y = 0; y < pngHeight; y += 1) {
    const rowStart = y * (pngWidth * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * pngWidth * 4, (y + 1) * pngWidth * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr(pngWidth, pngHeight)),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function ihdr(pngWidth, pngHeight) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(pngWidth, 0);
  buffer.writeUInt32BE(pngHeight, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
