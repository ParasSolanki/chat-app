export function invariant(cond?: boolean, message?: string): asserts cond {
  if (cond) {
    return;
  }

  throw new Error("Invariant Error: " + message);
}
