const ui = storage.ui;
if (!ui) throw new Error('Load scripts/helpers.js first');

ui.luma = hex => {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return null;
  const ch = i => { const v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
};
ui.fillHex = s => s.fills?.[0]?.fillColor || s.fills?.[0]?.fillColorGradient?.stops?.[0]?.color;
ui.isClose = b => /Close|^X$|- X$/.test(b.name);
ui.within = (v, lo, hi) => v >= lo && v <= hi;
ui.bottom = s => s.y + s.height;
ui.right = s => s.x + s.width;

ui.measureLabels = async buttons => {
  const parts = buttons.map(b => ({ b, label: b.children.find(c => c.name === 'Label'), face: b.children.find(c => c.name === 'Face') }))
    .filter(p => p.label && p.face && !ui.isClose(p.b) && !p.b.children.some(c => /Icon$/.test(c.name)));
  const saved = parts.map(p => ({ x: p.label.x, w: p.label.width, grow: p.label.growType }));
  for (const p of parts) p.label.growType = 'auto-width';
  await ui.sleep(200);
  for (const p of parts) { p.tw = p.label.width; p.th = p.label.height; }
  parts.forEach((p, i) => {
    p.label.resize(saved[i].w, p.label.height); p.label.growType = saved[i].grow === 'auto-width' ? 'auto-width' : 'auto-height'; p.label.x = saved[i].x;
  });
  await ui.sleep(200);
  return parts;
};

ui.auditLayout = (pop, texts, buttons, art, issues) => {
  const frame = pop.children.find(c => c.name === 'Frame');
  if (!frame) return issues.push(`Popup "${pop.name}" thiếu rect "Frame"`);
  const ribbon = pop.children.find(c => /Title Ribbon|Banner/.test(c.name));
  const close = buttons.find(ui.isClose);
  if (ribbon) {
    if (Math.abs(ribbon.x + ribbon.width / 2 - (frame.x + frame.width / 2)) > 4) issues.push(`Popup "${pop.name}": Title Ribbon phải căn giữa trục dọc của Frame (luật 18)`);
    const above = (frame.y - ribbon.y) / ribbon.height;
    if (!ui.within(above, 0.3, 0.55)) issues.push(`Popup "${pop.name}": Title Ribbon phải đè lên mép trên Frame, phần nhô lên 1/3–1/2 chiều cao ribbon (đang ${Math.round(above * 100)}%, luật 18)`);
  }
  if (close) {
    const cx = close.x + close.width / 2;
    const onFrame = Math.abs(cx - ui.right(frame)) <= 8, onRibbon = ribbon && Math.abs(cx - ui.right(ribbon)) <= 8;
    if (!onFrame && !onRibbon) issues.push(`Nút "${close.name}": tâm phải gióng với mép phải Frame hoặc Title Ribbon (luật 18)`);
    if (ribbon && !ui.within(close.height / ribbon.height, 0.68, 0.82)) issues.push(`Nút "${close.name}" phải cao 70–80% Title Ribbon (đang ${Math.round(close.height / ribbon.height * 100)}%, luật 18)`);
  }
  const cf = pop.children.find(c => /Content Frame/.test(c.name));
  if (art.length && !cf) issues.push(`Popup "${pop.name}": ảnh minh hoạ phải nằm trong "Content Frame" nền nhạt (luật 19)`);
  if (cf) {
    const l = cf.x - frame.x, r = ui.right(frame) - ui.right(cf);
    if (Math.abs(l - r) > 4 || !ui.within(l, 50, 69)) issues.push(`Popup "${pop.name}": padding Frame → Content Frame phải đều hai bên, 54–65px (đang ${Math.round(l)}/${Math.round(r)}, luật 15)`);
    const dr = (frame.borderRadius || 0) - (cf.borderRadius || 0);
    if (!ui.within(dr, 10, 23)) issues.push(`Popup "${pop.name}": Content Frame phải bo góc nhỏ hơn Frame 11–22px (đang chênh ${dr}, luật 15)`);
    const cl = ui.luma(ui.fillHex(cf)), fl = ui.luma(ui.fillHex(frame));
    if (cl !== null && fl !== null && cl <= fl) issues.push(`Popup "${pop.name}": Content Frame phải có nền nhạt hơn Frame (luật 19)`);
    for (const a of art) {
      const ax = a.x + a.width / 2, ay = a.y + a.height / 2;
      if (ax < cf.x || ax > ui.right(cf) || ay < cf.y || ay > ui.bottom(cf)) issues.push(`"${a.name}" phải nằm trong Content Frame (luật 19)`);
    }
  }
  const desc = texts.find(t => /Desc/.test(t.name));
  const actions = buttons.filter(b => !ui.isClose(b));
  if (cf && desc && desc.y < ui.bottom(cf)) issues.push(`Popup "${pop.name}": Description phải nằm ngay dưới Content Frame (luật 19)`);
  if (desc && actions.some(b => b.y < ui.bottom(desc))) issues.push(`Popup "${pop.name}": nút hành động phải nằm dưới Description (Ảnh → Chữ → Nút, luật 19)`);
  const stack = [cf, desc, ...actions].filter(Boolean).sort((a, b) => a.y - b.y);
  for (let i = 1; i < stack.length; i++) {
    const a = stack[i - 1], b = stack[i], gap = b.y - ui.bottom(a);
    const overlapX = b.x < ui.right(a) && ui.right(b) > a.x;
    if (overlapX && gap > -1 && !ui.within(gap, 28, 58)) issues.push(`Khoảng cách "${a.name}" → "${b.name}" là ${Math.round(gap)}px, phải 32–54px (luật 15)`);
  }
  if (stack.length) {
    const dead = ui.bottom(frame) - Math.max(...stack.map(ui.bottom));
    if (dead > ui.num('space.xl') + 24) issues.push(`Popup "${pop.name}" thừa ${Math.round(dead)}px trống ở đáy, co Frame theo nội dung bằng ui.wrap (luật 15)`);
  }
};

ui.auditPopup = (pop, screen, issues) => {
  const colors = penpotUtils.findShapes(s => s.name === 'Face', pop).map(f => f.fills?.[0]?.fillColorGradient?.stops?.[1]?.color || f.fills?.[0]?.fillColor);
  const dup = colors.filter((c, i) => colors.indexOf(c) !== i);
  if (dup.length) issues.push(`Popup "${pop.name}" có nút trùng màu: ${[...new Set(dup)].join(', ')}`);

  const buttons = penpotUtils.findShapes(s => s.children?.some(c => c.name === 'Face'), pop);
  const inButton = new Set(buttons.flatMap(b => [b, ...penpotUtils.findShapes(() => true, b)]).map(s => s.id));
  const content = penpotUtils.findShapes(s => !s.hidden && !inButton.has(s.id), pop);
  const texts = content.filter(s => s.type === 'text');

  const levels = new Set(texts.map(t => Number(t.fontSize)));
  if (levels.size > 3) issues.push(`Popup "${pop.name}" có ${levels.size} cấp chữ (${[...levels].join('/')}px), tối đa 3 (luật 14)`);
  const title = texts.find(t => /Title/.test(t.name)), desc = texts.find(t => /Desc/.test(t.name));
  if (title && !ui.isUpper(title.characters)) issues.push(`Title phải viết IN HOA (luật 16): "${title.characters}"`);
  if (title && desc && title.y > desc.y) issues.push(`Popup "${pop.name}": Title phải nằm trên Description (luật 14)`);
  if (title) {
    const ts = Number(title.fontSize);
    if (desc && !ui.within(Number(desc.fontSize) / ts, 0.58, 0.72)) issues.push(`Description phải bằng 60–70% cỡ Title (đang ${desc.fontSize}/${ts}, luật 16)`);
    for (const b of buttons.filter(b => !ui.isClose(b))) {
      const label = b.children.find(c => c.name === 'Label');
      if (label && !ui.within(Number(label.fontSize) / ts, 0.88, 0.97)) issues.push(`Chữ nút "${b.name}" phải bằng 90–95% cỡ Title (đang ${label.fontSize}/${ts}, luật 16)`);
    }
  }
  if (desc && Math.round(desc.height / (Number(desc.fontSize) * (Number(desc.lineHeight) || 1.2))) > 2) issues.push(`Description quá 2 dòng (luật 16): "${desc.characters}"`);

  const chars = texts.reduce((n, t) => n + t.characters.length, 0);
  if (chars > 90) issues.push(`Popup "${pop.name}" nhiều chữ (${chars} ký tự), thay bằng icon/ảnh minh hoạ (luật 11)`);
  const art = content.filter(s => s.type !== 'text' && /Icon$|Illustration|Reward/.test(s.name) && !/Glow$/.test(s.name));
  const textHeight = texts.reduce((n, t) => n + t.height, 0);
  if (!art.length) issues.push(`Popup "${pop.name}" không có icon/ảnh minh hoạ (luật 11)`);
  else if (Math.max(...art.map(s => s.height)) < textHeight) issues.push(`Popup "${pop.name}": ảnh minh hoạ thấp hơn tổng chiều cao chữ, chưa đủ nổi bật (luật 11)`);

  const thumbLine = screen.y + screen.height * 0.45;
  if (pop.y + pop.height / 2 < thumbLine) issues.push(`Popup "${pop.name}" đặt quá cao, tâm phải ở giữa hoặc thấp hơn giữa màn (luật 13)`);
  for (const b of buttons.filter(b => !ui.isClose(b)))
    if (b.y + b.height / 2 < thumbLine) issues.push(`Nút "${b.name}" nằm nửa trên màn, khó với ngón cái (luật 13)`);

  ui.auditLayout(pop, texts, buttons, art, issues);
};

ui.auditText = (s, issues) => {
  if (Number(s.fontSize) < ui.num('font.min')) issues.push(`Chữ quá nhỏ (${s.fontSize}px): "${s.characters}"`);
  const face = s.parent?.children?.find(c => c.name === 'Face');
  const isHeader = !face && Number(s.fontSize) >= ui.num('font.title');
  const softShadow = (s.shadows || []).some(x => x.offsetY !== 0 && x.blur > 0);
  const underlay = (s.shadows || []).some(x => x.offsetY > 0 && !x.blur);
  if (!isHeader && softShadow) issues.push(`Chữ có shadow mềm nhưng không phải header lớn (luật 12): "${s.characters}"`);
  if (!isHeader && (!s.strokes?.length || !underlay)) issues.push(`Chữ thiếu outline hoặc underlay (luật 3, 12): "${s.characters}"`);
  const fl = ui.luma(ui.fillHex(s)), stroke = s.strokes?.[0];
  if (fl !== null && fl > 0.45) {
    const sl = ui.luma(stroke?.strokeColor);
    if (!stroke || (sl !== null && sl > 0.25)) issues.push(`Chữ sáng phải có viền đậm tối màu (luật 16): "${s.characters}"`);
    else if (stroke.strokeWidth < 5) issues.push(`Viền chữ mỏng hơn 5px (luật 16): "${s.characters}"`);
  }
  if (face) {
    const offX = Math.abs(s.x + s.width / 2 - (face.x + face.width / 2)), offY = Math.abs(s.y + s.height / 2 - (face.y + face.height / 2));
    if (s.align !== 'center' || offX > 4 || offY > 6) issues.push(`Chữ trong nút không căn giữa (luật 17, lệch ${Math.round(offX)}/${Math.round(offY)}px): "${s.characters}"`);
    if (!ui.isUpper(s.characters)) issues.push(`Chữ trong nút phải viết IN HOA (luật 16): "${s.characters}"`);
  }
};

ui.audit = async screen => {
  const issues = [], top = screen.y + ui.num('safe.top'), bottom = screen.y + screen.height - ui.num('safe.bottom');
  const all = penpotUtils.findShapes(() => true, screen).filter(s => !s.hidden);
  const measured = await ui.measureLabels(all.filter(s => s.children?.some(c => c.name === 'Face')));
  for (const p of measured) {
    const rw = p.tw / p.face.width, rh = p.th / p.face.height;
    if (!ui.within(rw, 0.57, 0.78) || !ui.within(rh, 0.47, 0.63)) issues.push(`Chữ nút "${p.b.name}" chiếm ${Math.round(rw * 100)}% ngang / ${Math.round(rh * 100)}% cao, phải 60–75% / 50–60% (luật 17, chỉnh bằng ui.fitButtons)`);
  }
  const fonts = new Set(all.filter(s => s.type === 'text').map(s => s.fontFamily).filter(f => typeof f === 'string'));
  if (fonts.size > 1) issues.push(`Dùng ${fonts.size} font (${[...fonts].join(', ')}), chỉ được 1 (luật 16)`);
  for (const s of all) {
    if (s.type === 'text') ui.auditText(s, issues);
    if (/Button|Btn|^Tab - /.test(s.name) || s.children?.some(c => c.name === 'Face')) {
      const glowing = [s, ...penpotUtils.findShapes(() => true, s)].filter(x => !/Badge|Dot|Notify/.test(x.name) && x.shadows?.some(ui.isGlow));
      if (glowing.length) issues.push(`Nút có glow (luật 9, nút phải rõ ràng): ${s.name} → ${glowing.map(x => x.name).join(', ')}`);
    }
    const interactive = s.type === 'text' || /Icon|Button|Btn/.test(s.name);
    if (interactive && (s.y < top || s.y + s.height > bottom)) issues.push(`Nằm trong vùng an toàn: ${s.name}`);
  }
  for (const pop of all.filter(s => s.type === 'board' && /^Popup$|Popup Panel/.test(s.name))) ui.auditPopup(pop, screen, issues);
  const icons = all.filter(s => / Icon$/.test(s.name) && s.type !== 'text').map(s => `${s.name}: ${Math.round(Math.sqrt(s.width * s.height))}`);
  return { issues, iconOpticalSizes: icons };
};

return ['audit', 'auditPopup', 'auditLayout', 'auditText', 'measureLabels', 'luma'];
