import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, COST_FACTOR);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
