const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Encrypts a plaintext string using AES-GCM with a key derived from password.
 * Returns a Base64 string containing salt + IV + ciphertext.
 */
export async function encryptText(text: string, password: string): Promise<string> {
  if (!text) return "";
  if (!password) throw new Error("Hasło szyfrujące jest wymagane.");

  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    textEncoder.encode(text)
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert combined array to Base64 in a browser-safe way
  let binary = "";
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return window.btoa(binary);
}

/**
 * Decrypts a Base64 ciphertext string using AES-GCM with a key derived from password.
 */
export async function decryptText(encryptedBase64: string, password: string): Promise<string> {
  if (!encryptedBase64) return "";
  if (!password) throw new Error("Hasło deszyfrujące jest wymagane.");

  const binaryString = window.atob(encryptedBase64);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    ciphertext
  );

  return textDecoder.decode(decrypted);
}

/**
 * Encrypts a File using AES-GCM. Returns a Blob containing the raw encrypted file bytes.
 */
export async function encryptFile(file: File, password: string): Promise<Blob> {
  if (!password) throw new Error("Hasło szyfrujące jest wymagane.");

  const fileData = await file.arrayBuffer();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    fileData
  );

  const header = new Uint8Array(salt.length + iv.length);
  header.set(salt, 0);
  header.set(iv, salt.length);

  return new Blob([header, encrypted], { type: "application/octet-stream" });
}

/**
 * Decrypts a Blob back to another Blob using the original file type.
 */
export async function decryptFile(encryptedBlob: Blob, password: string, originalType: string): Promise<Blob> {
  if (!password) throw new Error("Hasło deszyfrujące jest wymagane.");

  const combined = await encryptedBlob.arrayBuffer();
  const salt = new Uint8Array(combined, 0, SALT_LENGTH);
  const iv = new Uint8Array(combined, SALT_LENGTH, IV_LENGTH);
  const ciphertext = new Uint8Array(combined, SALT_LENGTH + IV_LENGTH);

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    ciphertext
  );

  return new Blob([decrypted], { type: originalType });
}
