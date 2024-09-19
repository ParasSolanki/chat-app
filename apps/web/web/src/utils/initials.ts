export function getInitials(text: string, divider = " ") {
  return text
    .split(divider)
    .slice(0, 2)
    .map((c) => c.charAt(0))
    .join("");
}
