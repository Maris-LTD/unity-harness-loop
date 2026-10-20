const ui = {};
ui.SET = 'Game UI';
ui.FONT = 'Lilita One';
ui.W = 1080;
ui.H = 2340;
ui.sleep = ms => new Promise(r => setTimeout(r, ms));

ui.DEFAULT_TOKENS = {
  color: {
    'theme.sky': '#4FC3F7', 'theme.primary': '#1E88E5', 'theme.deep': '#0B3D91', 'theme.ink': '#0A2A5E', 'theme.surface': '#E3F4FF',
    'btn.green.top': '#7EE35A', 'btn.green.base': '#3DBE3A', 'btn.green.edge': '#23861F', 'btn.green.outline': '#1E7A1B',
    'btn.blue.top': '#5CC8FF', 'btn.blue.base': '#1E88E5', 'btn.blue.edge': '#0D5BB5', 'btn.blue.outline': '#0B4F9E',
    'btn.red.top': '#FF7A6B', 'btn.red.base': '#E53935', 'btn.red.edge': '#A31515', 'btn.red.outline': '#9E1B1B',
    'btn.purple.top': '#C77DFF', 'btn.purple.base': '#8E2DE2', 'btn.purple.edge': '#5B1A9E', 'btn.purple.outline': '#5A1898',
    'btn.yellow.top': '#FFE45C', 'btn.yellow.base': '#FFB300', 'btn.yellow.edge': '#C67C00', 'btn.yellow.outline': '#B86A00',
    'text.onButton': '#FFFFFF', 'badge.notify': '#F44336'
  },
  borderRadius: { 'radius.button.lg': '40', 'radius.button.md': '28', 'radius.button.sm': '20', 'radius.panel': '36', 'radius.tile': '24' },
  borderWidth: { 'stroke.button': '4', 'stroke.panel': '6' },
  fontSizes: { 'font.display': '104', 'font.title': '64', 'font.button': '60', 'font.body': '40', 'font.label': '34', 'font.min': '28' },
  spacing: { 'space.xs': '8', 'space.sm': '16', 'space.md': '24', 'space.lg': '40', 'space.xl': '64', 'safe.top': '150', 'safe.bottom': '70' },
  sizing: { 'icon.currency': '96', 'icon.side': '112', 'icon.tab.normal': '128', 'icon.tab.active': '200', 'touch.min': '120' }
};

ui.set = () => penpot.library.local.tokens.sets.find(s => s.name === ui.SET);
ui.ensureTokens = (overrides = {}) => {
  let set = ui.set();
  if (!set) set = penpot.library.local.tokens.addSet({ name: ui.SET });
  if (!set.active) set.toggleActive();
  let created = 0;
  for (const [type, items] of Object.entries(ui.DEFAULT_TOKENS))
    for (const [name, value] of Object.entries(items))
      if (!set.tokens.find(t => t.name === name)) { set.addToken({ type, name, value: overrides[name] ?? value }); created++; }
  return created;
};
ui.setToken = (type, name, value) => {
  const set = ui.set();
  const ex = set.tokens.find(t => t.name === name);
  if (ex) ex.remove();
  return set.addToken({ type, name, value });
};
ui.tok = n => {
  const t = ui.set()?.tokens.find(t => t.name === n);
  if (!t) throw new Error('Missing token ' + n + ' (run ui.ensureTokens())');
  return t.resolvedValue ?? t.value;
};
ui.num = n => Number(ui.tok(n));

