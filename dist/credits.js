'use strict';
(() => {
  const text = 'Fanfic: Nicole_Winkel';
  const footerHeight = width => Math.max(30, Math.round(width * .034));
  let menu, menuImage, returnFocus, hoveredImage, status, statusTimer;

  function paint(context, width, height) {
    const size = Math.max(12, Math.round(width * .014));
    const margin = Math.max(10, Math.round(width * .016));
    const footer = footerHeight(width);
    context.save();
    context.font = `500 ${size}px Arial, sans-serif`;
    context.fillStyle = '#faf7ef';
    context.fillRect(0, height - footer, width, footer);
    context.fillStyle = '#5c645b';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(text, width - margin, height - footer / 2);
    context.restore();
  }

  async function exportedBlob(source) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = source instanceof HTMLImageElement ? source.currentSrc || source.src : source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight + footerHeight(image.naturalWidth);
    const context = canvas.getContext('2d', {alpha: false});
    if (!context) throw new Error('No se pudo preparar la imagen.');
    context.drawImage(image, 0, 0);
    paint(context, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No se pudo guardar la imagen.');
    return blob;
  }

  async function download(source, filename) {
    const blob = await exportedBlob(source);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\.[^.]+$/, '') + '-Nicole_Winkel.png';
    (document.querySelector('dialog[open]') || document.body).append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function copy(source) {
    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      throw new Error('Usa «Guardar imagen» para obtener la copia con el crédito.');
    }
    const item = new ClipboardItem({'image/png': exportedBlob(source)});
    await navigator.clipboard.write([item]);
  }

  function announce(message) {
    if (!status) {
      status = document.createElement('div');
      status.className = 'image-export-status';
      status.setAttribute('role', 'status');
      document.body.append(status);
    }
    clearTimeout(statusTimer);
    (document.querySelector('dialog[open]') || document.body).append(status);
    status.textContent = message;
    status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 5000);
  }

  function closeMenu(restoreFocus = false) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menuImage = null;
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
  }

  async function menuAction(action) {
    const image = menuImage;
    closeMenu(true);
    if (!image) return;
    try {
      if (action === 'copy') {
        await copy(image);
        announce('Imagen copiada con el crédito de Nicole_Winkel.');
      } else {
        const filename = new URL(image.currentSrc || image.src).pathname.split('/').pop();
        await download(image, filename);
        announce('Imagen guardada con el crédito de Nicole_Winkel.');
      }
    } catch {
      announce('No se pudo copiar o guardar. Prueba el botón «Guardar imagen».');
    }
  }

  function openMenu(event, image) {
    if (!image.complete || !image.naturalWidth) return;
    event.preventDefault();
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'image-export-menu';
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Opciones de la imagen');
      for (const [action, label] of [['copy', 'Copiar imagen'], ['download', 'Guardar imagen']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.textContent = label;
        button.addEventListener('click', () => menuAction(action));
        menu.append(button);
      }
      menu.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Escape' || event.key === 'Tab') {
          closeMenu(true);
          if (event.key === 'Escape') event.preventDefault();
        }
        const buttons = Array.from(menu.children);
        const currentIndex = buttons.indexOf(document.activeElement);
        const nextIndex = {
          ArrowDown: (currentIndex + 1) % buttons.length,
          ArrowUp: (currentIndex - 1 + buttons.length) % buttons.length,
          Home: 0,
          End: buttons.length - 1
        }[event.key];
        if (nextIndex !== undefined) {
          event.preventDefault();
          buttons[nextIndex].focus();
        }
      });
      document.body.append(menu);
    }
    menuImage = image;
    returnFocus = document.activeElement;
    // Un diálogo modal solo permite interacción con sus propios descendientes.
    const modal = image.closest('dialog[open]');
    (modal || document.body).append(menu);
    menu.hidden = false;
    const rect = image.getBoundingClientRect();
    const x = event.clientX || rect.left + Math.min(40, rect.width / 2);
    const y = event.clientY || rect.top + Math.min(40, rect.height / 2);
    const bounds = modal?.getBoundingClientRect() || {left: 0, top: 0, right: innerWidth, bottom: innerHeight};
    menu.style.left = `${Math.max(bounds.left + 8, Math.min(x, bounds.right - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(bounds.top + 8, Math.min(y, bounds.bottom - menu.offsetHeight - 8))}px`;
    menu.firstElementChild.focus({preventScroll: true});
  }

  function bindImage(image) {
    const host = image.closest('.comic-image-frame, .cover-book, #zoom-dialog') || image;
    image.draggable = false;
    host.addEventListener('contextmenu', event => openMenu(event, image));
    host.addEventListener('pointerenter', () => { hoveredImage = image; });
    host.addEventListener('pointerleave', () => { if (hoveredImage === image) hoveredImage = null; });
  }

  document.addEventListener('pointerdown', event => {
    if (menu && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('copy', event => {
    const active = document.activeElement;
    if (document.getSelection()?.toString() || active?.closest('input, textarea, [contenteditable="true"]')) return;
    const focusedImage = active?.closest('.comic-image-button, .zoom-sheet, .cover-book')?.querySelector('img');
    const zoomImage = active?.closest('#zoom-dialog[open]')?.querySelector('#zoom-image');
    const image = menuImage || zoomImage || focusedImage || hoveredImage;
    if (!image?.isConnected || !image.complete || !image.naturalWidth) return;
    event.preventDefault();
    copy(image).then(
      () => announce('Imagen copiada con el crédito de Nicole_Winkel.'),
      () => announce('No se pudo copiar. Usa «Guardar imagen».')
    );
  });

  window.ComicCredits = Object.freeze({text, paint, download, copy, bindImage});
})();
