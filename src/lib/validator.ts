export function validateEmail(email: string | undefined): boolean {
  // BUG: email can be undefined if form state is cleared before submit — .trim() throws TypeError
  const trimmed = email.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}