ui.solid = (c, o = 1) => [{ fillColor: c, fillOpacity: o }];
const stopsOf = list => list.map((s, i) => typeof s === 'string' ? { color: s, opacity: 1, offset: list.length > 1 ? i / (list.length - 1) : 0 } : s);
ui.vgrad = (stops, up = false) => [{ fillColorGradient: { type: 'linear', startX: 0.5, startY: up ? 1 : 0, endX: 0.5, endY: up ? 0 : 1, width: 1, stops: stopsOf(stops) }, fillOpacity: 1 }];
ui.radial = stops => [{ fillColorGradient: { type: 'radial', startX: 0.5, startY: 0.5, endX: 0.5, endY: 1, width: 1, stops: stopsOf(stops) }, fillOpacity: 1 }];
ui.stroke = (c, w, align = 'inner') => [{ strokeColor: c, strokeWidth: w, strokeOpacity: 1, strokeStyle: 'solid', strokeAlignment: align }];
ui.drop = (c, y, blur = 0, spread = 0, op = 1) => ({ style: 'drop-shadow', offsetX: 0, offsetY: y, blur, spread, color: { color: c, opacity: op } });
ui.glow = (c, blur = 36, spread = 4, op = 0.8) => ui.drop(c, 0, blur, spread, op);

ui.screen = (name, x, y, w = ui.W, h = ui.H) => {
  const b = penpot.createBoard();
  b.name = name; b.resize(w, h); b.x = x; b.y = y; b.fills = ui.solid('#1E88E5');
  penpot.root.appendChild(b);
  return b;
};
ui.board = (parent, name, x, y, w, h, fills = [], clip = false) => {
  const b = penpot.createBoard(); parent.appendChild(b);
  b.name = name; b.resize(w, h); b.x = x; b.y = y; b.fills = fills; b.clipContent = clip;
  return b;
};
ui.rect = (parent, name, x, y, w, h, fills = [], radius) => {
  const r = penpot.createRectangle(); parent.appendChild(r);
  r.name = name; r.resize(w, h); r.x = x; r.y = y; r.fills = fills;
  if (radius) r.borderRadius = radius;
  return r;
};
ui.ellipse = (parent, name, cx, cy, d, fills) => {
  const e = penpot.createEllipse(); parent.appendChild(e);
  e.name = name; e.resize(d, d); e.x = cx - d / 2; e.y = cy - d / 2; e.fills = fills;
  return e;
};
ui.text = (parent, name, chars, o) => {
  const t = penpot.createText(chars); parent.appendChild(t);
  t.name = name;
  const f = penpot.fonts.findByName(o.font || ui.FONT);
  f.applyToText(t, f.variants.find(v => v.fontWeight === (o.weight || '400')) || f.variants[0]);
  t.fontSize = String(o.size);
  t.fills = ui.solid(o.color || '#FFFFFF');
  if (o.outline) {
    t.strokes = ui.stroke(o.outline, o.outlineWidth || Math.max(5, Math.round(o.size * 0.08)), 'outer');
    t.shadows = [ui.drop(o.outline, Math.max(3, Math.round(o.size * 0.06)))];
  }
  if (o.shadow) t.shadows = [...(t.shadows || []), ui.drop(o.shadowColor || '#0A2A5E', Math.round(o.size * 0.1), Math.round(o.size * 0.18), 0, 0.5)];
  if (o.w) { t.resize(o.w, Math.round(o.size * 1.3)); t.growType = 'auto-height'; }
  else t.growType = 'auto-width';
  t.align = o.align || 'center';
  t.x = o.x; t.y = o.y;
  return t;
};
ui.centerY = async (shape, top, height) => { await ui.sleep(150); shape.y = top + (height - shape.height) / 2; };

ui.spriteSrc = cardName => {
  const card = penpotUtils.findShape(s => s.name === cardName);
  if (!card) throw new Error('Sprite not found: ' + cardName);
  const img = card.fills?.some(f => f.fillImage) ? card : penpotUtils.findShape(s => s.fills?.some(f => f.fillImage), card);
  const fi = img.fills.find(f => f.fillImage).fillImage;
  return { fills: img.fills, iw: fi.width, ih: fi.height };
};
ui.sprite = (parent, name, src, x, y, w) => ui.rect(parent, name, x, y, w, Math.round(w * src.ih / src.iw), src.fills);
ui.optical = (shape, target, anchor = 'center') => {
  const cx = shape.x + shape.width / 2, cy = shape.y + shape.height / 2, top = shape.y;
  const k = target / Math.sqrt(shape.width * shape.height);
  shape.resize(Math.round(shape.width * k), Math.round(shape.height * k));
  shape.x = cx - shape.width / 2;
  shape.y = anchor === 'top' ? top : cy - shape.height / 2;
  return shape;
};

