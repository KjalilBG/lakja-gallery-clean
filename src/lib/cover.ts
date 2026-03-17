export function getObjectPosition(position: "top" | "center" | "bottom") {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

export function getObjectPositionFromFocus(x = 50, y = 50) {
  return `${x}% ${y}%`;
}
