// ===== COLOR CONVERSION UTILITIES =====

/**
 * Color conversion utilities for hex, rgb, and hsl formats
 */
class ColorUtils {
  // Convert hex to RGB
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Convert RGB to hex
  static rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Convert RGB to HSL
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // Convert HSL to RGB
  static hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // Calculate relative luminance
  static relativeLuminance(r, g, b) {
    const sRgb = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRgb[0] + 0.7152 * sRgb[1] + 0.0722 * sRgb[2];
  }

  // Calculate contrast ratio
  static contrastRatio(rgb1, rgb2) {
    const l1 = this.relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Generate color harmonies
  static generateHarmonies(hsl, type) {
    const { h, s, l } = hsl;
    const harmonies = [];

    switch (type) {
      case 'complementary':
        harmonies.push(
          { h, s, l },
          { h: (h + 180) % 360, s, l }
        );
        break;
      case 'analogous':
        harmonies.push(
          { h: (h - 30 + 360) % 360, s, l },
          { h: (h - 15 + 360) % 360, s, l },
          { h, s, l },
          { h: (h + 15) % 360, s, l },
          { h: (h + 30) % 360, s, l }
        );
        break;
      case 'triadic':
        harmonies.push(
          { h, s, l },
          { h: (h + 120) % 360, s, l },
          { h: (h + 240) % 360, s, l }
        );
        break;
      case 'tetradic':
        harmonies.push(
          { h, s, l },
          { h: (h + 90) % 360, s, l },
          { h: (h + 180) % 360, s, l },
          { h: (h + 270) % 360, s, l }
        );
        break;
    }

    return harmonies.map(hslColor => {
      const rgb = this.hslToRgb(hslColor.h, hslColor.s, hslColor.l);
      return {
        hex: this.rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb,
        hsl: hslColor
      };
    });
  }
}

// ===== MAIN COLOR PICKER CLASS =====

class ColorPicker {
  constructor() {
    this.currentColor = { r: 79, g: 70, b: 229 }; // Default #4F46E5
    this.currentAlpha = 1;
    this.isDragging = false;
    this.savedPalettes = this.loadPalettes();
    
    this.initializeElements();
    this.setupEventListeners();
    this.setupTheme();
    this.setupColorField();
    this.updateColor();
    this.renderSavedPalettes();
    this.checkEyeDropperSupport();
  }

  initializeElements() {
    // Color picker elements
    this.colorField = document.getElementById('colorField');
    this.fieldCursor = document.getElementById('fieldCursor');
    this.hueSlider = document.getElementById('hueSlider');
    this.alphaSlider = document.getElementById('alphaSlider');
    
    // Preview elements
    this.colorSwatch = document.getElementById('colorSwatch');
    this.contrastWhite = document.getElementById('contrastWhite');
    this.contrastBlack = document.getElementById('contrastBlack');
    
    // Input elements
    this.hexInput = document.getElementById('hexInput');
    this.rgbInputs = {
      r: document.getElementById('rgbR'),
      g: document.getElementById('rgbG'),
      b: document.getElementById('rgbB')
    };
    this.hslInputs = {
      h: document.getElementById('hslH'),
      s: document.getElementById('hslS'),
      l: document.getElementById('hslL')
    };
    
    // Contrast elements
    this.whiteRatio = document.getElementById('whiteRatio');
    this.blackRatio = document.getElementById('blackRatio');
    this.whiteWcag = document.getElementById('whiteWcag');
    this.blackWcag = document.getElementById('blackWcag');
    
    // Harmony elements
    this.harmonyPreview = document.getElementById('harmonyPreview');
    this.harmonyBtns = document.querySelectorAll('.harmony-btn');
    
    // Palette elements
    this.paletteNameInput = document.getElementById('paletteNameInput');
    this.savePaletteBtn = document.getElementById('savePaletteBtn');
    this.importPaletteBtn = document.getElementById('importPaletteBtn');
    this.exportPalettesBtn = document.getElementById('exportPalettesBtn');
    this.importPaletteFile = document.getElementById('importPaletteFile');
    this.savedPalettes = document.getElementById('savedPalettes');
    
    // Theme toggle
    this.themeToggle = document.querySelector('.theme-toggle');
    this.themeIcon = document.querySelector('.theme-icon');
    
    // EyeDropper
    this.eyedropperBtn = document.getElementById('eyedropperBtn');
    this.eyedropperNote = document.getElementById('eyedropperNote');
    
    // Toast container
    this.toastContainer = document.getElementById('toastContainer');
  }