ui.isGlow = s => s.offsetX === 0 && s.offsetY === 0 && s.blur > 0;
ui.iconGlow = (icon, o = {}) => {
  const color = o.color || '#FFE082', strength = o.strength ?? 0.95;
  const d = Math.round(Math.max(icon.width, icon.height) * (o.scale || 1.9));
  const halo = ui.ellipse(icon.parent, icon.name + ' Glow', icon.x + icon.width / 2, icon.y + icon.height / 2, d,
    ui.radial([{ color: o.core || '#FFF59D', opacity: strength, offset: 0 }, { color, opacity: strength * 0.45, offset: 0.45 }, { color, opacity: 0, offset: 1 }]));
  halo.setParentIndex(icon.parentIndex);
  icon.shadows = [...(icon.shadows || []).filter(s => !ui.isGlow(s)), ui.glow(color, 30, 0, 0.9)];
  return halo;
};
ui.button = async (parent, o) => {
  const c = k => ui.tok(`btn.${o.color}.${k}`);
  const depth = Math.min(22, Math.max(11, Math.round(o.h * 0.08)));
  const radius = o.radius ?? ui.num('radius.button.md');
  const b = ui.board(parent, o.name, o.x, o.y, o.w, o.h);
  b.shadows = [ui.drop('#000000', 8, 14, 0, 0.25)];
  const edge = ui.rect(b, 'Edge', o.x, o.y, o.w, o.h, ui.solid(c('edge')), radius);
  if (o.rim) edge.strokes = ui.stroke(o.rim, ui.num('stroke.panel'), 'outer');
  const face = ui.rect(b, 'Face', o.x, o.y, o.w, o.h - depth, ui.vgrad([c('top'), c('base')]), radius);
  face.strokes = ui.stroke(c('edge'), ui.num('stroke.button'));
  const gp = Math.round(radius * 0.6);
  const gloss = ui.rect(b, 'Gloss', o.x + gp, o.y + 10, o.w - gp * 2, Math.round((o.h - depth) * 0.26), ui.solid('#FFFFFF', 0.3), gp);
  const label = ui.text(b, 'Label', o.label, { size: o.size || ui.num('font.button'), outline: c('outline'), w: o.w, x: o.x, y: o.y });
  for (const s of [edge, face]) { s.constraintsHorizontal = 'leftright'; s.constraintsVertical = 'topbottom'; }
  gloss.constraintsHorizontal = 'leftright'; gloss.constraintsVertical = 'top';
  label.constraintsHorizontal = 'leftright'; label.constraintsVertical = 'center';
  await ui.centerY(label, o.y, o.h - depth);
  return b;
};
ui.fitButtons = async (buttons, fill = 0.68) => {
  const parts = buttons.map(b => ({ b, label: b.children.find(c => c.name === 'Label'), face: b.children.find(c => c.name === 'Face') }));
  for (const p of parts) p.label.growType = 'auto-width';
  await ui.sleep(200);
  const tw = Math.max(...parts.map(p => p.label.width)), th = Math.max(...parts.map(p => p.label.height));
  const w = Math.round(tw / fill), faceH = Math.round(th / (fill * 0.8));
  for (const p of parts) {
    p.b.resize(w, faceH + p.b.height - p.face.height);
    p.label.resize(w, p.label.height); p.label.growType = 'auto-height'; p.label.align = 'center'; p.label.x = p.b.x;
  }
  await ui.sleep(200);
  for (const p of parts) p.label.y = p.face.y + (p.face.height - p.label.height) / 2;
  return { w, h: buttons[0].height };
};
ui.makeVariants = (entries, name) => {
  const mains = entries.map(e => ({ shape: penpot.library.local.createComponent([e.shape]).mainInstance(), properties: e.properties }));
  const cont = penpotUtils.createVariantContainer(mains);
  cont.name = name;
  return cont;
};
ui.variant = (containerName, props) => {
  const cont = penpotUtils.findShape(s => s.name === containerName && s.isVariantContainer?.());
  const v = cont.variants.variantComponents().find(vc => Object.entries(props).every(([k, val]) => vc.variantProps[k] === val));
  if (!v) throw new Error('No variant ' + JSON.stringify(props) + ' in ' + containerName);
  return v.instance();
};

