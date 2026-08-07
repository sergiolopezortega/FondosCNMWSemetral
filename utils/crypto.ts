export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  const inputHash = await hashPassword(inputPassword);
  const storedHash = localStorage.getItem('adminPasswordHash');
  
  if (!storedHash) {
    const defaultHash = await hashPassword('1973');
    return inputHash === defaultHash;
  }
  
  return inputHash === storedHash;
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const newHash = await hashPassword(newPassword);
  localStorage.setItem('adminPasswordHash', newHash);
  localStorage.removeItem('adminPassword'); // Clean up any legacy plain text if present
}
