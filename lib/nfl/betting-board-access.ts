// Keep the authorization decision before any protected data read, including cache hits.
export async function readAuthorizedBoard<T>(checkAccess: () => Promise<boolean>, read: () => Promise<T>): Promise<T | null> {
  if (!(await checkAccess())) return null;
  return read();
}
