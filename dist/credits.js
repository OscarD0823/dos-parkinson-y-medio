'use strict';
(() => {
  const text = 'Fanfic: Nicole_Winkel';

  function paint(context, width, height) {
    const size = Math.max(12, Math.round(width * .016));
    const padding = Math.max(4, Math.round(width * .006));
    const margin = Math.max(6, Math.round(width * .012));
    context.save();
    context.font = `500 ${size}px Arial, sans-serif`;
    const boxWidth = Math.ceil(context.measureText(text).width) + padding * 2;
    const boxHeight = size + padding * 2;
    const x = width - margin - boxWidth, y = height - margin - boxHeight;
    context.fillStyle = 'rgba(255,252,242,.84)';
    context.fillRect(x, y, boxWidth, boxHeight);
    context.fillStyle = '#415343';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(text, x + padding, y + boxHeight / 2 + .5);
    context.restore();
  }

  async function download(source, filename) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', {alpha: false});
    if (!context) throw new Error('No se pudo preparar la imagen.');
    context.drawImage(image, 0, 0);
    paint(context, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo guardar la imagen.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\.[^.]+$/, '') + '-Nicole_Winkel.png';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  window.ComicCredits = Object.freeze({text, paint, download});
})();
