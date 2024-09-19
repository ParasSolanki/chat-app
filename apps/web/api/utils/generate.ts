import { customAlphabet } from "nanoid";
import crypto from "node:crypto";
import { createDate, TimeSpan } from "oslo";
import { base64url } from "oslo/encoding";

const nanoid = customAlphabet("1234567890ABCEDEFGHIJKLMNOPQRSTUVWXYZ", 21);

const INVITE_CODE_LENGTH = 6;
const SLUG_LENGTH = 12;
const BIG_SLUG_LENGTH = 21;

export const generateUsername = (email: string) => {
  // Split the email to get the username part
  const username = email.split("@")[0];

  // Split the username by common delimiters
  const parts = username.split(/[._-]/);

  // Capitalize the first letter of each part and join them with spaces
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const generateWorkspaceName = (email: string) => {
  return `${generateUsername(email)} Workspace`;
};

export const generateWorkspaceInviteCode = () => nanoid(INVITE_CODE_LENGTH);
export const generateWorkspaceSlug = () => `W${nanoid(SLUG_LENGTH)}`;
export const generateChannelSlug = () => `C${nanoid(SLUG_LENGTH)}`;
export const generateMemberSlug = () => `D${nanoid(SLUG_LENGTH)}`;
export const generateMessageSlug = () => `M${nanoid(BIG_SLUG_LENGTH)}`;
export const generateFileSlug = () => `F${nanoid(BIG_SLUG_LENGTH)}`;

type Payload = {
  u: string;
  w: string;
  e?: number;
};

export const generateRedirectToken = (data: {
  payload: Payload;
  secret: string;
}) => {
  const randomBytes = crypto.randomBytes(10).toString("base64url");
  const expiresAt = createDate(new TimeSpan(30, "m"));
  Object.assign(data.payload, { e: expiresAt.getTime() });

  const encoded = new TextEncoder().encode(JSON.stringify(data.payload));

  // Stringify and encode the payload
  const encodedPayload = base64url.encode(encoded);

  // Combine random bytes and encoded payload
  const token = `${randomBytes}.${encodedPayload}`;

  // Sign the token
  const signature = crypto
    .createHmac("sha256", data.secret)
    .update(token)
    .digest("base64url");

  return `${token}.${signature}`;
};

export const validateRedirectToken = (token: string, secret: string) => {
  const [randomPart, encodedPayload, signature] = token.split(".");

  if (!randomPart) throw new Error("Invalid token");
  if (!encodedPayload) throw new Error("Invalid token");
  if (!signature) throw new Error("Invalid token signature");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${randomPart}.${encodedPayload}`)
    .digest("base64url");

  if (expectedSignature !== signature)
    throw new Error("Invalid token signature");

  // Decode and parse the payload
  const payload = base64url.decode(encodedPayload);

  const decoded = JSON.parse(
    new TextDecoder().decode(payload)
  ) as unknown as Payload;

  if (!decoded.e) throw new Error("Invalid token");

  if (decoded?.e < Date.now()) {
    throw new Error("Token has expired");
  }

  return decoded;
};