  setupEventListeners() {
    // Color field interactions
    this.colorField.addEventListener('mousedown', this.startFieldDrag.bind(this));
    this.colorField.addEventListener('touchstart', this.startFieldDrag.bind(this), { passive: false });
    document.addEventListener('mousemove', this.handleFieldDrag.bind(this));
    document.addEventListener('touchmove', this.handleFieldDrag.bind(this), { passive: false });
    document.addEventListener('mouseup', this.stopFieldDrag.bind(this));
    document.addEventListener('touchend', this.stopFieldDrag.bind(this));
    
    // Keyboard support for color field
    this.colorField.addEventListener('keydown', this.handleFieldKeydown.bind(this));
    
    // Slider changes
    this.hueSlider.addEventListener('input', this.handleHueChange.bind(this));
    this.alphaSlider.addEventListener('input', this.handleAlphaChange.bind(this));
    
    // Input changes with throttling
    this.hexInput.addEventListener('input', this.throttle(this.handleHexChange.bind(this), 100));
    
    Object.values(this.rgbInputs).forEach(input => {
      input.addEventListener('input', this.throttle(this.handleRgbChange.bind(this), 100));
    });
    
    Object.values(this.hslInputs).forEach(input => {
      input.addEventListener('input', this.throttle(this.handleHslChange.bind(this), 100));
    });
    
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', this.handleCopy.bind(this));
    });
    
    // Theme toggle
    this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    
    // EyeDropper
    this.eyedropperBtn.addEventListener('click', this.handleEyeDropper.bind(this));
    
    // Harmony buttons
    this.harmonyBtns.forEach(btn => {
      btn.addEventListener('click', this.handleHarmonySelect.bind(this));
    });
    
