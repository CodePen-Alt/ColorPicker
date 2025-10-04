class ColorPicker {
    constructor() {
        this.currentColor = {
            h: 0, // hue (0-360)
            s: 70, // saturation (0-100)
            l: 40, // lightness (0-100)
            a: 1   // alpha (0-1)
        };
        
        this.isDragging = false;
        this.savedPalettes = JSON.parse(localStorage.getItem('colorPalettes')) || [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateAll();
        this.renderSavedPalettes();
    }
    
    initializeElements() {
        // Main elements
        this.colorArea = document.getElementById('colorArea');
        this.colorHandle = document.getElementById('colorHandle');
        this.hueSlider = document.getElementById('hueSlider');
        this.hueHandle = document.getElementById('hueHandle');
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityHandle = document.getElementById('opacityHandle');
        this.colorPreview = document.getElementById('colorPreview');
        
        // Input elements
        this.hexInput = document.getElementById('hexInput');
        this.rgbInput = document.getElementById('rgbInput');
        this.hslInput = document.getElementById('hslInput');
        
        // Contrast elements
        this.blackTextBtn = document.getElementById('blackTextBtn');
        this.whiteTextBtn = document.getElementById('whiteTextBtn');
        this.blackRatio = document.getElementById('blackRatio');
        this.whiteRatio = document.getElementById('whiteRatio');
        
        // Harmony elements
        this.harmonyPreview = document.getElementById('harmonyPreview');
        
        // Palette elements
        this.paletteNameInput = document.getElementById('paletteNameInput');
        this.savedPalettes = document.getElementById('savedPalettes');
    }
    
    attachEventListeners() {
        // Color area interactions
        this.colorArea.addEventListener('mousedown', (e) => this.handleColorAreaMouseDown(e));
        this.colorArea.addEventListener('mousemove', (e) => this.handleColorAreaMouseMove(e));
        document.addEventListener('mouseup', () => this.isDragging = false);
        
        // Hue slider
        this.hueSlider.addEventListener('mousedown', (e) => this.handleHueSliderMouseDown(e));
        this.hueSlider.addEventListener('mousemove', (e) => this.handleHueSliderMouseMove(e));
        
        // Opacity slider
        this.opacitySlider.addEventListener('mousedown', (e) => this.handleOpacitySliderMouseDown(e));
        this.opacitySlider.addEventListener('mousemove', (e) => this.handleOpacitySliderMouseMove(e));
        
        // Input fields
        this.hexInput.addEventListener('input', () => this.handleHexInput());
        this.rgbInput.addEventListener('input', () => this.handleRgbInput());
        this.hslInput.addEventListener('input', () => this.handleHslInput());
        
        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });
        
        // Harmony buttons
        document.querySelectorAll('.harmony-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showColorHarmony(e.target.dataset.type));
        });
        
        // Palette management
        document.getElementById('savePaletteBtn').addEventListener('click', () => this.savePalette());
        document.getElementById('exportPalettesBtn').addEventListener('click', () => this.exportPalettes());
        document.getElementById('importPalettesBtn').addEventListener('click', () => this.importPalettes());
        
        // Screen picker
        document.getElementById('screenPickerBtn').addEventListener('click', () => this.pickFromScreen());
    }
    
    // Color area interactions
    handleColorAreaMouseDown(e) {
        this.isDragging = true;
        this.updateColorFromArea(e);
    }
    
    handleColorAreaMouseMove(e) {
        if (this.isDragging) {
            this.updateColorFromArea(e);
        }
    }
    
    updateColorFromArea(e) {
        const rect = this.colorArea.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        this.currentColor.s = x * 100;
        this.currentColor.l = (1 - y) * 100;
        
        this.updateColorHandle();
        this.updateAll();
    }
    
    // Hue slider interactions
    handleHueSliderMouseDown(e) {
        this.isDragging = true;
        this.updateHueFromSlider(e);
    }
    
    handleHueSliderMouseMove(e) {
        if (this.isDragging) {
            this.updateHueFromSlider(e);
        }
    }
    
    updateHueFromSlider(e) {
        const rect = this.hueSlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        this.currentColor.h = x * 360;
        
        this.updateHueHandle();
        this.updateAll();
    }
    
    // Opacity slider interactions
    handleOpacitySliderMouseDown(e) {
        this.isDragging = true;
        this.updateOpacityFromSlider(e);
    }
    
    handleOpacitySliderMouseMove(e) {
        if (this.isDragging) {
            this.updateOpacityFromSlider(e);
        }
    }
    
    updateOpacityFromSlider(e) {
        const rect = this.opacitySlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        this.currentColor.a = x;
        
        this.updateOpacityHandle();
        this.updateAll();
    }
    
    // Handle updates
    updateColorHandle() {
        const x = (this.currentColor.s / 100) * 100;
        const y = (1 - this.currentColor.l / 100) * 100;
        
        this.colorHandle.style.left = `${x}%`;
        this.colorHandle.style.top = `${y}%`;
    }
    
    updateHueHandle() {
        const x = (this.currentColor.h / 360) * 100;
        this.hueHandle.style.left = `${x}%`;
    }
    
    updateOpacityHandle() {
        const x = this.currentColor.a * 100;
        this.opacityHandle.style.left = `${x}%`;
    }
    
    // Color conversion methods
    hslToRgb(h, s, l) {
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
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }
    
    rgbToHex(r, g, b) {
        return `#${[r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
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
        
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }
    
    // Contrast ratio calculation
    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    getContrastRatio(rgb1, rgb2) {
        const lum1 = this.getLuminance(...rgb1);
        const lum2 = this.getLuminance(...rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }
    
    // Input handlers
    handleHexInput() {
        const hex = this.hexInput.value;
        const rgb = this.hexToRgb(hex);
        if (rgb) {
            const [h, s, l] = this.rgbToHsl(...rgb);
            this.currentColor.h = h;
            this.currentColor.s = s;
            this.currentColor.l = l;
            this.updateHandles();
            this.updateDisplays();
        }
    }
    
    handleRgbInput() {
        const values = this.rgbInput.value.split(',').map(v => parseInt(v.trim()));
        if (values.length === 3 && values.every(v => !isNaN(v) && v >= 0 && v <= 255)) {
            const [h, s, l] = this.rgbToHsl(...values);
            this.currentColor.h = h;
            this.currentColor.s = s;
            this.currentColor.l = l;
            this.updateHandles();
            this.updateDisplays();
        }
    }
    
    handleHslInput() {
        const values = this.hslInput.value.split(',').map(v => {
            const trimmed = v.trim();
            return trimmed.includes('%') ? parseFloat(trimmed) : parseFloat(trimmed);
        });
        
        if (values.length === 3 && values.every(v => !isNaN(v))) {
            this.currentColor.h = values[0];
            this.currentColor.s = values[1];
            this.currentColor.l = values[2];
            this.updateHandles();
            this.updateDisplays();
        }
    }
    
    // Update all displays
    updateAll() {
        this.updateDisplays();
        this.updateContrastTests();
        this.updateColorArea();
        this.updateOpacitySlider();
    }
    
    updateDisplays() {
        const rgb = this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        const hex = this.rgbToHex(...rgb);
        
        // Update color preview
        this.colorPreview.style.backgroundColor = `hsla(${this.currentColor.h}, ${this.currentColor.s}%, ${this.currentColor.l}%, ${this.currentColor.a})`;
        
        // Update input fields
        this.hexInput.value = hex;
        this.rgbInput.value = rgb.join(', ');
        this.hslInput.value = `${Math.round(this.currentColor.h)}, ${Math.round(this.currentColor.s)}%, ${Math.round(this.currentColor.l)}%`;
        
        // Update contrast buttons
        const bgColor = `hsla(${this.currentColor.h}, ${this.currentColor.s}%, ${this.currentColor.l}%, ${this.currentColor.a})`;
        this.blackTextBtn.style.backgroundColor = bgColor;
        this.whiteTextBtn.style.backgroundColor = bgColor;
    }
    
    updateContrastTests() {
        const rgb = this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        
        const blackRatio = this.getContrastRatio(rgb, [0, 0, 0]);
        const whiteRatio = this.getContrastRatio(rgb, [255, 255, 255]);
        
        const formatRatio = (ratio) => {
            const formatted = ratio.toFixed(1) + ':1';
            if (ratio >= 7) return formatted + ' AAA';
            if (ratio >= 4.5) return formatted + ' AA';
            if (ratio >= 3) return formatted + ' AA Large';
            return formatted + ' Fail';
        };
        
        this.blackRatio.textContent = formatRatio(blackRatio);
        this.whiteRatio.textContent = formatRatio(whiteRatio);
    }
    
    updateHandles() {
        this.updateColorHandle();
        this.updateHueHandle();
        this.updateOpacityHandle();
    }
    
    updateColorArea() {
        // Update the main color area background to show current hue
        this.colorArea.style.background = `linear-gradient(to right, 
            hsl(${this.currentColor.h}, 100%, 50%), 
            hsl(${(this.currentColor.h + 60) % 360}, 100%, 50%), 
            hsl(${(this.currentColor.h + 120) % 360}, 100%, 50%), 
            hsl(${(this.currentColor.h + 180) % 360}, 100%, 50%), 
            hsl(${(this.currentColor.h + 240) % 360}, 100%, 50%), 
            hsl(${(this.currentColor.h + 300) % 360}, 100%, 50%), 
            hsl(${this.currentColor.h}, 100%, 50%))`;
    }
    
    updateOpacitySlider() {
        const rgb = this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        const color = `rgb(${rgb.join(', ')})`;
        
        // Create a new style element for the opacity slider gradient
        const opacityGradient = `linear-gradient(to right, transparent, ${color})`;
        this.opacitySlider.style.backgroundImage = `
            linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
            linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
            ${opacityGradient}
        `;
        this.opacitySlider.style.backgroundSize = '10px 10px, 10px 10px, 100% 100%';
        this.opacitySlider.style.backgroundPosition = '0 0, 5px 5px, 0 0';
    }
    
    // Utility methods
    copyToClipboard(e) {
        const target = e.target.dataset.target;
        const input = document.getElementById(target);
        
        navigator.clipboard.writeText(input.value).then(() => {
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 1000);
        });
    }
    
    // Color harmony methods
    showColorHarmony(type) {
        // Remove active class from all buttons
        document.querySelectorAll('.harmony-btn').forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        event.target.classList.add('active');
        
        const harmonies = this.generateColorHarmony(type);
        this.renderColorHarmony(harmonies);
    }
    
    generateColorHarmony(type) {
        const baseHue = this.currentColor.h;
        const baseSat = this.currentColor.s;
        const baseLum = this.currentColor.l;
        
        switch (type) {
            case 'complementary':
                return [
                    {h: baseHue, s: baseSat, l: baseLum},
                    {h: (baseHue + 180) % 360, s: baseSat, l: baseLum}
                ];
            
            case 'analogous':
                return [
                    {h: (baseHue - 30 + 360) % 360, s: baseSat, l: baseLum},
                    {h: baseHue, s: baseSat, l: baseLum},
                    {h: (baseHue + 30) % 360, s: baseSat, l: baseLum}
                ];
            
            case 'triadic':
                return [
                    {h: baseHue, s: baseSat, l: baseLum},
                    {h: (baseHue + 120) % 360, s: baseSat, l: baseLum},
                    {h: (baseHue + 240) % 360, s: baseSat, l: baseLum}
                ];
            
            case 'tetradic':
                return [
                    {h: baseHue, s: baseSat, l: baseLum},
                    {h: (baseHue + 90) % 360, s: baseSat, l: baseLum},
                    {h: (baseHue + 180) % 360, s: baseSat, l: baseLum},
                    {h: (baseHue + 270) % 360, s: baseSat, l: baseLum}
                ];
            
            default:
                return [];
        }
    }
    
    renderColorHarmony(colors) {
        this.harmonyPreview.innerHTML = '';
        this.harmonyPreview.classList.add('active');
        
        colors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'harmony-color';
            colorDiv.style.backgroundColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
            colorDiv.addEventListener('click', () => {
                this.currentColor = {...color, a: this.currentColor.a};
                this.updateHandles();
                this.updateAll();
            });
            this.harmonyPreview.appendChild(colorDiv);
        });
    }
    
    // Palette management
    savePalette() {
        const name = this.paletteNameInput.value.trim();
        if (!name) {
            alert('Please enter a palette name');
            return;
        }
        
        const palette = {
            name,
            colors: [this.currentColor],
            timestamp: Date.now()
        };
        
        // Get harmony colors if active
        const activeHarmony = document.querySelector('.harmony-btn.active');
        if (activeHarmony) {
            const harmonyType = activeHarmony.dataset.type;
            palette.colors = this.generateColorHarmony(harmonyType);
        }
        
        this.savedPalettes.push(palette);
        localStorage.setItem('colorPalettes', JSON.stringify(this.savedPalettes));
        this.paletteNameInput.value = '';
        this.renderSavedPalettes();
    }
    
    renderSavedPalettes() {
        const savedPalettesContainer = document.getElementById('savedPalettes');
        savedPalettesContainer.innerHTML = '';
        
        this.savedPalettes.forEach((palette, index) => {
            const paletteDiv = document.createElement('div');
            paletteDiv.className = 'palette-item';
            
            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'palette-colors';
            
            palette.colors.forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.className = 'palette-color';
                colorDiv.style.backgroundColor = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
                colorDiv.addEventListener('click', () => {
                    this.currentColor = {...color, a: this.currentColor.a};
                    this.updateHandles();
                    this.updateAll();
                });
                colorsDiv.appendChild(colorDiv);
            });
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'palette-name';
            nameDiv.textContent = palette.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'palette-delete';
            deleteBtn.textContent = '🗑️';
            deleteBtn.addEventListener('click', () => {
                this.deletePalette(index);
            });
            
            paletteDiv.appendChild(colorsDiv);
            paletteDiv.appendChild(nameDiv);
            paletteDiv.appendChild(deleteBtn);
            
            savedPalettesContainer.appendChild(paletteDiv);
        });
    }
    
    deletePalette(index) {
        this.savedPalettes.splice(index, 1);
        localStorage.setItem('colorPalettes', JSON.stringify(this.savedPalettes));
        this.renderSavedPalettes();
    }
    
    exportPalettes() {
        const data = JSON.stringify(this.savedPalettes, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color-palettes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importPalettes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedPalettes = JSON.parse(e.target.result);
                    if (Array.isArray(importedPalettes)) {
                        this.savedPalettes = [...this.savedPalettes, ...importedPalettes];
                        localStorage.setItem('colorPalettes', JSON.stringify(this.savedPalettes));
                        this.renderSavedPalettes();
                        alert('Palettes imported successfully!');
                    }
                } catch (error) {
                    alert('Invalid file format');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }
    
    // Screen color picker (requires Eye Dropper API)
    async pickFromScreen() {
        if ('EyeDropper' in window) {
            try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                
                const rgb = this.hexToRgb(result.sRGBHex);
                if (rgb) {
                    const [h, s, l] = this.rgbToHsl(...rgb);
                    this.currentColor.h = h;
                    this.currentColor.s = s;
                    this.currentColor.l = l;
                    this.updateHandles();
                    this.updateAll();
                }
            } catch (e) {
                console.log('User cancelled color picking');
            }
        } else {
            alert('Eye Dropper API not supported in this browser');
        }
    }
}

// Initialize the color picker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorPicker();
});