ui.stack = (shapes, top, gap = ui.num('space.lg')) => {
  let y = top;
  for (const s of shapes) { s.y = y; y += s.height + gap; }
  return y - gap;
};
ui.wrap = (frame, contentBottom, pad = ui.num('space.xl')) => {
  const h = Math.round(contentBottom + pad - frame.y);
  frame.resize(frame.width, h);
  if (frame.parent?.type === 'board' && /^Popup$|Popup Panel/.test(frame.parent.name)) frame.parent.resize(frame.parent.width, frame.y - frame.parent.y + h);
  return h;
};
ui.placeHeader = (frame, ribbon, close, overlap = 0.4) => {
  ribbon.x = frame.x + (frame.width - ribbon.width) / 2;
  ribbon.y = frame.y - ribbon.height * overlap;
  if (!close) return;
  const d = Math.round(ribbon.height * 0.75);
  close.resize(d, d);
  close.x = frame.x + frame.width - d / 2;
  close.y = frame.y - d / 2;
};

ui.shade = (parent, name, x, y, w, h, fromTop, color = '#0A2A5E') => {
  const r = ui.rect(parent, name, x, y, w, h, ui.vgrad([{ color, opacity: 0.55, offset: 0 }, { color, opacity: 0.25, offset: 0.35 }, { color, opacity: 0, offset: 1 }], !fromTop));
  r.blocked = true;
  return r;
};
ui.backgroundFX = (screen, p = {}) => {
  const X = screen.x, Y = screen.y, W = screen.width, H = screen.height;
  const fx = ui.board(screen, 'Background FX', X, Y, W, H, ui.vgrad([p.top || '#3FB6F2', p.mid || '#2384E3', p.bottom || '#1556C0']), true);
  ui.ellipse(fx, 'Center Light', X + W / 2, Y + H * 0.49, W * 1.4, ui.radial([{ color: p.light || '#A5E8FF', opacity: 0.55, offset: 0 }, { color: p.light || '#A5E8FF', opacity: 0.2, offset: 0.5 }, { color: p.light || '#A5E8FF', opacity: 0, offset: 1 }]));
  [[0.11, 0.22, 360], [0.89, 0.35, 460], [0.17, 0.64, 420], [0.83, 0.79, 380], [0.52, 0.16, 260]]
    .forEach(([fx_, fy, d], i) => ui.ellipse(fx, 'Bokeh ' + (i + 1), X + W * fx_, Y + H * fy, d, ui.solid('#FFFFFF', 0.06)));
  const step = p.dotStep || 120, dot = p.dotSize || 30;
  for (let r = 0, y = 40; y < H + step; r++, y += step * 0.866)
    for (let x = r % 2 ? step / 2 : 0; x < W + step; x += step) ui.ellipse(fx, 'Dot', X + x, Y + y, dot, ui.solid('#FFFFFF', p.dotOpacity || 0.09));
  fx.blocked = true;
  fx.setParentIndex(0);
  return fx;
};

ui.upper = str => str.replace(/[^\s\-/]+/g, w => /\d/.test(w) ? w : w.toUpperCase());
ui.isUpper = str => ui.upper(str) === str;

storage.ui = ui;
return Object.keys(ui);
