// NationScope chart helpers: small canvas charts, drawn by hand, no library.
// Every chart is a plain function that takes a canvas element and rows of
// { label, value, colour } and paints labelled horizontal bars with values.
function fitCanvas(canvas) {
  // Keep the drawing crisp on high-density screens without changing layout.
  // Pin the CSS height to the canvas's height attribute: without this, the
  // browser keeps the canvas's intrinsic aspect ratio and stretches the
  // drawing area (a 150px chart would render 471px tall at desktop width).
  const wanted = canvas.getAttribute("height");
  if (wanted) canvas.style.height = wanted + "px";
  const ratio = window.devicePixelRatio || 1;
  const box = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(box.width * ratio));
  canvas.height = Math.max(1, Math.round(box.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx: ctx, width: box.width, height: box.height };
}

function niceMax(value) {
  // Round the axis ceiling up to a tidy number so bar ends sit inside the plot.
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const scaled = value / power;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * power;
}

function drawBars(canvas, rows, formatValue) {
  // rows: [{ label, value, colour }], biggest first. Bars are grouped in the
  // canvas's own height; labels sit left, values sit at the bar's end.
  const view = fitCanvas(canvas);
  const ctx = view.ctx;
  const left = 118;
  const right = 8;
  const plotWidth = view.width - left - right;
  const ceiling = niceMax(Math.max.apply(null, rows.map(function (r) { return r.value; })));
  const slot = view.height / rows.length;
  const barHeight = Math.min(22, slot * 0.55);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  rows.forEach(function (row, i) {
    const y = i * slot + slot / 2;
    ctx.fillStyle = "#33414f";
    ctx.textAlign = "right";
    ctx.fillText(row.label, left - 10, y);
    const length = (row.value / ceiling) * plotWidth;
    ctx.fillStyle = row.colour || "#2a7f6f";
    ctx.beginPath();
    ctx.roundRect(left, y - barHeight / 2, Math.max(2, length), barHeight, 4);
    ctx.fill();
    ctx.fillStyle = "#0f2a43";
    ctx.textAlign = "left";
    ctx.fillText(formatValue(row.value), left + length + 7, y);
  });
}

function drawPairedBars(canvas, pairs, formatValue) {
  // pairs: [{ label, before, after }] — two bars per row, 2015 in grey and
  // 2024 in the site's teal, so a decade of change is visible at a glance.
  const view = fitCanvas(canvas);
  const ctx = view.ctx;
  const left = 96;
  const right = 8;
  const plotWidth = view.width - left - right;
  const ceiling = niceMax(Math.max.apply(null, pairs.map(function (p) { return Math.max(p.before, p.after); })));
  const slot = view.height / pairs.length;
  const barHeight = Math.min(13, slot * 0.28);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  pairs.forEach(function (pair, i) {
    const centre = i * slot + slot / 2;
    ctx.fillStyle = "#33414f";
    ctx.textAlign = "right";
    ctx.fillText(pair.label, left - 10, centre);
    const beforeLen = (pair.before / ceiling) * plotWidth;
    const afterLen = (pair.after / ceiling) * plotWidth;
    ctx.fillStyle = "#b8c2cc";
    ctx.beginPath();
    ctx.roundRect(left, centre - barHeight - 2, Math.max(2, beforeLen), barHeight, 3);
    ctx.fill();
    ctx.fillStyle = "#2a7f6f";
    ctx.beginPath();
    ctx.roundRect(left, centre + 2, Math.max(2, afterLen), barHeight, 3);
    ctx.fill();
    ctx.fillStyle = "#0f2a43";
    ctx.textAlign = "left";
    ctx.fillText(formatValue(pair.after), left + afterLen + 7, centre + 2 + barHeight / 2);
  });
  // Legend, drawn once at the bottom left of the canvas.
  ctx.fillStyle = "#b8c2cc";
  ctx.fillRect(left, view.height - 16, 12, 12);
  ctx.fillStyle = "#33414f";
  ctx.textAlign = "left";
  ctx.fillText("2015", left + 17, view.height - 10);
  ctx.fillStyle = "#2a7f6f";
  ctx.fillRect(left + 62, view.height - 16, 12, 12);
  ctx.fillStyle = "#33414f";
  ctx.fillText("2024", left + 79, view.height - 10);
}