    // Palette functionality
    this.savePaletteBtn.addEventListener('click', this.savePalette.bind(this));
    this.importPaletteBtn.addEventListener('click', () => this.importPaletteFile.click());
    this.importPaletteFile.addEventListener('change', this.handleImportPalette.bind(this));
    this.exportPalettesBtn.addEventListener('click', this.exportPalettes.bind(this));
  }

  setupColorField() {
    const ctx = this.colorField.getContext('2d');
    const width = this.colorField.width;
    const height = this.colorField.height;
    
    this.updateColorField(258); // Default hue
  }

  updateColorField(hue) {
    const ctx = this.colorField.getContext('2d');
    const width = this.colorField.width;
    const height = this.colorField.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create saturation gradient (left to right)
    const satGradient = ctx.createLinearGradient(0, 0, width, 0);
    satGradient.addColorStop(0, 'white');
    satGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    
    ctx.fillStyle = satGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create lightness gradient (top to bottom)
    const lightGradient = ctx.createLinearGradient(0, 0, 0, height);
    lightGradient.addColorStop(0, 'transparent');
    lightGradient.addColorStop(1, 'black');
    
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, width, height);
  }

  startFieldDrag(e) {
    e.preventDefault();
    this.isDragging = true;
    this.handleFieldDrag(e);
    this.colorField.focus();
  }

  handleFieldDrag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const rect = this.colorField.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    
    const saturation = Math.round((x / rect.width) * 100);
    const lightness = Math.round(100 - (y / rect.height) * 100);
    const hue = parseInt(this.hueSlider.value);
    
    // Update cursor position
    this.fieldCursor.style.left = `${x}px`;
    this.fieldCursor.style.top = `${y}px`;
    
    // Convert HSL to RGB
    const rgb = ColorUtils.hslToRgb(hue, saturation, lightness);
    this.currentColor = rgb;
    
    this.updateColor();
  }

  stopFieldDrag() {
    this.isDragging = false;
  }

  handleFieldKeydown(e) {
    const step = e.shiftKey ? 10 : 1;
    let saturation = parseInt(this.hslInputs.s.value);
    let lightness = parseInt(this.hslInputs.l.value);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        saturation = Math.max(0, saturation - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        saturation = Math.min(100, saturation + step);
        break;
      case 'ArrowUp':
        e.preventDefault();
        lightness = Math.min(100, lightness + step);
        break;
      case 'ArrowDown':
        e.preventDefault();
        lightness = Math.max(0, lightness - step);
        break;
      default:
        return;
    }
    
    const hue = parseInt(this.hueSlider.value);
    const rgb = ColorUtils.hslToRgb(hue, saturation, lightness);
    this.currentColor = rgb;
    this.updateColor();
  }

  handleHueChange() {
    const hue = parseInt(this.hueSlider.value);
    this.updateColorField(hue);
    
    const saturation = parseInt(this.hslInputs.s.value);
    const lightness = parseInt(this.hslInputs.l.value);
    
    const rgb = ColorUtils.hslToRgb(hue, saturation, lightness);
    this.currentColor = rgb;
    this.updateColor();
  }

  handleAlphaChange() {
    this.currentAlpha = parseFloat(this.alphaSlider.value);
    this.updateColor();
  }

  handleHexChange() {
    const hex = this.hexInput.value;
    const rgb = ColorUtils.hexToRgb(hex);
    if (rgb) {
      this.currentColor = rgb;
      this.updateColor(false, true, true); // Don't update hex input to avoid cursor jumping
    }
  }

  handleRgbChange() {
    const r = parseInt(this.rgbInputs.r.value) || 0;
    const g = parseInt(this.rgbInputs.g.value) || 0;
    const b = parseInt(this.rgbInputs.b.value) || 0;
    
    this.currentColor = { r, g, b };
    this.updateColor(true, false, true);
  }

  handleHslChange() {
    const h = parseInt(this.hslInputs.h.value) || 0;
    const s = parseInt(this.hslInputs.s.value) || 0;
    const l = parseInt(this.hslInputs.l.value) || 0;
    
    const rgb = ColorUtils.hslToRgb(h, s, l);
    this.currentColor = rgb;
    this.updateColor(true, true, false);
  }

  updateColor(updateHex = true, updateRgb = true, updateHsl = true) {
    const { r, g, b } = this.currentColor;
    const hex = ColorUtils.rgbToHex(r, g, b);
    const hsl = ColorUtils.rgbToHsl(r, g, b);
    
    // Update visual elements
    const rgba = `rgba(${r}, ${g}, ${b}, ${this.currentAlpha})`;
    this.colorSwatch.style.background = rgba;
    this.contrastWhite.style.color = hex;
    this.contrastBlack.style.color = hex;
    
    // Update inputs
    if (updateHex) {
      this.hexInput.value = hex;
    }
    
    if (updateRgb) {
      this.rgbInputs.r.value = r;
      this.rgbInputs.g.value = g;
      this.rgbInputs.b.value = b;
    }
    
    if (updateHsl) {
      this.hslInputs.h.value = hsl.h;
      this.hslInputs.s.value = hsl.s;
      this.hslInputs.l.value = hsl.l;
    }
    
    // Update sliders
    this.hueSlider.value = hsl.h;
    this.updateColorField(hsl.h);
    
    // Update cursor position
    const fieldRect = this.colorField.getBoundingClientRect();
    const x = (hsl.s / 100) * this.colorField.width;
    const y = ((100 - hsl.l) / 100) * this.colorField.height;
    this.fieldCursor.style.left = `${x}px`;
    this.fieldCursor.style.top = `${y}px`;
    
    // Update alpha slider background
    this.updateAlphaSlider();
    
    // Update contrast ratios
    this.updateContrastInfo();
  }

  updateAlphaSlider() {
    const { r, g, b } = this.currentColor;
    const hex = ColorUtils.rgbToHex(r, g, b);
    const gradient = `linear-gradient(to right, transparent, ${hex})`;
    this.alphaSlider.style.background = `
      linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%),
      ${gradient}
    `;
  }

  updateContrastInfo() {
    const currentRgb = this.currentColor;
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    
    const whiteContrast = ColorUtils.contrastRatio(currentRgb, white);
    const blackContrast = ColorUtils.contrastRatio(currentRgb, black);
    
    this.whiteRatio.textContent = `${whiteContrast.toFixed(1)}:1`;
    this.blackRatio.textContent = `${blackContrast.toFixed(1)}:1`;
    
    // WCAG compliance
    this.updateWcagBadge(this.whiteWcag, whiteContrast);
    this.updateWcagBadge(this.blackWcag, blackContrast);
  }

  updateWcagBadge(element, ratio) {
    element.className = 'wcag-badge';
    if (ratio >= 7) {
      element.textContent = 'AAA';
      element.classList.add('pass-aaa');
    } else if (ratio >= 4.5) {
      element.textContent = 'AA';
      element.classList.add('pass-aa');
    } else {
      element.textContent = 'FAIL';
      element.classList.add('fail');
    }
  }

  handleCopy(e) {
    const format = e.target.dataset.format;
    let value;
    
    switch (format) {
      case 'hex':
        value = this.hexInput.value;
        break;
      case 'rgb':
        const { r, g, b } = this.currentColor;
        value = `rgb(${r}, ${g}, ${b})`;
        break;
      case 'hsl':
        const hsl = ColorUtils.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        break;
    }
    
    this.copyToClipboard(value);
  }

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.showToast(`Copied: ${text}`, 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        this.showToast(`Copied: ${text}`, 'success');
      }
    } catch (err) {
      this.showToast('Copy failed', 'error');
    }
  }

  checkEyeDropperSupport() {
    if ('EyeDropper' in window) {
      this.eyedropperNote.textContent = 'Click to pick a color from anywhere on screen';
    } else {
      this.eyedropperBtn.disabled = true;
      this.eyedropperNote.textContent = 'EyeDropper not supported in this browser';
    }
  }

  async handleEyeDropper() {
    if (!('EyeDropper' in window)) {
      this.showToast('EyeDropper not supported', 'error');
      return;
    }
    
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      const rgb = ColorUtils.hexToRgb(result.sRGBHex);
      if (rgb) {
        this.currentColor = rgb;
        this.updateColor();
        this.showToast(`Picked color: ${result.sRGBHex}`, 'success');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.showToast('Failed to pick color', 'error');
      }
    }
  }

  handleHarmonySelect(e) {
    // Update active button
    this.harmonyBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    const type = e.target.dataset.type;
    const hsl = ColorUtils.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
    const harmonies = ColorUtils.generateHarmonies(hsl, type);
    
    this.renderHarmonies(harmonies);
  }

  renderHarmonies(harmonies) {
    const swatchesHtml = harmonies.map((color, index) => `
      <div class="harmony-swatch" 
           style="background: ${color.hex}" 
           data-color="${color.hex}"
           title="${color.hex}"
           tabindex="0"
           role="button"
           aria-label="Harmony color ${index + 1}: ${color.hex}">
      </div>
    `).join('');
    
    this.harmonyPreview.innerHTML = `<div class="harmony-swatches">${swatchesHtml}</div>`;
    
    // Add click handlers to harmony swatches
    this.harmonyPreview.querySelectorAll('.harmony-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const hex = swatch.dataset.color;
        const rgb = ColorUtils.hexToRgb(hex);
        if (rgb) {
          this.currentColor = rgb;
          this.updateColor();
        }
      });
      
      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          swatch.click();
        }
      });
    });
  }

  savePalette() {
    const name = this.paletteNameInput.value.trim();
    if (!name) {
      this.showToast('Please enter a palette name', 'error');
      return;
    }
    
    const hsl = ColorUtils.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
    const harmonies = ColorUtils.generateHarmonies(hsl, 'analogous');
    
    const palette = {
      id: Date.now().toString(),
      name,
      colors: harmonies.map(h => h.hex),
      created: new Date().toISOString()
    };
    
    this.savedPalettes.push(palette);
    this.savePalettes();
    this.renderSavedPalettes();
    
    this.paletteNameInput.value = '';
    this.showToast(`Palette "${name}" saved`, 'success');
  }

  loadPalettes() {
    try {
      return JSON.parse(localStorage.getItem('colorPickerPalettes') || '[]');
    } catch {
      return [];
    }
  }

  savePalettes() {
    localStorage.setItem('colorPickerPalettes', JSON.stringify(this.savedPalettes));
  }

  renderSavedPalettes() {
    if (this.savedPalettes.length === 0) {
      document.getElementById('savedPalettes').innerHTML = 
        '<p class="no-palettes">No saved palettes yet. Create one above!</p>';
      return;
    }
    
    const palettesHtml = this.savedPalettes.map(palette => {
      const colorsHtml = palette.colors.map(color => 
        `<div class="palette-color" style="background: ${color}" data-color="${color}" title="${color}"></div>`
      ).join('');
      
      const date = new Date(palette.created).toLocaleDateString();
      
      return `
        <div class="palette-item">
          <div class="palette-header">
            <span class="palette-name">${palette.name}</span>
            <span class="palette-date">${date}</span>
          </div>
          <div class="palette-colors">${colorsHtml}</div>
          <div class="palette-actions-row">
            <button class="load-palette-btn" data-id="${palette.id}">Load</button>
            <button class="delete-palette-btn" data-id="${palette.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');
    
    document.getElementById('savedPalettes').innerHTML = palettesHtml;
    
    // Add event listeners
    document.querySelectorAll('.palette-color').forEach(color => {
      color.addEventListener('click', () => {
        const hex = color.dataset.color;
        const rgb = ColorUtils.hexToRgb(hex);
        if (rgb) {
          this.currentColor = rgb;
          this.updateColor();
        }
      });
    });
    
    document.querySelectorAll('.load-palette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const paletteId = btn.dataset.id;
        this.loadPalette(paletteId);
      });
    });
    
    document.querySelectorAll('.delete-palette-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const paletteId = btn.dataset.id;
        this.deletePalette(paletteId);
      });
    });
  }

  loadPalette(id) {
    const palette = this.savedPalettes.find(p => p.id === id);
    if (palette && palette.colors.length > 0) {
      const rgb = ColorUtils.hexToRgb(palette.colors[0]);
      if (rgb) {
        this.currentColor = rgb;
        this.updateColor();
        this.showToast(`Loaded palette: ${palette.name}`, 'success');
      }
    }
  }

  deletePalette(id) {
    const paletteIndex = this.savedPalettes.findIndex(p => p.id === id);
    if (paletteIndex !== -1) {
      const palette = this.savedPalettes[paletteIndex];
      this.savedPalettes.splice(paletteIndex, 1);
      this.savePalettes();
      this.renderSavedPalettes();
      this.showToast(`Deleted palette: ${palette.name}`, 'success');
    }
  }

  handleImportPalette(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          this.savedPalettes = [...this.savedPalettes, ...imported];
          this.savePalettes();
          this.renderSavedPalettes();
          this.showToast(`Imported ${imported.length} palette(s)`, 'success');
        } else {
          this.showToast('Invalid palette file format', 'error');
        }
      } catch {
        this.showToast('Failed to parse palette file', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  }

  exportPalettes() {
    if (this.savedPalettes.length === 0) {
      this.showToast('No palettes to export', 'error');
      return;
    }
    
    const dataStr = JSON.stringify(this.savedPalettes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'color-palettes.json';
    link.click();
    
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${this.savedPalettes.length} palette(s)`, 'success');
  }

  setupTheme() {
    const saved = localStorage.getItem('colorPickerTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    
    this.setTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('colorPickerTheme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('colorPickerTheme', theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
      <span class="toast-message">${message}</span>
    `;
    
    this.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
}

// Initialize the color picker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ColorPicker();
});