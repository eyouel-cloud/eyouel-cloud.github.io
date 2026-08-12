#!/usr/bin/env node

import {deflateSync} from 'node:zlib';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(__dirname, '../assets/data-pitch-icon.png');
const width = 1024;
const height = 1024;
const pixels = Buffer.alloc(width * height * 4);

const colors = {
  white: [255, 255, 255, 255],
  green: [75, 140, 92, 255],
  mint: [219, 244, 225, 255],
  gold: [242, 201, 76, 255]
};

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    setPixel(x, y, colors.white);
  }
}

fillCircle(512, 512, 430, colors.green);
strokeCircle(512, 512, 324, 26, colors.mint);
drawThickLine(222, 684, 802, 684, 26, colors.mint);
drawThickLine(254, 756, 770, 756, 18, colors.mint);
fillRect(314, 526, 58, 134, colors.mint);
fillRect(454, 442, 58, 218, colors.mint);
fillRect(594, 348, 58, 312, colors.mint);
drawThickLine(280, 706, 468, 584, 30, colors.gold);
drawThickLine(468, 584, 684, 372, 30, colors.gold);
drawThickLine(684, 372, 752, 372, 30, colors.gold);
drawThickLine(684, 372, 684, 440, 30, colors.gold);

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

function strokeCircle(cx, cy, radius, thickness, color) {
  const outer = radius + thickness / 2;
  const inner = radius - thickness / 2;
  const outerSquared = outer * outer;
  const innerSquared = inner * inner;
  for (let y = Math.floor(cy - outer); y <= Math.ceil(cy + outer); y += 1) {
    for (let x = Math.floor(cx - outer); x <= Math.ceil(cx + outer); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= outerSquared && distanceSquared >= innerSquared) {
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
