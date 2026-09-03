#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const root = process.cwd();
const approvedArtifacts = new Map([
  ['pci-handbook-1-cover.jpg', {
    sha256: '41237171c4a77bf7f8453a74447335885403935e72a045f0a31185f0b024efb6',
    mime: 'image/jpeg',
    width: 1584,
    height: 1224,
  }],
  ['pci-handbook-1-cover.webp', {
    sha256: 'ff72c1a6cff4592ecd82a40a9db553981b6b02bda1577a03c313f89a9ae806ba',
    mime: 'image/webp',
    width: 1584,
    height: 1224,
  }],
]);
const failures = [];

function inspectImage(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) throw new Error('invalid JPEG marker');
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) throw new Error('invalid JPEG segment length');
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { mime: 'image/jpeg', height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
    throw new Error('JPEG has no frame dimensions');
  }

  if (buffer.subarray(0, 4).equals(Buffer.from('RIFF', 'ascii')) && buffer.subarray(8, 12).equals(Buffer.from('WEBP', 'ascii'))) {
    const chunk = buffer.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8 ') {
      return { mime: 'image/webp', width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const value = buffer.readUInt32LE(21);
      return { mime: 'image/webp', width: (value & 0x3fff) + 1, height: ((value >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { mime: 'image/webp', width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
    }
    throw new Error(`unsupported WebP chunk: ${chunk}`);
  }

  throw new Error('unsupported image MIME');
}

for (const [file, approved] of approvedArtifacts) {
  const target = `${root}/images/${file}`;
  if (!fs.existsSync(target)) {
    failures.push(`missing approved page-1 cover derivative: images/${file}`);
    continue;
  }
  const buffer = fs.readFileSync(target);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (hash !== approved.sha256) failures.push(`${file} SHA-256 differs from the approved page-1 artifact`);
  try {
    const image = inspectImage(buffer);
    if (image.mime !== approved.mime) failures.push(`${file} MIME must be ${approved.mime}, received ${image.mime}`);
    if (image.width !== approved.width || image.height !== approved.height) failures.push(`${file} dimensions must be ${approved.width}x${approved.height}, received ${image.width}x${image.height}`);
  } catch (error) {
    failures.push(`${file} cannot be inspected: ${error.message}`);
  }
}

if (failures.length) {
  console.error('PCI cover source contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('PCI cover source contract passed (approved page-1 JPEG and WebP artifacts match pinned SHA-256, MIME, and 1584x1224 dimensions).');
