// Input: mouse position + click queue + pressed keys, in canvas pixels.
// The canvas is letterboxed by CSS; main.js converts client coords.
export function createInput(canvas) {
  const input = {
    mouseX: 640,
    mouseY: 360,
    clicks: [], // {x, y} consumed by main each frame
    keys: [], // key strings consumed by main each frame
    hover: null,
  };
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * 1280;
    input.mouseY = ((e.clientY - r.top) / r.height) * 720;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.clicks.push({
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    });
  });
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    input.keys.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  return input;
}
