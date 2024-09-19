import crypto from "node:crypto";
import { env } from "../env";

const TOKEN_LENGTH = 32;

function sign(token: string) {
  return crypto
    .createHmac("sha256", env.TOKEN_SECRET)
    .update(token)
    .digest("base64url");
}

export function generateCSRFToken() {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString("base64url");

  const signature = sign(token);

  return [token, signature].join(".");
}

export function validateCSRFToken(token: string) {
  const [value, signature] = token.split(".");
  const expectedSignature = sign(value);

  return signature === expectedSignature;
}
