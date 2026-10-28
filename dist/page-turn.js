'use strict';
(() => {
  function clipPage(points, nx, ny, crease, front) {
    const clipped = [], sign = front ? 1 : -1;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const da = nx * a.x + ny * a.y - crease;
      const db = nx * b.x + ny * b.y - crease;
      const insideA = sign * da <= 0, insideB = sign * db <= 0;
      if (insideA) clipped.push(a);
      if (insideA !== insideB) {
        const amount = da / (da - db);
        clipped.push({x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount});
      }
    }
    return clipped;
  }

  function trace(context, points) {
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.closePath();
  }

  function capture(image) {
    if (!image?.complete || !image.naturalWidth) return null;
    const source = document.createElement('canvas');
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    source.width = Math.round(image.naturalWidth * scale);
    source.height = Math.round(image.naturalHeight * scale);
    const context = source.getContext('2d', {alpha: false});
    if (!context) return null;
    context.drawImage(image, 0, 0, source.width, source.height);
    return source;
  }

  // Both faces share one crease. Reflection keeps every point on the sheet connected.
  function paint(context, source, width, height, progress, direction = 1) {
    context.clearRect(0, 0, width, height);
    const t = Math.max(0, Math.min(1, progress));
    if (t >= 1) return;
    if (t <= 0) { context.drawImage(source, 0, 0, width, height); return; }

    const creaseX = width * (1 - 1.06 * t);
    const tilt = Math.sin(Math.PI * t) * .04;
    const nx = Math.cos(tilt) * (direction > 0 ? 1 : -1), ny = Math.sin(tilt);
    const cx = direction > 0 ? creaseX : width - creaseX, cy = height / 2;
    const crease = nx * cx + ny * cy;
    const page = [{x: 0, y: 0}, {x: width, y: 0}, {x: width, y: height}, {x: 0, y: height}];
    const front = clipPage(page, nx, ny, crease, true);
    const folded = clipPage(page, nx, ny, crease, false);
    const back = folded.map(point => {
      const distance = 2 * (nx * point.x + ny * point.y - crease);
      return {x: point.x - distance * nx, y: point.y - distance * ny};
    });
    const band = Math.min(width * .13, 100);
    const strength = Math.min(1, Math.sin(Math.PI * t) * 3);

    // The moving sheet casts a soft shadow on the page underneath it.
    context.save();
    trace(context, folded); context.clip();
    const cast = context.createLinearGradient(cx, cy, cx + nx * band * 1.5, cy + ny * band * 1.5);
    cast.addColorStop(0, `rgba(0,0,0,${.26 * strength})`);
    cast.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = cast; context.fillRect(0, 0, width, height);
    context.restore();

    context.save();
    trace(context, front); context.clip();
    context.drawImage(source, 0, 0, width, height);
    const curve = context.createLinearGradient(cx - nx * band, cy - ny * band, cx, cy);
    curve.addColorStop(0, 'rgba(0,0,0,0)');
    curve.addColorStop(.55, `rgba(255,255,255,${.12 * strength})`);
    curve.addColorStop(1, `rgba(0,0,0,${.2 * strength})`);
    context.fillStyle = curve; context.fillRect(0, 0, width, height);
    context.restore();

    if (back.length >= 3) {
      context.save();
      trace(context, back);
      context.shadowColor = `rgba(0,0,0,${.24 * strength})`;
      context.shadowBlur = band * .35;
      context.shadowOffsetX = -nx * band * .08;
      context.fillStyle = '#eee3cf'; context.fill();
      context.restore();

      context.save();
      trace(context, back); context.clip();
      const paper = context.createLinearGradient(cx - nx * band * 2, cy - ny * band * 2, cx, cy);
      paper.addColorStop(0, '#e8dcc5'); paper.addColorStop(.55, '#f6eddd'); paper.addColorStop(1, '#c8b89c');
      context.fillStyle = paper; context.fillRect(0, 0, width, height);
      context.transform(1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * crease * nx, 2 * crease * ny);
      context.globalAlpha = .045;
      context.drawImage(source, 0, 0, width, height);
      context.restore();
    }
  }

  function animate({source, target, host, direction}) {
    const bounds = target.getBoundingClientRect(), box = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const sheet = document.createElement('canvas');
    sheet.className = 'page-turn-sheet'; sheet.setAttribute('aria-hidden', 'true');
    const scale = Math.min(devicePixelRatio || 1, 1.5, 1800 / Math.max(bounds.width, bounds.height));
    sheet.width = Math.ceil(bounds.width * scale); sheet.height = Math.ceil(bounds.height * scale);
    sheet.style.width = `${bounds.width}px`; sheet.style.height = `${bounds.height}px`;
    sheet.style.left = `${bounds.left - box.left + host.scrollLeft - host.clientLeft}px`;
    sheet.style.top = `${bounds.top - box.top + host.scrollTop - host.clientTop}px`;
    const context = sheet.getContext('2d');
    if (!context) return null;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.imageSmoothingQuality = 'medium';
    paint(context, source, bounds.width, bounds.height, 0, direction);
    host.append(sheet);

    let frame, startTime, done = false, resolve;
    const finished = new Promise(complete => { resolve = complete; });
    const finish = () => {
      if (done) return;
      done = true; cancelAnimationFrame(frame); sheet.remove();
      window.removeEventListener('resize', finish); resolve();
    };
    const tick = time => {
      if (done) return;
      startTime ??= time;
      const elapsed = Math.min(1, (time - startTime) / 760);
      const progress = elapsed * elapsed * (3 - 2 * elapsed);
      paint(context, source, bounds.width, bounds.height, progress, direction);
      if (elapsed < 1) frame = requestAnimationFrame(tick); else finish();
    };
    const start = () => { if (!done) frame = requestAnimationFrame(tick); };
    const nextImage = target.tagName === 'IMG' ? target : target.querySelector('img');
    if (!nextImage || (nextImage.complete && nextImage.naturalWidth)) start();
    else if (nextImage.decode) nextImage.decode().then(start, finish);
    else { nextImage.addEventListener('load', start, {once: true}); nextImage.addEventListener('error', finish, {once: true}); }
    window.addEventListener('resize', finish, {once: true});
    return {cancel: finish, finished};
  }

  window.ComicPageTurn = Object.freeze({capture, paint, animate});
})();
