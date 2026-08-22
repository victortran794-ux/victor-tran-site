import {
  randomBytes,
  scrypt as deriveKey,
  timingSafeEqual,
} from 'node:crypto';

const DEFAULT_COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 32;

function scrypt(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    deriveKey(password, salt, keyLength, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function validCost(value) {
  return Number.isSafeInteger(value) && value >= 1024 && value <= 1_048_576 && (value & (value - 1)) === 0;
}

export async function createPasswordVerifier(password, options = {}) {
  if (!password) throw new TypeError('Password is required.');
  const cost = options.cost ?? DEFAULT_COST;
  if (!validCost(cost)) throw new TypeError('Invalid scrypt cost.');
  const salt = options.salt ? Buffer.from(options.salt) : randomBytes(16);
  const key = await scrypt(String(password), salt, KEY_LENGTH, {
    N: cost,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 128 * cost * BLOCK_SIZE + 1024 * 1024,
  });
  return `scrypt$${cost}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, verifier) {
  if (!password || !verifier) return false;
  const [algorithm, costText, blockSizeText, parallelizationText, saltText, keyText, ...extra] = String(verifier).split('$');
  if (extra.length || algorithm !== 'scrypt') return false;

  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelization = Number(parallelizationText);
  if (!validCost(cost) || blockSize !== BLOCK_SIZE || parallelization !== PARALLELIZATION) return false;

  let salt;
  let expectedKey;
  try {
    salt = Buffer.from(saltText, 'base64url');
    expectedKey = Buffer.from(keyText, 'base64url');
  } catch {
    return false;
  }
  if (salt.length < 16 || expectedKey.length !== KEY_LENGTH) return false;

  const suppliedKey = await scrypt(String(password), salt, expectedKey.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: 128 * cost * blockSize + 1024 * 1024,
  });
  return timingSafeEqual(suppliedKey, expectedKey);
}
