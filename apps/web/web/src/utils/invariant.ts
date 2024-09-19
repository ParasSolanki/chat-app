export function invariant(
  cond?: boolean,
  message?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...args: string[]
): asserts cond {
  if (cond) {
    return;
  }

  throw new Error("Invariant Error: " + message);
}
