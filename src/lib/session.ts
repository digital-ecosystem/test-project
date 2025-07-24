export async function decrypt(cookie: string | undefined) {
  if (!cookie) return null;
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
} 