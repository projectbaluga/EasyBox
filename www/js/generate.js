// ============================================
// EasyBox v2.5 - Voucher Generator
// Enhanced Voucher Editor with Photoshop-style UI
// ============================================

// CSS path for print window
if (typeof VOUCHER_CSS === 'undefined') {
    var VOUCHER_CSS = 'css/voucher.css';
}

// ---- Template Manager (localStorage) ----
var STORAGE_KEY = 'qv_templates';
var ACTIVE_KEY = 'qv_active_template';
var templateBg = '';

function getTemplates() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
}

function saveTemplates(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getActiveTemplateId() {
    return localStorage.getItem(ACTIVE_KEY) || '';
}

function setActiveTemplateId(id) {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
}

function addTemplate(name, data) {
    var list = getTemplates();
    var tpl = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        name: name || 'Template ' + (list.length + 1),
        data: data,
        created: new Date().toLocaleDateString()
    };
    list.push(tpl);
    saveTemplates(list);
    return tpl;
}

function deleteTemplate(id) {
    var list = getTemplates().filter(function (t) { return t.id !== id; });
    saveTemplates(list);
    if (getActiveTemplateId() === id) {
        setActiveTemplateId('');
        templateBg = '';
    }
}

function renameTemplate(id, newName) {
    var list = getTemplates();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { list[i].name = newName; break; }
    }
    saveTemplates(list);
}

function selectTemplate(id) {
    if (!id) {
        setActiveTemplateId('');
        templateBg = '';
    } else {
        var list = getTemplates();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                setActiveTemplateId(id);
                templateBg = list[i].data;
                break;
            }
        }
    }
    renderTemplateSelector();
    renderManagerGallery();
    updateVoucherPreviews();
}

function loadActiveTemplate() {
    var id = getActiveTemplateId();
    if (!id) { templateBg = ''; return; }
    var list = getTemplates();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { templateBg = list[i].data; return; }
    }
    setActiveTemplateId('');
    templateBg = '';
}

// ---- Render Template Selector ----
function renderTemplateSelector() {
    var containers = [
        document.getElementById('templateSelector'),
        document.getElementById('templateSelectorBar')
    ];
    var list = getTemplates();
    var activeId = getActiveTemplateId();

    var html = '';
    html += '<div class="tpl-thumb' + (!activeId ? ' active' : '') + '" onclick="selectTemplate(\'\')" title="No template">';
    html += '<div class="tpl-thumb-img tpl-none"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
    html += '<span class="tpl-thumb-name">None</span></div>';

    for (var i = 0; i < list.length; i++) {
        var t = list[i];
        var isActive = t.id === activeId;
        html += '<div class="tpl-thumb' + (isActive ? ' active' : '') + '" onclick="selectTemplate(\'' + t.id + '\')" title="' + t.name + '">';
        html += '<img class="tpl-thumb-img" src="' + t.data + '" alt="' + t.name + '">';
        html += '<span class="tpl-thumb-name">' + t.name + '</span></div>';
    }

    html += '<div class="tpl-thumb tpl-add" onclick="openTemplateManager()" title="Add template">';
    html += '<div class="tpl-thumb-img tpl-none"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
    html += '<span class="tpl-thumb-name">Add</span></div>';

    containers.forEach(function (c) { if (c) c.innerHTML = html; });
}

// ---- Render Manager Gallery ----
function renderManagerGallery() {
    var container = document.getElementById('managerGallery');
    if (!container) return;
    var list = getTemplates();
    var activeId = getActiveTemplateId();

    if (list.length === 0) {
        container.innerHTML = '<div class="tpl-empty">No saved templates yet. Upload one above to get started.</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
        var t = list[i];
        var isActive = t.id === activeId;
        html += '<div class="tpl-card' + (isActive ? ' selected' : '') + '" data-id="' + t.id + '">';
        html += '<div class="tpl-card-img-wrap"><img class="tpl-card-img" src="' + t.data + '" alt="' + t.name + '">';
        if (isActive) html += '<span class="tpl-active-badge">Active</span>';
        html += '</div>';
        html += '<div class="tpl-card-body">';
        html += '<input class="tpl-card-name" value="' + t.name + '" onchange="renameTemplate(\'' + t.id + '\', this.value); renderTemplateSelector()" maxlength="24">';
        html += '<span class="tpl-card-date">' + t.created + '</span>';
        html += '</div>';
        html += '<div class="tpl-card-actions">';
        if (!isActive) html += '<button class="btn btn-sm btn-primary tpl-btn" onclick="selectTemplate(\'' + t.id + '\')">Use</button>';
        else html += '<button class="btn btn-sm btn-outline-secondary tpl-btn" onclick="selectTemplate(\'\')">Deselect</button>';
        html += '<button class="btn btn-sm btn-outline-danger tpl-btn" onclick="confirmDeleteTemplate(\'' + t.id + '\', \'' + t.name.replace(/'/g, "\\'") + '\')">Delete</button>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function confirmDeleteTemplate(id, name) {
    if (confirm('Delete template "' + name + '"? This cannot be undone.')) {
        deleteTemplate(id);
        renderManagerGallery();
        renderTemplateSelector();
        updateVoucherPreviews();
    }
}

function openTemplateManager() {
    renderManagerGallery();
    var mgrEl = document.getElementById('templateManager');
    var mgr = bootstrap.Modal.getOrCreateInstance(mgrEl);
    mgr.show();
}

// ============================================
// EDITOR FULLSCREEN TOGGLE
// ============================================
function toggleEditorFullscreen() {
    var dialog = document.querySelector('#customize .modal-dialog');
    if (!dialog) return;
    var isFullscreen = dialog.classList.contains('modal-fullscreen');
    dialog.classList.toggle('modal-fullscreen', !isFullscreen);
    dialog.classList.toggle('modal-xl', isFullscreen);

    var btn = document.getElementById('btnFullscreen');
    if (btn) {
        if (!isFullscreen) {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
            btn.title = 'Exit Fullscreen';
        } else {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
            btn.title = 'Toggle Fullscreen';
        }
    }
    // Refit zoom after resize
    setTimeout(function () { editorZoomFit(); }, 200);
}

function updateVoucherPreviews() {
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        if (templateBg) {
            container.style.backgroundImage = 'url(' + templateBg + ')';
            container.style.backgroundSize = 'cover';
            container.style.backgroundRepeat = 'no-repeat';
            container.style.backgroundPosition = 'center';
        } else {
            container.style.backgroundImage = '';
            container.style.backgroundSize = '';
            container.style.backgroundRepeat = '';
            container.style.backgroundPosition = '';
        }
    }
}

// ---- Upload Handler ----
function handleManagerUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 512000) {
        alert('Image too large. Please use an image under 500KB.');
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var nameInput = document.getElementById('tplUploadName');
        var name = (nameInput && nameInput.value.trim()) || file.name.replace(/\.[^.]+$/, '');
        addTemplate(name, e.target.result);
        if (nameInput) nameInput.value = '';
        var fileInput = document.getElementById('tplUploadFile');
        if (fileInput) fileInput.value = '';
        renderManagerGallery();
        renderTemplateSelector();
    };
    reader.readAsDataURL(file);
}

// ---- Character sets ----
var CHARSETS = {
    '1': '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '2': 'abcdefghijklmnopqrstuvwxyz',
    '3': '0123456789',
    '4': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '5': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    '6': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
};

function getDateStr() {
    var d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0') + '_' + String(d.getDate()).padStart(2, '0') + '_' + d.getFullYear();
}

function makeCode(prefix, length, charsetKey) {
    var chars = CHARSETS[charsetKey] || CHARSETS['1'];
    var code = prefix;
    for (var i = 0; i < length - prefix.length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function calcMins(days, hours, mins) {
    return (24 * (parseInt(days) || 0) * 60) + (60 * (parseInt(hours) || 0)) + (parseInt(mins) || 0);
}

function fmtDuration(days, hours, mins) {
    var p = [];
    if (parseInt(days) > 0) p.push(days + ' D');
    if (parseInt(hours) > 0) p.push(hours + ' H');
    if (parseInt(mins) > 0) p.push(mins + ' M');
    return p.length ? p.join(' ') : '0 M';
}

// ============================================
// EDITOR STATE
// ============================================
var selectedElementKey = null;
var editorZoom = 1;
var showGrid = false;
var undoStack = [];
var redoStack = [];
var MAX_UNDO = 30;
var voucherBorderStyle = '1px dashed #aaa';
var voucherBgColor = '#ffffff';
var voucherBorderRadius = 0;
var voucherGradient = '';

var LAYER_NAMES = {
    price: 'Price',
    vendor: 'Tag Name',
    code: 'Code',
    duration: 'Duration',
    login: 'Login Info',
    qr: 'QR Code',
    custom1: 'Custom 1',
    custom2: 'Custom 2',
    custom3: 'Custom 3',
    custom4: 'Custom 4'
};

var layerOrder = ['qr', 'login', 'duration', 'code', 'vendor', 'price'];

var voucherContainerSize = { width: 200, height: 100 };

var voucherElementsConfig = {
    price:    { id: 'dragPrice',    visible: true,  left: 0,   top: 0,  fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false },
    vendor:   { id: 'dragVendor',   visible: true,  left: 35,  top: 5,  fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false },
    code:     { id: 'dragCode',     visible: true,  left: 35,  top: 30, fontSize: 18, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false },
    duration: { id: 'dragDuration', visible: true,  left: 35,  top: 60, fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false },
    login:    { id: 'dragLogin',    visible: true,  left: 35,  top: 75, fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false },
    qr:       { id: 'dragQR',       visible: false, left: 135, top: 5,  fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent', lineHeight: 1.2, padding: 0, boxShadow: false }
};

var customTexts = {};
var MAX_CUSTOM_TEXTS = 4;

var qrCodeSize = 60;
var copiedStyle = null;

// Ensure backward compatibility when loading saved configs
function ensureDefaults(cfg) {
    var defaults = {
        price:    { fontSize: 12, bold: true },
        vendor:   { fontSize: 14, bold: true },
        code:     { fontSize: 18, bold: true },
        duration: { fontSize: 11 },
        login:    { fontSize: 12 },
        qr:       { fontSize: 12 }
    };
    for (var key in cfg) {
        var el = cfg[key];
        var def = defaults[key] || {};
        if (el.fontSize === undefined) el.fontSize = def.fontSize || 12;
        if (el.fontFamily === undefined) el.fontFamily = 'Arial, sans-serif';
        if (el.color === undefined) el.color = '#000000';
        if (el.bold === undefined) el.bold = def.bold || false;
        if (el.italic === undefined) el.italic = false;
        if (el.opacity === undefined) el.opacity = 1;
        if (el.textTransform === undefined) el.textTransform = 'none';
        if (el.textDecoration === undefined) el.textDecoration = 'none';
        if (el.letterSpacing === undefined) el.letterSpacing = 0;
        if (el.textShadow === undefined) el.textShadow = false;
        if (el.rotation === undefined) el.rotation = 0;
        if (el.bgColor === undefined) el.bgColor = 'transparent';
        if (el.lineHeight === undefined) el.lineHeight = 1.2;
        if (el.padding === undefined) el.padding = 0;
        if (el.boxShadow === undefined) el.boxShadow = false;
    }
    return cfg;
}

// ============================================
// UNDO / REDO
// ============================================
function pushUndo() {
    undoStack.push(JSON.stringify(voucherElementsConfig));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    updateUndoRedoBtns();
}

function editorUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(voucherElementsConfig));
    var state = JSON.parse(undoStack.pop());
    for (var key in state) {
        if (voucherElementsConfig[key]) {
            voucherElementsConfig[key] = state[key];
        }
    }
    applyAllElementStyles();
    saveElementsConfig();
    updatePropertiesPanel();
    renderLayers();
    updateUndoRedoBtns();
}

function editorRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(voucherElementsConfig));
    var state = JSON.parse(redoStack.pop());
    for (var key in state) {
        if (voucherElementsConfig[key]) {
            voucherElementsConfig[key] = state[key];
        }
    }
    applyAllElementStyles();
    saveElementsConfig();
    updatePropertiesPanel();
    renderLayers();
    updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
    var btnUndo = document.getElementById('btnUndo');
    var btnRedo = document.getElementById('btnRedo');
    if (btnUndo) btnUndo.disabled = undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

// ============================================
// ELEMENT SELECTION
// ============================================
function selectElement(key) {
    selectedElementKey = key;
    // Update visual selection
    document.querySelectorAll('.drag-el').forEach(function (el) {
        el.classList.remove('selected');
    });
    if (key && voucherElementsConfig[key]) {
        var el = document.getElementById(voucherElementsConfig[key].id);
        if (el) el.classList.add('selected');
    }
    updatePropertiesPanel();
    renderLayers();
}

function deselectAll() {
    selectedElementKey = null;
    document.querySelectorAll('.drag-el').forEach(function (el) {
        el.classList.remove('selected');
    });
    updatePropertiesPanel();
    renderLayers();
}

// ============================================
// PROPERTIES PANEL
// ============================================
function updatePropertiesPanel() {
    var propEmpty = document.getElementById('propEmpty');
    var propEditor = document.getElementById('propEditor');
    if (!propEmpty || !propEditor) return;

    if (!selectedElementKey || !voucherElementsConfig[selectedElementKey]) {
        propEmpty.style.display = 'block';
        propEditor.style.display = 'none';
        return;
    }

    propEmpty.style.display = 'none';
    propEditor.style.display = 'block';

    var cfg = voucherElementsConfig[selectedElementKey];
    var name = LAYER_NAMES[selectedElementKey] || selectedElementKey;
    // For custom elements, show their actual text content
    if (selectedElementKey && selectedElementKey.indexOf('custom') === 0 && customTexts[selectedElementKey]) {
        name = customTexts[selectedElementKey];
    }

    document.getElementById('propName').textContent = name;
    document.getElementById('propX').value = cfg.left || 0;
    document.getElementById('propY').value = cfg.top || 0;

    // Typography (hide for QR)
    var typoGroup = document.getElementById('propTypoGroup');
    if (typoGroup) {
        typoGroup.style.display = selectedElementKey === 'qr' ? 'none' : 'block';
    }

    if (selectedElementKey !== 'qr') {
        var fontSelect = document.getElementById('propFont');
        if (fontSelect) {
            // Match the font family
            var found = false;
            for (var i = 0; i < fontSelect.options.length; i++) {
                if (fontSelect.options[i].value === cfg.fontFamily) {
                    fontSelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) fontSelect.selectedIndex = 0;
        }

        var sizeInput = document.getElementById('propFontSize');
        if (sizeInput) sizeInput.value = cfg.fontSize || 12;

        var colorInput = document.getElementById('propFontColor');
        if (colorInput) colorInput.value = cfg.color || '#000000';

        var boldBtn = document.getElementById('propBold');
        if (boldBtn) boldBtn.classList.toggle('active', !!cfg.bold);

        var italicBtn = document.getElementById('propItalic');
        if (italicBtn) italicBtn.classList.toggle('active', !!cfg.italic);

        // Advanced typography
        var textTransformSelect = document.getElementById('propTextTransform');
        if (textTransformSelect) textTransformSelect.value = cfg.textTransform || 'none';

        var textDecoSelect = document.getElementById('propTextDecoration');
        if (textDecoSelect) textDecoSelect.value = cfg.textDecoration || 'none';

        var letterSpacingInput = document.getElementById('propLetterSpacing');
        if (letterSpacingInput) letterSpacingInput.value = cfg.letterSpacing || 0;
        var letterSpacingVal = document.getElementById('propLetterSpacingVal');
        if (letterSpacingVal) letterSpacingVal.textContent = (cfg.letterSpacing || 0) + 'px';

        var textShadowBtn = document.getElementById('propTextShadow');
        if (textShadowBtn) textShadowBtn.classList.toggle('active', !!cfg.textShadow);

        var bgColorInput = document.getElementById('propBgColor');
        if (bgColorInput) bgColorInput.value = (cfg.bgColor && cfg.bgColor !== 'transparent') ? cfg.bgColor : '#ffffff';

        var lineHeightInput = document.getElementById('propLineHeight');
        if (lineHeightInput) lineHeightInput.value = cfg.lineHeight || 1.2;
        var lineHeightVal = document.getElementById('propLineHeightVal');
        if (lineHeightVal) lineHeightVal.textContent = (cfg.lineHeight || 1.2).toFixed(1);

        var paddingInput = document.getElementById('propPadding');
        if (paddingInput) paddingInput.value = cfg.padding || 0;
        var paddingVal = document.getElementById('propPaddingVal');
        if (paddingVal) paddingVal.textContent = (cfg.padding || 0) + 'px';
    }

    var opacitySlider = document.getElementById('propOpacity');
    var opacityVal = document.getElementById('propOpacityVal');
    if (opacitySlider) {
        opacitySlider.value = Math.round((cfg.opacity !== undefined ? cfg.opacity : 1) * 100);
    }
    if (opacityVal) {
        opacityVal.textContent = Math.round((cfg.opacity !== undefined ? cfg.opacity : 1) * 100) + '%';
    }

    // Rotation (applies to all elements)
    var rotationInput = document.getElementById('propRotation');
    if (rotationInput) rotationInput.value = cfg.rotation || 0;
    var rotationVal = document.getElementById('propRotationVal');
    if (rotationVal) rotationVal.textContent = (cfg.rotation || 0) + '\u00B0';

    // Box shadow
    var boxShadowBtn = document.getElementById('propBoxShadow');
    if (boxShadowBtn) boxShadowBtn.classList.toggle('active', !!cfg.boxShadow);

    // QR size (only for QR element)
    var qrSizeGroup = document.getElementById('propQrSizeGroup');
    if (qrSizeGroup) qrSizeGroup.style.display = selectedElementKey === 'qr' ? 'block' : 'none';
    if (selectedElementKey === 'qr') {
        var qrSizeInput = document.getElementById('propQrSize');
        if (qrSizeInput) qrSizeInput.value = qrCodeSize;
        var qrSizeVal = document.getElementById('propQrSizeVal');
        if (qrSizeVal) qrSizeVal.textContent = qrCodeSize + 'px';
    }
}

function setPropPosition() {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.left = parseInt(document.getElementById('propX').value) || 0;
    cfg.top = parseInt(document.getElementById('propY').value) || 0;
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropTypography() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.fontFamily = document.getElementById('propFont').value;
    cfg.fontSize = parseInt(document.getElementById('propFontSize').value) || 12;
    cfg.color = document.getElementById('propFontColor').value || '#000000';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function togglePropBold() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.bold = !cfg.bold;
    document.getElementById('propBold').classList.toggle('active', cfg.bold);
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function togglePropItalic() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.italic = !cfg.italic;
    document.getElementById('propItalic').classList.toggle('active', cfg.italic);
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropOpacity() {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    var val = parseInt(document.getElementById('propOpacity').value) || 100;
    cfg.opacity = val / 100;
    document.getElementById('propOpacityVal').textContent = val + '%';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

// ============================================
// ADVANCED TYPOGRAPHY & ELEMENT PROPERTIES
// ============================================
function setPropTextTransform() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.textTransform = document.getElementById('propTextTransform').value || 'none';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropTextDecoration() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.textDecoration = document.getElementById('propTextDecoration').value || 'none';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropLetterSpacing() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    var val = parseFloat(document.getElementById('propLetterSpacing').value) || 0;
    cfg.letterSpacing = val;
    var label = document.getElementById('propLetterSpacingVal');
    if (label) label.textContent = val + 'px';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function togglePropTextShadow() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.textShadow = !cfg.textShadow;
    document.getElementById('propTextShadow').classList.toggle('active', cfg.textShadow);
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropRotation() {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    var val = parseInt(document.getElementById('propRotation').value) || 0;
    cfg.rotation = val;
    var label = document.getElementById('propRotationVal');
    if (label) label.textContent = val + '\u00B0';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropBgColor() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.bgColor = document.getElementById('propBgColor').value || 'transparent';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function clearPropBgColor() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.bgColor = 'transparent';
    document.getElementById('propBgColor').value = '#ffffff';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropLineHeight() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    var val = parseFloat(document.getElementById('propLineHeight').value) || 1.2;
    cfg.lineHeight = val;
    var label = document.getElementById('propLineHeightVal');
    if (label) label.textContent = val.toFixed(1);
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setPropPadding() {
    if (!selectedElementKey || selectedElementKey === 'qr') return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    var val = parseInt(document.getElementById('propPadding').value) || 0;
    cfg.padding = val;
    var label = document.getElementById('propPaddingVal');
    if (label) label.textContent = val + 'px';
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function togglePropBoxShadow() {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    pushUndo();
    cfg.boxShadow = !cfg.boxShadow;
    document.getElementById('propBoxShadow').classList.toggle('active', cfg.boxShadow);
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
}

function setQrCodeSize() {
    pushUndo();
    var val = parseInt(document.getElementById('propQrSize').value) || 60;
    qrCodeSize = Math.max(30, Math.min(120, val));
    var label = document.getElementById('propQrSizeVal');
    if (label) label.textContent = qrCodeSize + 'px';
    var qrImg = document.querySelector('#dragQR img');
    if (qrImg) {
        qrImg.width = qrCodeSize;
        qrImg.height = qrCodeSize;
    }
    localStorage.setItem('qv_qr_size', qrCodeSize);
}

// ============================================
// COPY / PASTE STYLE
// ============================================
function copyElementStyle() {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    copiedStyle = {
        fontSize: cfg.fontSize,
        fontFamily: cfg.fontFamily,
        color: cfg.color,
        bold: cfg.bold,
        italic: cfg.italic,
        opacity: cfg.opacity,
        textTransform: cfg.textTransform,
        textDecoration: cfg.textDecoration,
        letterSpacing: cfg.letterSpacing,
        textShadow: cfg.textShadow,
        rotation: cfg.rotation,
        bgColor: cfg.bgColor,
        lineHeight: cfg.lineHeight,
        padding: cfg.padding,
        boxShadow: cfg.boxShadow
    };
    var btn = document.getElementById('btnPasteStyle');
    if (btn) btn.disabled = false;
}

function pasteElementStyle() {
    if (!selectedElementKey || !copiedStyle) return;
    if (selectedElementKey === 'qr') {
        // Only paste applicable props for QR
        var cfg = voucherElementsConfig[selectedElementKey];
        pushUndo();
        cfg.opacity = copiedStyle.opacity;
        cfg.rotation = copiedStyle.rotation;
        cfg.boxShadow = copiedStyle.boxShadow;
    } else {
        var cfg = voucherElementsConfig[selectedElementKey];
        pushUndo();
        for (var prop in copiedStyle) {
            cfg[prop] = copiedStyle[prop];
        }
    }
    applyElementStyle(selectedElementKey);
    saveElementsConfig();
    updatePropertiesPanel();
}

// ============================================
// CUSTOM TEXT FIELDS
// ============================================
function loadCustomTexts() {
    try {
        var saved = localStorage.getItem('qv_custom_texts');
        if (saved) customTexts = JSON.parse(saved);
    } catch (e) { customTexts = {}; }
}

function saveCustomTexts() {
    localStorage.setItem('qv_custom_texts', JSON.stringify(customTexts));
}

function getCustomTextCount() {
    var count = 0;
    for (var key in voucherElementsConfig) {
        if (key.indexOf('custom') === 0) count++;
    }
    return count;
}

function addCustomText() {
    pushUndo();
    var count = getCustomTextCount();
    if (count >= MAX_CUSTOM_TEXTS) {
        alert('Maximum ' + MAX_CUSTOM_TEXTS + ' custom text fields allowed.');
        return;
    }

    var num = count + 1;
    // Find next available slot
    while (voucherElementsConfig['custom' + num]) num++;
    var key = 'custom' + num;
    var id = 'dragCustom' + num;

    pushUndo();

    // Add to config
    voucherElementsConfig[key] = {
        id: id,
        visible: true,
        left: 35,
        top: 50,
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        bold: false,
        italic: false,
        opacity: 1,
        textTransform: 'none',
        textDecoration: 'none',
        letterSpacing: 0,
        textShadow: false,
        rotation: 0,
        bgColor: 'transparent',
        lineHeight: 1.2,
        padding: 0,
        boxShadow: false
    };

    // Set default text
    customTexts[key] = 'Custom Text ' + num;

    // Add to layer order (at top)
    layerOrder.unshift(key);
    localStorage.setItem('qv_layer_order', JSON.stringify(layerOrder));

    // Create DOM element in editor canvas
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        var div = document.createElement('div');
        div.id = id;
        div.className = 'drag-el';
        div.setAttribute('data-key', key);
        div.style.cssText = 'position: absolute; left: 35px; top: 50px; font-size: 11px; cursor: move; white-space: nowrap;';
        div.textContent = customTexts[key];
        container.appendChild(div);
        initSingleDraggable(div);
    }

    applyElementStyle(key);
    saveElementsConfig();
    saveCustomTexts();
    renderLayers();
    updateCustomTextsList();

    // Update z-indices
    for (var i = 0; i < layerOrder.length; i++) {
        var lKey = layerOrder[i];
        if (voucherElementsConfig[lKey]) {
            var lEl = document.getElementById(voucherElementsConfig[lKey].id);
            if (lEl) lEl.style.zIndex = layerOrder.length - i;
        }
    }

    selectElement(key);
}

function removeCustomText(key) {
    if (key.indexOf('custom') !== 0) return;
    pushUndo();

    // Remove DOM element
    var el = document.getElementById(voucherElementsConfig[key].id);
    if (el) el.remove();

    // Remove from config
    delete voucherElementsConfig[key];
    delete customTexts[key];

    // Remove from layer order
    var idx = layerOrder.indexOf(key);
    if (idx !== -1) layerOrder.splice(idx, 1);
    localStorage.setItem('qv_layer_order', JSON.stringify(layerOrder));

    deselectAll();
    saveElementsConfig();
    saveCustomTexts();
    renderLayers();
    updateCustomTextsList();
}

function updateCustomTextContent(key) {
    pushUndo();
    if (key.indexOf('custom') !== 0) return;
    var input = document.getElementById('customTextInput_' + key);
    if (!input) return;
    customTexts[key] = input.value || 'Text';
    var el = document.getElementById(voucherElementsConfig[key].id);
    if (el) el.textContent = customTexts[key];
    saveCustomTexts();
}

function updateCustomTextsList() {
    var container = document.getElementById('customTextsList');
    if (!container) return;
    var html = '';
    for (var key in voucherElementsConfig) {
        if (key.indexOf('custom') !== 0) continue;
        var text = customTexts[key] || 'Text';
        html += '<div class="custom-text-item">';
        html += '<input type="text" id="customTextInput_' + key + '" class="prop-input" value="' + text.replace(/"/g, '&quot;') + '" onchange="updateCustomTextContent(\'' + key + '\')" style="flex:1;">';
        html += '<button class="prop-style-btn" title="Remove" onclick="removeCustomText(\'' + key + '\')" style="font-size:11px;color:#ef4444;flex-shrink:0;">&times;</button>';
        html += '</div>';
    }
    container.innerHTML = html;
    // Update add button state
    var addBtn = document.getElementById('btnAddCustomText');
    if (addBtn) addBtn.disabled = getCustomTextCount() >= MAX_CUSTOM_TEXTS;
    // Toggle empty hint
    var emptyHint = document.getElementById('customTextsEmpty');
    if (emptyHint) emptyHint.style.display = getCustomTextCount() > 0 ? 'none' : 'block';
}

function initSingleDraggable(el) {
    var isDragging = false;
    var hasMoved = false;
    var startX, startY, initialLeft, initialTop;

    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });

    function dragStart(e) {
        if (e.target.tagName.toLowerCase() === 'input') return;
        e.preventDefault();
        e.stopPropagation();

        var elKey = el.getAttribute('data-key');
        selectElement(elKey);

        isDragging = true;
        hasMoved = false;
        var clientX = e.clientX || e.touches[0].clientX;
        var clientY = e.clientY || e.touches[0].clientY;

        startX = clientX;
        startY = clientY;
        initialLeft = parseInt(el.style.left || 0);
        initialTop = parseInt(el.style.top || 0);

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('touchend', dragEnd);
    }

    function dragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        if (!hasMoved) {
            pushUndo();
            hasMoved = true;
        }

        var clientX = e.clientX || e.touches[0].clientX;
        var clientY = e.clientY || e.touches[0].clientY;

        var dx = (clientX - startX) / editorZoom;
        var dy = (clientY - startY) / editorZoom;

        var elKey = el.getAttribute('data-key');
        var cfg = voucherElementsConfig[elKey];
        if (cfg) {
            cfg.left = Math.round(initialLeft + dx);
            cfg.top = Math.round(initialTop + dy);
            el.style.left = cfg.left + 'px';
            el.style.top = cfg.top + 'px';

            checkSnap(elKey);
            el.style.left = cfg.left + 'px';
            el.style.top = cfg.top + 'px';

            var coords = document.getElementById('canvasCoords');
            if (coords) coords.textContent = 'X: ' + cfg.left + '  Y: ' + cfg.top;

            var propX = document.getElementById('propX');
            var propY = document.getElementById('propY');
            if (propX) propX.value = cfg.left;
            if (propY) propY.value = cfg.top;
        }
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('touchend', dragEnd);
        hideSnapGuides();
        saveElementsConfig();
    }
}

// ============================================
// PRESET LAYOUTS
// ============================================
var presetLayouts = {
    classic: {
        label: 'Classic',
        size: { width: 200, height: 100 },
        border: '1px dashed #aaa',
        bgColor: '#ffffff',
        borderRadius: 0,
        gradient: '',
        elements: {
            price:    { visible: true,  left: 0,   top: 0,  fontSize: 12, bold: true,  color: '#000000', fontFamily: 'Arial, sans-serif' },
            vendor:   { visible: true,  left: 35,  top: 5,  fontSize: 14, bold: true,  color: '#000000', fontFamily: 'Arial, sans-serif' },
            code:     { visible: true,  left: 35,  top: 30, fontSize: 18, bold: true,  color: '#000000', fontFamily: 'Arial, sans-serif' },
            duration: { visible: true,  left: 35,  top: 60, fontSize: 11, bold: false, color: '#000000', fontFamily: 'Arial, sans-serif' },
            login:    { visible: true,  left: 35,  top: 75, fontSize: 12, bold: false, color: '#000000', fontFamily: 'Arial, sans-serif' },
            qr:       { visible: false, left: 135, top: 5 }
        }
    },
    modern: {
        label: 'Modern',
        size: { width: 240, height: 120 },
        border: '2px solid #333',
        bgColor: '#f8f9fa',
        borderRadius: 8,
        gradient: '',
        elements: {
            price:    { visible: true,  left: 0,   top: 0,  fontSize: 11, bold: true,  color: '#ffffff', fontFamily: "'Segoe UI', sans-serif" },
            vendor:   { visible: true,  left: 40,  top: 8,  fontSize: 16, bold: true,  color: '#1a1a2e', fontFamily: "'Segoe UI', sans-serif", letterSpacing: 2, textTransform: 'uppercase' },
            code:     { visible: true,  left: 40,  top: 35, fontSize: 22, bold: true,  color: '#3b82f6', fontFamily: "'Courier New', monospace", letterSpacing: 3 },
            duration: { visible: true,  left: 40,  top: 70, fontSize: 11, bold: false, color: '#666666', fontFamily: "'Segoe UI', sans-serif" },
            login:    { visible: true,  left: 40,  top: 88, fontSize: 10, bold: false, color: '#999999', fontFamily: "'Segoe UI', sans-serif" },
            qr:       { visible: false, left: 170, top: 10 }
        }
    },
    centered: {
        label: 'Centered',
        size: { width: 220, height: 130 },
        border: '1px solid #3b82f6',
        bgColor: '#ffffff',
        borderRadius: 12,
        gradient: '',
        elements: {
            price:    { visible: false, left: 0,   top: 0 },
            vendor:   { visible: true,  left: 60,  top: 8,  fontSize: 13, bold: true,  color: '#3b82f6', fontFamily: "Arial, sans-serif", textTransform: 'uppercase', letterSpacing: 3 },
            code:     { visible: true,  left: 40,  top: 40, fontSize: 24, bold: true,  color: '#000000', fontFamily: "'Courier New', monospace", letterSpacing: 2 },
            duration: { visible: true,  left: 65,  top: 80, fontSize: 12, bold: false, color: '#555555', fontFamily: "Arial, sans-serif" },
            login:    { visible: true,  left: 55,  top: 100, fontSize: 11, bold: false, color: '#888888', fontFamily: "Arial, sans-serif" },
            qr:       { visible: false, left: 80,  top: 30 }
        }
    },
    compact: {
        label: 'Compact',
        size: { width: 180, height: 80 },
        border: '1px solid #ccc',
        bgColor: '#ffffff',
        borderRadius: 4,
        gradient: '',
        elements: {
            price:    { visible: false, left: 0,   top: 0 },
            vendor:   { visible: true,  left: 8,   top: 4,  fontSize: 10, bold: true,  color: '#666666', fontFamily: "Arial, sans-serif", textTransform: 'uppercase', letterSpacing: 1 },
            code:     { visible: true,  left: 8,   top: 22, fontSize: 20, bold: true,  color: '#000000', fontFamily: "'Courier New', monospace" },
            duration: { visible: true,  left: 8,   top: 52, fontSize: 10, bold: false, color: '#888888', fontFamily: "Arial, sans-serif" },
            login:    { visible: true,  left: 8,   top: 64, fontSize: 9,  bold: false, color: '#aaaaaa', fontFamily: "Arial, sans-serif" },
            qr:       { visible: false, left: 120, top: 5 }
        }
    },
    elegant: {
        label: 'Elegant',
        size: { width: 260, height: 130 },
        border: 'none',
        bgColor: '#1a1a2e',
        borderRadius: 10,
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        elements: {
            price:    { visible: false, left: 0,   top: 0 },
            vendor:   { visible: true,  left: 15,  top: 12, fontSize: 11, bold: false, color: '#e94560', fontFamily: "Georgia, serif", textTransform: 'uppercase', letterSpacing: 4 },
            code:     { visible: true,  left: 15,  top: 40, fontSize: 26, bold: true,  color: '#ffffff', fontFamily: "'Courier New', monospace", letterSpacing: 4, textShadow: true },
            duration: { visible: true,  left: 15,  top: 85, fontSize: 11, bold: false, color: '#cccccc', fontFamily: "Georgia, serif" },
            login:    { visible: true,  left: 15,  top: 105, fontSize: 10, bold: false, color: '#888888', fontFamily: "Georgia, serif" },
            qr:       { visible: false, left: 185, top: 15 }
        }
    },
    qrFocus: {
        label: 'QR Focus',
        size: { width: 250, height: 120 },
        border: '1px solid #ddd',
        bgColor: '#ffffff',
        borderRadius: 6,
        gradient: '',
        elements: {
            price:    { visible: false, left: 0,   top: 0 },
            vendor:   { visible: true,  left: 10,  top: 8,  fontSize: 12, bold: true,  color: '#333333', fontFamily: "Arial, sans-serif", textTransform: 'uppercase', letterSpacing: 1 },
            code:     { visible: true,  left: 10,  top: 32, fontSize: 18, bold: true,  color: '#000000', fontFamily: "'Courier New', monospace" },
            duration: { visible: true,  left: 10,  top: 65, fontSize: 10, bold: false, color: '#666666', fontFamily: "Arial, sans-serif" },
            login:    { visible: true,  left: 10,  top: 80, fontSize: 10, bold: false, color: '#999999', fontFamily: "Arial, sans-serif" },
            qr:       { visible: true,  left: 170, top: 15 }
        }
    }
};

function applyPresetLayout(presetKey) {
    var preset = presetLayouts[presetKey];
    if (!preset) return;
    pushUndo();

    // Apply voucher size
    voucherContainerSize = { width: preset.size.width, height: preset.size.height };
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        container.style.width = preset.size.width + 'px';
        container.style.height = preset.size.height + 'px';
    }
    localStorage.setItem('qv_container_size', JSON.stringify(voucherContainerSize));
    var cw = document.getElementById('canvasW');
    var ch = document.getElementById('canvasH');
    if (cw) cw.value = preset.size.width;
    if (ch) ch.value = preset.size.height;

    // Apply border
    voucherBorderStyle = preset.border;
    if (container) container.style.border = preset.border;
    localStorage.setItem('qv_border_style', preset.border);
    var borderSelect = document.getElementById('voucherBorder');
    if (borderSelect) {
        var found = false;
        for (var i = 0; i < borderSelect.options.length; i++) {
            if (borderSelect.options[i].value === preset.border) {
                borderSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) borderSelect.selectedIndex = 0;
    }

    // Apply bg color
    voucherBgColor = preset.bgColor;
    if (container) container.style.backgroundColor = preset.bgColor;
    localStorage.setItem('qv_bg_color', preset.bgColor);
    var bgInput = document.getElementById('voucherBgColor');
    if (bgInput) bgInput.value = preset.bgColor;
    var bgLabel = document.getElementById('voucherBgColorLabel');
    if (bgLabel) bgLabel.textContent = preset.bgColor;

    // Apply border radius
    voucherBorderRadius = preset.borderRadius;
    if (container) container.style.borderRadius = preset.borderRadius + 'px';
    localStorage.setItem('qv_border_radius', preset.borderRadius);
    var radiusInput = document.getElementById('voucherBorderRadius');
    if (radiusInput) radiusInput.value = preset.borderRadius;
    var radiusVal = document.getElementById('borderRadiusVal');
    if (radiusVal) radiusVal.textContent = preset.borderRadius + 'px';

    // Apply gradient
    voucherGradient = preset.gradient || '';
    if (container) container.style.backgroundImage = voucherGradient || 'none';
    localStorage.setItem('qv_gradient', voucherGradient);
    var gradSelect = document.getElementById('voucherGradient');
    if (gradSelect) {
        var gFound = false;
        for (var i = 0; i < gradSelect.options.length; i++) {
            if (gradSelect.options[i].value === voucherGradient) {
                gradSelect.selectedIndex = i;
                gFound = true;
                break;
            }
        }
        if (!gFound) gradSelect.selectedIndex = 0;
    }

    // Apply element configs
    for (var key in preset.elements) {
        if (!voucherElementsConfig[key]) continue;
        var pe = preset.elements[key];
        var cfg = voucherElementsConfig[key];
        cfg.visible = pe.visible !== undefined ? pe.visible : cfg.visible;
        cfg.left = pe.left !== undefined ? pe.left : cfg.left;
        cfg.top = pe.top !== undefined ? pe.top : cfg.top;
        if (pe.fontSize !== undefined) cfg.fontSize = pe.fontSize;
        if (pe.bold !== undefined) cfg.bold = pe.bold;
        if (pe.color !== undefined) cfg.color = pe.color;
        if (pe.fontFamily !== undefined) cfg.fontFamily = pe.fontFamily;
        if (pe.letterSpacing !== undefined) cfg.letterSpacing = pe.letterSpacing;
        if (pe.textTransform !== undefined) cfg.textTransform = pe.textTransform;
        if (pe.textShadow !== undefined) cfg.textShadow = pe.textShadow;
        // Reset other advanced props to defaults
        if (pe.letterSpacing === undefined) cfg.letterSpacing = 0;
        if (pe.textTransform === undefined) cfg.textTransform = 'none';
        if (pe.textShadow === undefined) cfg.textShadow = false;
        cfg.textDecoration = 'none';
        cfg.italic = false;
        cfg.rotation = 0;
        cfg.bgColor = 'transparent';
        cfg.lineHeight = 1.2;
        cfg.padding = 0;
        cfg.boxShadow = false;
        cfg.opacity = 1;
    }

    applyAllElementStyles();
    saveElementsConfig();
    renderLayers();
    updatePropertiesPanel();
    // Update price bar height
    var priceEl = document.getElementById('dragPrice');
    if (priceEl) priceEl.style.height = preset.size.height + 'px';
    editorZoomFit();
}

// ============================================
// VOUCHER-LEVEL STYLE PROPERTIES
// ============================================
function applyVoucherBgColor() {
    var c = document.getElementById('voucherBgColor').value;
    voucherBgColor = c;
    var label = document.getElementById('voucherBgColorLabel');
    if (label) label.textContent = c;
    var container = document.getElementById('dragVoucherContainer');
    if (container) container.style.backgroundColor = c;
    localStorage.setItem('qv_bg_color', c);
}

function applyBorderRadius() {
    pushUndo();
    var val = parseInt(document.getElementById('voucherBorderRadius').value) || 0;
    voucherBorderRadius = val;
    var label = document.getElementById('borderRadiusVal');
    if (label) label.textContent = val + 'px';
    var container = document.getElementById('dragVoucherContainer');
    if (container) container.style.borderRadius = val + 'px';
    localStorage.setItem('qv_border_radius', val);
}

function applyVoucherGradient() {
    pushUndo();
    var val = document.getElementById('voucherGradient').value;
    voucherGradient = val;
    var container = document.getElementById('dragVoucherContainer');
    if (container) container.style.backgroundImage = val || 'none';
    localStorage.setItem('qv_gradient', val);
}

function distributeElements(axis) {
    // Distribute visible elements evenly along axis
    var visibleKeys = [];
    for (var i = 0; i < layerOrder.length; i++) {
        var key = layerOrder[i];
        if (voucherElementsConfig[key] && voucherElementsConfig[key].visible) {
            visibleKeys.push(key);
        }
    }
    if (visibleKeys.length < 2) return;
    pushUndo();

    if (axis === 'horizontal') {
        var total = voucherContainerSize.width;
        var step = Math.round(total / (visibleKeys.length + 1));
        for (var j = 0; j < visibleKeys.length; j++) {
            voucherElementsConfig[visibleKeys[j]].left = step * (j + 1) - 20;
        }
    } else {
        var total = voucherContainerSize.height;
        var step = Math.round(total / (visibleKeys.length + 1));
        for (var j = 0; j < visibleKeys.length; j++) {
            voucherElementsConfig[visibleKeys[j]].top = step * (j + 1) - 8;
        }
    }

    applyAllElementStyles();
    saveElementsConfig();
    updatePropertiesPanel();
}

// ============================================
// APPLY ELEMENT STYLES
// ============================================
function applyElementStyle(key) {
    var cfg = voucherElementsConfig[key];
    if (!cfg) return;
    var el = document.getElementById(cfg.id);
    if (!el) return;

    el.style.left = cfg.left + 'px';
    el.style.top = cfg.top + 'px';
    el.style.opacity = cfg.opacity !== undefined ? cfg.opacity : 1;

    // Visibility
    if (key === 'price') {
        el.style.display = cfg.visible ? 'flex' : 'none';
    } else {
        el.style.display = cfg.visible ? 'block' : 'none';
    }

    // Typography (skip for QR and special handling for Price)
    if (key !== 'qr') {
        el.style.fontSize = (cfg.fontSize || 12) + 'px';
        el.style.fontFamily = cfg.fontFamily || 'Arial, sans-serif';
        el.style.color = cfg.color || '#000000';
        el.style.fontWeight = cfg.bold ? 'bold' : 'normal';
        el.style.fontStyle = cfg.italic ? 'italic' : 'normal';
        el.style.textTransform = cfg.textTransform || 'none';
        el.style.textDecoration = cfg.textDecoration || 'none';
        el.style.letterSpacing = (cfg.letterSpacing || 0) + 'px';
        el.style.textShadow = cfg.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none';
        el.style.backgroundColor = cfg.bgColor || 'transparent';
        el.style.lineHeight = (cfg.lineHeight || 1.2).toString();
        if (cfg.padding) {
            el.style.padding = cfg.padding + 'px';
        } else {
            el.style.padding = '';
        }
    }

    // Box shadow (all elements)
    el.style.boxShadow = cfg.boxShadow ? '0 2px 8px rgba(0,0,0,0.25)' : '';

    // Rotation (for all elements including QR, but skip price's built-in rotation)
    if (key === 'price') {
        el.style.transform = 'rotate(180deg)' + (cfg.rotation ? ' rotate(' + cfg.rotation + 'deg)' : '');
    } else if (cfg.rotation) {
        el.style.transform = 'rotate(' + cfg.rotation + 'deg)';
    } else {
        el.style.transform = '';
    }
}

function applyAllElementStyles() {
    for (var key in voucherElementsConfig) {
        applyElementStyle(key);
    }
    // Also update price bar height
    var container = document.getElementById('dragVoucherContainer');
    var priceEl = document.getElementById('dragPrice');
    if (container && priceEl && voucherElementsConfig.price.visible) {
        priceEl.style.height = container.offsetHeight + 'px';
    }
}

// ============================================
// LAYERS PANEL
// ============================================
function renderLayers() {
    var container = document.getElementById('layersList');
    if (!container) return;

    var html = '';
    for (var i = 0; i < layerOrder.length; i++) {
        var key = layerOrder[i];
        var cfg = voucherElementsConfig[key];
        if (!cfg) continue;
        var name = LAYER_NAMES[key] || key;
        var isSelected = selectedElementKey === key;
        var isVisible = cfg.visible;

        html += '<div class="layer-item' + (isSelected ? ' active' : '') + (isVisible ? '' : ' hidden-layer') + '" data-key="' + key + '">';
        html += '<div class="layer-eye' + (isVisible ? ' visible' : '') + '" onclick="toggleLayerVisibility(\'' + key + '\', event)" title="' + (isVisible ? 'Hide' : 'Show') + '">';
        if (isVisible) {
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        } else {
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        }
        html += '</div>';
        html += '<span class="layer-name" onclick="selectElement(\'' + key + '\')">' + name + '</span>';
        html += '<div class="layer-order-btns">';
        html += '<button class="layer-order-btn" onclick="moveLayer(\'' + key + '\', -1, event)" title="Move Up">&uarr;</button>';
        html += '<button class="layer-order-btn" onclick="moveLayer(\'' + key + '\', 1, event)" title="Move Down">&darr;</button>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function toggleLayerVisibility(key, e) {
    pushUndo();
    if (e) e.stopPropagation();
    var cfg = voucherElementsConfig[key];
    if (!cfg) return;
    pushUndo();
    cfg.visible = !cfg.visible;
    applyElementStyle(key);
    saveElementsConfig();
    renderLayers();
}

function moveLayer(key, direction, e) {
    pushUndo();
    if (e) e.stopPropagation();
    var idx = layerOrder.indexOf(key);
    if (idx === -1) return;
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= layerOrder.length) return;
    // Swap
    var temp = layerOrder[idx];
    layerOrder[idx] = layerOrder[newIdx];
    layerOrder[newIdx] = temp;
    // Update z-indices
    for (var i = 0; i < layerOrder.length; i++) {
        var el = document.getElementById(voucherElementsConfig[layerOrder[i]].id);
        if (el) el.style.zIndex = layerOrder.length - i;
    }
    localStorage.setItem('qv_layer_order', JSON.stringify(layerOrder));
    renderLayers();
}

// ============================================
// ZOOM
// ============================================
function editorSetZoom(z) {
    editorZoom = Math.max(0.25, Math.min(4, z));
    var scaler = document.getElementById('canvasScaler');
    if (scaler) {
        scaler.style.transform = 'scale(' + editorZoom + ')';
    }
    var label = document.getElementById('zoomLabel');
    if (label) label.textContent = Math.round(editorZoom * 100) + '%';
}

function editorZoomFit() {
    var workspace = document.getElementById('canvasWorkspace');
    var container = document.getElementById('dragVoucherContainer');
    if (!workspace || !container) return;

    var ww = workspace.clientWidth - 80;
    var wh = workspace.clientHeight - 80;
    var cw = voucherContainerSize.width;
    var ch = voucherContainerSize.height;

    var zoom = Math.min(ww / cw, wh / ch, 4);
    zoom = Math.max(0.25, Math.round(zoom * 4) / 4); // Round to nearest 0.25
    editorSetZoom(zoom);
}

// ============================================
// GRID
// ============================================
function toggleGrid() {
    showGrid = !showGrid;
    var overlay = document.getElementById('canvasGridOverlay');
    var btn = document.getElementById('btnGrid');
    if (overlay) overlay.classList.toggle('visible', showGrid);
    if (btn) btn.classList.toggle('active', showGrid);
}

// ============================================
// ALIGNMENT
// ============================================
function alignElement(alignment) {
    if (!selectedElementKey) return;
    var cfg = voucherElementsConfig[selectedElementKey];
    var el = document.getElementById(cfg.id);
    if (!el || !cfg.visible) return;

    pushUndo();

    var cw = voucherContainerSize.width;
    var ch = voucherContainerSize.height;
    var ew = el.offsetWidth;
    var eh = el.offsetHeight;

    switch (alignment) {
        case 'left':    cfg.left = 0; break;
        case 'centerH': cfg.left = Math.round((cw - ew) / 2); break;
        case 'right':   cfg.left = cw - ew; break;
        case 'top':     cfg.top = 0; break;
        case 'centerV': cfg.top = Math.round((ch - eh) / 2); break;
        case 'bottom':  cfg.top = ch - eh; break;
    }

    applyElementStyle(selectedElementKey);
    saveElementsConfig();
    updatePropertiesPanel();
}

// ============================================
// CANVAS SIZE
// ============================================
function setCanvasSize() {
    pushUndo();
    var w = parseInt(document.getElementById('canvasW').value) || 200;
    var h = parseInt(document.getElementById('canvasH').value) || 100;
    w = Math.max(100, Math.min(800, w));
    h = Math.max(50, Math.min(600, h));
    voucherContainerSize.width = w;
    voucherContainerSize.height = h;
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        container.style.width = w + 'px';
        container.style.height = h + 'px';
    }
    // Update price bar height
    var priceEl = document.getElementById('dragPrice');
    if (priceEl) priceEl.style.height = h + 'px';
    localStorage.setItem('qv_container_size', JSON.stringify(voucherContainerSize));
}

// ============================================
// TAG COLOR & BORDER
// ============================================
function applyTagColor() {
    var c = document.getElementById('TagColor').value;
    var label = document.getElementById('tagColorLabel');
    if (label) label.textContent = c;
    var priceEl = document.getElementById('dragPrice');
    if (priceEl && !templateBg) {
        priceEl.style.backgroundColor = c;
    }
}

function applyBorderStyle() {
    var val = document.getElementById('voucherBorder').value;
    voucherBorderStyle = val;
    var container = document.getElementById('dragVoucherContainer');
    if (container) container.style.border = val;
    localStorage.setItem('qv_border_style', val);
}

// Legacy color function
function color() {
    applyTagColor();
}

// ============================================
// BUILD SCRIPT & VOUCHER
// ============================================
function buildScript(code, userpass, cfg) {
    var s = 'add name="' + code + '"';
    if (userpass) s += ' password="' + code + '"';
    s += ' server="' + cfg.server + '"';
    s += ' profile="' + cfg.profile + '"';
    s += ' limit-uptime="' + cfg.uptime + '"';
    s += ' comment="' + cfg.vendo + '"';
    if (cfg.data && cfg.data !== '0' && cfg.data !== '') {
        s += ' limit-bytes-total="' + cfg.data + '"';
    }
    return s;
}

function buildElementInlineStyle(elCfg, isPrice, containerHeight) {
    var s = 'position: absolute; left: ' + elCfg.left + 'px; top: ' + elCfg.top + 'px;';
    s += ' font-size: ' + (elCfg.fontSize || 12) + 'px;';
    s += ' font-family: ' + (elCfg.fontFamily || 'Arial, sans-serif') + ';';
    s += ' color: ' + (elCfg.color || '#000000') + ';';
    s += ' font-weight: ' + (elCfg.bold ? 'bold' : 'normal') + ';';
    s += ' font-style: ' + (elCfg.italic ? 'italic' : 'normal') + ';';
    s += ' opacity: ' + (elCfg.opacity !== undefined ? elCfg.opacity : 1) + ';';
    s += ' white-space: nowrap;';
    // Advanced typography
    if (elCfg.textTransform && elCfg.textTransform !== 'none') s += ' text-transform: ' + elCfg.textTransform + ';';
    if (elCfg.textDecoration && elCfg.textDecoration !== 'none') s += ' text-decoration: ' + elCfg.textDecoration + ';';
    if (elCfg.letterSpacing) s += ' letter-spacing: ' + elCfg.letterSpacing + 'px;';
    if (elCfg.textShadow) s += ' text-shadow: 1px 1px 2px rgba(0,0,0,0.5);';
    if (elCfg.lineHeight && elCfg.lineHeight !== 1.2) s += ' line-height: ' + elCfg.lineHeight + ';';
    if (elCfg.bgColor && elCfg.bgColor !== 'transparent') s += ' background-color: ' + elCfg.bgColor + '; -webkit-print-color-adjust: exact;';
    if (elCfg.padding) s += ' padding: ' + elCfg.padding + 'px;';
    else if (elCfg.bgColor && elCfg.bgColor !== 'transparent') s += ' padding: 1px 3px;';
    if (elCfg.boxShadow) s += ' box-shadow: 0 2px 8px rgba(0,0,0,0.25);';
    if (isPrice) {
        s += ' width: 30px; height: ' + containerHeight + 'px;';
        s += ' writing-mode: vertical-rl; text-orientation: mixed;';
        var priceTransform = 'rotate(180deg)';
        if (elCfg.rotation) priceTransform += ' rotate(' + elCfg.rotation + 'deg)';
        s += ' transform: ' + priceTransform + ';';
        s += ' display: flex; align-items: center; justify-content: center;';
        s += ' border-right: 1px solid #ccc; -webkit-print-color-adjust: exact;';
    } else if (elCfg.rotation) {
        s += ' transform: rotate(' + elCfg.rotation + 'deg);';
    }
    return s;
}

function buildVoucher(code, userpass, qr, cfg) {
    var bgStyle = '';
    if (templateBg) {
        bgStyle = 'background-image:url(' + templateBg + ');background-size:cover;background-repeat:no-repeat;background-position:center;';
    }

    var w = voucherContainerSize.width;
    var vh = voucherContainerSize.height;
    var border = voucherBorderStyle || '1px dashed #ccc';

    var bgColor = voucherBgColor || '#ffffff';
    var bRadius = voucherBorderRadius ? 'border-radius: ' + voucherBorderRadius + 'px;' : '';
    var gradientStyle = voucherGradient ? 'background-image: ' + voucherGradient + ';' : '';
    var h = '<div class="voucher" style="width: ' + w + 'px; height: ' + vh + 'px; position: relative; border: ' + border + '; background-color: ' + bgColor + '; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; page-break-inside: avoid; margin: 5px; float: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + bRadius + ' ' + gradientStyle + ' ' + bgStyle + '">';

    // Price
    var cPrice = voucherElementsConfig.price;
    if (cPrice && cPrice.visible) {
        var sidebarBg = templateBg ? 'transparent' : cfg.color;
        var priceStyle = buildElementInlineStyle(cPrice, true, vh);
        priceStyle += ' background-color: ' + sidebarBg + ';';
        h += '<div style="' + priceStyle + '">' + cfg.currency + ' ' + cfg.price + '</div>';
    }

    // Tag name
    var cVendor = voucherElementsConfig.vendor;
    if (cVendor && cVendor.visible) {
        h += '<div style="' + buildElementInlineStyle(cVendor, false, vh) + '">' + cfg.vendo + '</div>';
    }

    // Code
    var cCode = voucherElementsConfig.code;
    if (cCode && cCode.visible) {
        h += '<div style="' + buildElementInlineStyle(cCode, false, vh) + '">' + code + '</div>';
    }

    // Duration
    var cDur = voucherElementsConfig.duration;
    if (cDur && cDur.visible) {
        h += '<div style="' + buildElementInlineStyle(cDur, false, vh) + '">Duration: ' + cfg.durDisplay + '</div>';
    }

    // Login info
    var cLog = voucherElementsConfig.login;
    if (cLog && cLog.visible && cfg.ip) {
        h += '<div style="' + buildElementInlineStyle(cLog, false, vh) + '">Login: <b style="font-weight:700">http://' + cfg.ip + '</b></div>';
    }

    // QR code
    var cQR = voucherElementsConfig.qr;
    if (qr && cQR && cQR.visible) {
        var url = 'http://' + cfg.ip + '/login?username=' + code;
        if (userpass) url += '&password=' + code;
        var qs = qrCodeSize || 60;
        var qrStyle = 'position: absolute; left: ' + cQR.left + 'px; top: ' + cQR.top + 'px; opacity: ' + (cQR.opacity !== undefined ? cQR.opacity : 1) + ';';
        if (cQR.rotation) qrStyle += ' transform: rotate(' + cQR.rotation + 'deg);';
        if (cQR.boxShadow) qrStyle += ' box-shadow: 0 2px 8px rgba(0,0,0,0.25);';
        h += '<div style="' + qrStyle + '">';
        h += '<img class="qr-img p-1" src="https://api.qrserver.com/v1/create-qr-code/?size=' + qs + 'x' + qs + '&data=' + encodeURIComponent(url) + '" width="' + qs + '" height="' + qs + '" style="background: white;">';
        h += '</div>';
    }

    // Custom text fields
    for (var ck in voucherElementsConfig) {
        if (ck.indexOf('custom') !== 0) continue;
        var cCustom = voucherElementsConfig[ck];
        if (cCustom && cCustom.visible && customTexts[ck]) {
            h += '<div style="' + buildElementInlineStyle(cCustom, false, vh) + '">' + customTexts[ck] + '</div>';
        }
    }

    h += '</div>';
    return h;
}

// ---- Main Generate Function ----
function Generate() {
    var vendo = $('#Vendo').val() || 'EasyBox';
    var prefix = $('#Prefix').val() || '';
    var price = $('#Price').val() || '0';
    var qty = parseInt($('#Quantity').val()) || 1;
    var len = parseInt($('#Length').val()) || 6;
    var charType = $('#char').val() || '1';
    var isUserPass = $('#userpass').is(':checked');
    var hasQr = voucherElementsConfig.qr.visible;

    var lD = $('#LDays').val() || '0';
    var lH = $('#LHours').val() || '0';
    var lM = $('#LMinutes').val() || '0';
    var uptime = calcMins(lD, lH, lM) + 'm';
    var durDisplay = fmtDuration(lD, lH, lM);

    var vD = $('#VDays').val() || '0';
    var vH = $('#VHours').val() || '0';
    var vM = $('#VMinutes').val() || '0';
    var validity = calcMins(vD, vH, vM) + 'm';

    var data = $('#Data').val() || '0';
    var profile = $('#Profile').val() || 'default';
    var server = $('#Server').val() || 'all';
    var ip = $('#ip').val() || '';
    var currency = $('#currency').val() || 'PHP';
    var tagColor = $('#TagColor').val() || '#ffea8f';

    var cfg = {
        vendo: vendo, price: price, uptime: uptime, validity: validity,
        data: data, profile: profile, server: server, ip: ip,
        currency: currency, color: tagColor, durDisplay: durDisplay
    };

    var script = '';
    var print = '';

    for (var i = 0; i < qty; i++) {
        var code = makeCode(prefix, len, charType);
        script += buildScript(code, isUserPass, cfg) + '<br>';
        print += buildVoucher(code, isUserPass, hasQr, cfg);
    }

    $('#Output').html(script);
    $('#PrintBody').html(print);
    $('#Total').html('Total: ' + currency + ' ' + (qty * parseFloat(price)));
}

// ---- Download .rsc File ----
function DownloadScript() {
    var name = ($('#Vendo').val() || 'voucher') + '_' + ($('#Prefix').val() || '') + '_' + ($('#Quantity').val() || '0') + 'pcs_' + getDateStr() + '.rsc';
    var content = document.getElementById('OutputCode').innerText;
    var a = document.createElement('a');
    a.setAttribute('download', name);
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ---- Print Vouchers ----
var printSelectedTemplate = null; // null = use current, '' = none, or template id

function printvoucher() {
    var body = document.getElementById('PrintBody');
    if (!body || !body.innerHTML.trim()) {
        alert('Generate vouchers first before printing.');
        return;
    }
    printSelectedTemplate = null;
    renderPrintTemplateGallery();
    updatePrintPreview();
    var modal = new bootstrap.Modal(document.getElementById('printOptionsModal'));
    modal.show();
}

function renderPrintTemplateGallery() {
    var container = document.getElementById('printTemplateGallery');
    if (!container) return;
    var list = getTemplates();
    var activeId = getActiveTemplateId();

    var html = '';
    // "Current" option - uses whatever is currently set
    html += '<div class="print-tpl-item selected" data-tpl-id="__current__" onclick="selectPrintTemplate(this, \'__current__\')">';
    if (templateBg) {
        html += '<img src="' + templateBg + '" alt="Current">';
    } else {
        html += '<div class="tpl-none-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>';
    }
    html += '<div class="print-tpl-item-name">Current</div></div>';

    // "None" option
    html += '<div class="print-tpl-item" data-tpl-id="" onclick="selectPrintTemplate(this, \'\')">';
    html += '<div class="tpl-none-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
    html += '<div class="print-tpl-item-name">None</div></div>';

    // All saved templates
    for (var i = 0; i < list.length; i++) {
        var t = list[i];
        html += '<div class="print-tpl-item" data-tpl-id="' + t.id + '" onclick="selectPrintTemplate(this, \'' + t.id + '\')">';
        html += '<img src="' + t.data + '" alt="' + t.name + '">';
        html += '<div class="print-tpl-item-name">' + t.name + '</div></div>';
    }

    container.innerHTML = html;
}

function selectPrintTemplate(el, tplId) {
    // Update selection UI
    var items = document.querySelectorAll('#printTemplateGallery .print-tpl-item');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('selected');
    el.classList.add('selected');

    printSelectedTemplate = tplId;
    updatePrintPreview();
}

function updatePrintPreview() {
    var previewArea = document.getElementById('printPreviewArea');
    if (!previewArea) return;

    var body = document.getElementById('PrintBody');
    if (!body || !body.innerHTML.trim()) {
        previewArea.innerHTML = '<p class="text-muted">Generate vouchers first to see preview.</p>';
        return;
    }

    if (printSelectedTemplate === null || printSelectedTemplate === '__current__') {
        // Use current PrintBody as-is
        previewArea.innerHTML = body.innerHTML;
    } else {
        // Rebuild vouchers with selected template
        var bgData = '';
        if (printSelectedTemplate !== '') {
            var list = getTemplates();
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === printSelectedTemplate) { bgData = list[i].data; break; }
            }
        }
        // Replace background in all voucher divs
        var temp = document.createElement('div');
        temp.innerHTML = body.innerHTML;
        var vouchers = temp.querySelectorAll('.voucher');
        for (var j = 0; j < vouchers.length; j++) {
            if (bgData) {
                vouchers[j].style.backgroundImage = 'url(' + bgData + ')';
                vouchers[j].style.backgroundSize = 'cover';
                vouchers[j].style.backgroundRepeat = 'no-repeat';
                vouchers[j].style.backgroundPosition = 'center';
            } else {
                vouchers[j].style.backgroundImage = '';
            }
        }
        previewArea.innerHTML = temp.innerHTML;
    }
}

function executePrint() {
    var previewArea = document.getElementById('printPreviewArea');
    if (!previewArea || !previewArea.innerHTML.trim()) return;

    copyCode();
    var title = ($('#Vendo').val() || 'voucher') + '_' + ($('#Prefix').val() || '') + '_' + ($('#Quantity').val() || '0') + 'pcs_' + getDateStr();
    var html = previewArea.innerHTML;

    // Close modal
    var modalEl = document.getElementById('printOptionsModal');
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    var win = window.open('', '', 'height=800,width=800');
    win.document.write('<link href="' + VOUCHER_CSS + '" rel="stylesheet">');
    setTimeout(function () {
        win.document.write('<html><body><title>' + title + '</title>' + html + '</body></html>');
        win.print();
    }, 150);
}

// ---- Reset Form ----
function rst() {
    document.getElementById('rst').reset();
}

// ---- Copy to Clipboard ----
function copyCode() {
    var el = document.getElementById('OutputCode');
    if (!el) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.innerText);
    } else {
        var sel = window.getSelection();
        sel.removeAllRanges();
        var range = document.createRange();
        range.selectNodeContents(el);
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
    }
}

// ============================================
// SNAP GUIDES
// ============================================
var SNAP_THRESHOLD = 5;

function checkSnap(key) {
    var cfg = voucherElementsConfig[key];
    var el = document.getElementById(cfg.id);
    if (!el) return;

    var guideH = document.getElementById('snapGuideH');
    var guideV = document.getElementById('snapGuideV');

    var cw = voucherContainerSize.width;
    var ch = voucherContainerSize.height;
    var ew = el.offsetWidth;
    var eh = el.offsetHeight;

    var centerX = cfg.left + ew / 2;
    var centerY = cfg.top + eh / 2;
    var canvasCenterX = cw / 2;
    var canvasCenterY = ch / 2;

    var snappedX = false;
    var snappedY = false;

    // Snap to horizontal center
    if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
        cfg.left = Math.round(canvasCenterX - ew / 2);
        if (guideV) {
            guideV.style.left = canvasCenterX + 'px';
            guideV.style.display = 'block';
        }
        snappedX = true;
    }

    // Snap to vertical center
    if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
        cfg.top = Math.round(canvasCenterY - eh / 2);
        if (guideH) {
            guideH.style.top = canvasCenterY + 'px';
            guideH.style.display = 'block';
        }
        snappedY = true;
    }

    // Snap to edges
    if (!snappedX && Math.abs(cfg.left) < SNAP_THRESHOLD) {
        cfg.left = 0;
        if (guideV) { guideV.style.left = '0px'; guideV.style.display = 'block'; }
        snappedX = true;
    }
    if (!snappedX && Math.abs(cfg.left + ew - cw) < SNAP_THRESHOLD) {
        cfg.left = cw - ew;
        if (guideV) { guideV.style.left = cw + 'px'; guideV.style.display = 'block'; }
        snappedX = true;
    }

    if (!snappedY && Math.abs(cfg.top) < SNAP_THRESHOLD) {
        cfg.top = 0;
        if (guideH) { guideH.style.top = '0px'; guideH.style.display = 'block'; }
        snappedY = true;
    }
    if (!snappedY && Math.abs(cfg.top + eh - ch) < SNAP_THRESHOLD) {
        cfg.top = ch - eh;
        if (guideH) { guideH.style.top = ch + 'px'; guideH.style.display = 'block'; }
        snappedY = true;
    }

    if (!snappedX && guideV) guideV.style.display = 'none';
    if (!snappedY && guideH) guideH.style.display = 'none';
}

function hideSnapGuides() {
    var guideH = document.getElementById('snapGuideH');
    var guideV = document.getElementById('snapGuideV');
    if (guideH) guideH.style.display = 'none';
    if (guideV) guideV.style.display = 'none';
}

// ============================================
// SAVE / LOAD ELEMENTS CONFIG
// ============================================
function saveElementsConfig() {
    for (var key in voucherElementsConfig) {
        var elConf = voucherElementsConfig[key];
        var el = document.getElementById(elConf.id);
        if (el) {
            elConf.left = parseInt(el.style.left || 0);
            elConf.top = parseInt(el.style.top || 0);
        }
    }
    localStorage.setItem('qv_elements_config', JSON.stringify(voucherElementsConfig));
}

// ============================================
// DRAG AND DROP
// ============================================
function initDraggables() {
    var container = document.getElementById('dragVoucherContainer');
    if (!container) return;

    // Load saved container size
    try {
        var savedSize = localStorage.getItem('qv_container_size');
        if (savedSize) {
            voucherContainerSize = JSON.parse(savedSize);
            container.style.width = voucherContainerSize.width + 'px';
            container.style.height = voucherContainerSize.height + 'px';
        }
    } catch (e) {}

    // Update canvas size inputs
    var canvasW = document.getElementById('canvasW');
    var canvasH = document.getElementById('canvasH');
    if (canvasW) canvasW.value = voucherContainerSize.width;
    if (canvasH) canvasH.value = voucherContainerSize.height;

    // Load saved element config
    try {
        var saved = localStorage.getItem('qv_elements_config');
        if (saved) {
            var parsed = JSON.parse(saved);
            for (var key in parsed) {
                if (voucherElementsConfig[key]) {
                    voucherElementsConfig[key] = parsed[key];
                }
            }
            ensureDefaults(voucherElementsConfig);
        }
    } catch (e) {}

    // Load saved layer order
    try {
        var savedOrder = localStorage.getItem('qv_layer_order');
        if (savedOrder) {
            var parsedOrder = JSON.parse(savedOrder);
            if (Array.isArray(parsedOrder) && parsedOrder.length >= 6) {
                layerOrder = parsedOrder;
            }
        }
    } catch (e) {}

    // Load saved border style
    try {
        var savedBorder = localStorage.getItem('qv_border_style');
        if (savedBorder) {
            voucherBorderStyle = savedBorder;
            container.style.border = savedBorder;
            var borderSelect = document.getElementById('voucherBorder');
            if (borderSelect) {
                for (var i = 0; i < borderSelect.options.length; i++) {
                    if (borderSelect.options[i].value === savedBorder) {
                        borderSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    } catch (e) {}

    // Load saved background color
    try {
        var savedBgColor = localStorage.getItem('qv_bg_color');
        if (savedBgColor) {
            voucherBgColor = savedBgColor;
            container.style.backgroundColor = savedBgColor;
            var bgColorInput = document.getElementById('voucherBgColor');
            if (bgColorInput) bgColorInput.value = savedBgColor;
            var bgColorLabel = document.getElementById('voucherBgColorLabel');
            if (bgColorLabel) bgColorLabel.textContent = savedBgColor;
        }
    } catch (e) {}

    // Load saved border radius
    try {
        var savedRadius = localStorage.getItem('qv_border_radius');
        if (savedRadius) {
            voucherBorderRadius = parseInt(savedRadius) || 0;
            container.style.borderRadius = voucherBorderRadius + 'px';
            var radiusInput = document.getElementById('voucherBorderRadius');
            if (radiusInput) radiusInput.value = voucherBorderRadius;
            var radiusVal = document.getElementById('borderRadiusVal');
            if (radiusVal) radiusVal.textContent = voucherBorderRadius + 'px';
        }
    } catch (e) {}

    // Load saved gradient
    try {
        var savedGradient = localStorage.getItem('qv_gradient');
        if (savedGradient) {
            voucherGradient = savedGradient;
            container.style.backgroundImage = savedGradient;
            var gradSelect = document.getElementById('voucherGradient');
            if (gradSelect) {
                for (var i = 0; i < gradSelect.options.length; i++) {
                    if (gradSelect.options[i].value === savedGradient) {
                        gradSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    } catch (e) {}

    // Load saved QR size
    try {
        var savedQrSize = localStorage.getItem('qv_qr_size');
        if (savedQrSize) {
            qrCodeSize = parseInt(savedQrSize) || 60;
            var qrImg = document.querySelector('#dragQR img');
            if (qrImg) {
                qrImg.width = qrCodeSize;
                qrImg.height = qrCodeSize;
            }
        }
    } catch (e) {}

    // Apply config to elements
    applyAllElementStyles();

    // Apply z-indices from layer order
    for (var i = 0; i < layerOrder.length; i++) {
        var lKey = layerOrder[i];
        if (voucherElementsConfig[lKey]) {
            var lEl = document.getElementById(voucherElementsConfig[lKey].id);
            if (lEl) lEl.style.zIndex = layerOrder.length - i;
        }
    }

    // Drag logic
    var dragElements = document.querySelectorAll('.drag-el');
    dragElements.forEach(function (el) {
        var isDragging = false;
        var hasMoved = false;
        var startX, startY, initialLeft, initialTop;

        el.addEventListener('mousedown', dragStart);
        el.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.tagName.toLowerCase() === 'input') return;
            e.preventDefault();
            e.stopPropagation();

            var elKey = el.getAttribute('data-key');
            selectElement(elKey);

            isDragging = true;
            hasMoved = false;
            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;

            startX = clientX;
            startY = clientY;
            initialLeft = parseInt(el.style.left || 0);
            initialTop = parseInt(el.style.top || 0);

            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        }

        function dragMove(e) {
            if (!isDragging) return;
            e.preventDefault();

            if (!hasMoved) {
                pushUndo();
                hasMoved = true;
            }

            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;

            var dx = (clientX - startX) / editorZoom;
            var dy = (clientY - startY) / editorZoom;

            var elKey = el.getAttribute('data-key');
            var cfg = voucherElementsConfig[elKey];
            if (cfg) {
                cfg.left = Math.round(initialLeft + dx);
                cfg.top = Math.round(initialTop + dy);
                el.style.left = cfg.left + 'px';
                el.style.top = cfg.top + 'px';

                checkSnap(elKey);
                el.style.left = cfg.left + 'px';
                el.style.top = cfg.top + 'px';

                // Update coordinates display
                var coords = document.getElementById('canvasCoords');
                if (coords) coords.textContent = 'X: ' + cfg.left + '  Y: ' + cfg.top;

                // Update properties panel position fields
                var propX = document.getElementById('propX');
                var propY = document.getElementById('propY');
                if (propX) propX.value = cfg.left;
                if (propY) propY.value = cfg.top;
            }
        }

        function dragEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);
            hideSnapGuides();
            saveElementsConfig();
        }
    });

    // Click on canvas background to deselect
    container.addEventListener('mousedown', function (e) {
        if (e.target === container || e.target.classList.contains('canvas-grid-overlay')) {
            deselectAll();
        }
    });

    // Resize tracking
    var resizeObserver = new ResizeObserver(function (entries) {
        for (var j = 0; j < entries.length; j++) {
            var entry = entries[j];
            if (entry.target === container) {
                var newWidth = entry.contentRect.width;
                var newHeight = entry.contentRect.height;
                if (newWidth > 0 && newHeight > 0) {
                    voucherContainerSize.width = Math.round(newWidth);
                    voucherContainerSize.height = Math.round(newHeight);
                    localStorage.setItem('qv_container_size', JSON.stringify(voucherContainerSize));
                    var cw = document.getElementById('canvasW');
                    var ch = document.getElementById('canvasH');
                    if (cw) cw.value = voucherContainerSize.width;
                    if (ch) ch.value = voucherContainerSize.height;
                    // Update price bar height
                    var priceEl = document.getElementById('dragPrice');
                    if (priceEl) priceEl.style.height = newHeight + 'px';
                }
            }
        }
    });
    resizeObserver.observe(container);

    // Load custom texts and create their DOM elements
    loadCustomTexts();
    for (var ck in voucherElementsConfig) {
        if (ck.indexOf('custom') !== 0) continue;
        var cCfg = voucherElementsConfig[ck];
        if (!document.getElementById(cCfg.id)) {
            var div = document.createElement('div');
            div.id = cCfg.id;
            div.className = 'drag-el';
            div.setAttribute('data-key', ck);
            div.style.cssText = 'position: absolute; left: ' + cCfg.left + 'px; top: ' + cCfg.top + 'px; font-size: ' + cCfg.fontSize + 'px; cursor: move; white-space: nowrap;';
            div.textContent = customTexts[ck] || 'Text';
            container.appendChild(div);
            initSingleDraggable(div);
        }
        // Ensure custom keys are in layer order
        if (layerOrder.indexOf(ck) === -1) {
            layerOrder.unshift(ck);
        }
    }
    updateCustomTextsList();

    // Render layers
    renderLayers();
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Only when editor modal is open
        var modal = document.getElementById('customize');
        if (!modal || !modal.classList.contains('show')) return;

        // Ctrl+Z = Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            editorUndo();
        }
        // Ctrl+Y or Ctrl+Shift+Z = Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            editorRedo();
        }
        // Delete/Backspace = toggle visibility of selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementKey) {
            // Only if not focused on an input
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;
            e.preventDefault();
            toggleLayerVisibility(selectedElementKey);
        }
        // Ctrl+C = copy style (when element selected and not in input)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementKey) {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;
            e.preventDefault();
            copyElementStyle();
        }
        // Ctrl+V = paste style (when element selected and not in input)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedElementKey && copiedStyle) {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;
            e.preventDefault();
            pasteElementStyle();
        }
        // Escape = deselect
        if (e.key === 'Escape') {
            deselectAll();
        }
        // Arrow keys = nudge selected element
        if (selectedElementKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) !== -1) {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;
            e.preventDefault();
            var cfg = voucherElementsConfig[selectedElementKey];
            var step = e.shiftKey ? 10 : 1;
            pushUndo();
            switch (e.key) {
                case 'ArrowLeft':  cfg.left -= step; break;
                case 'ArrowRight': cfg.left += step; break;
                case 'ArrowUp':    cfg.top -= step; break;
                case 'ArrowDown':  cfg.top += step; break;
            }
            applyElementStyle(selectedElementKey);
            saveElementsConfig();
            updatePropertiesPanel();
        }
    });
}

// ============================================
// INIT
// ============================================
$(function () {
    loadActiveTemplate();
    initDraggables();
    renderTemplateSelector();
    initKeyboardShortcuts();

    // Template Manager upload
    var uploadFile = document.getElementById('tplUploadFile');
    var uploadZone = document.getElementById('tplDropZone');

    if (uploadFile) {
        uploadFile.addEventListener('change', function () {
            if (this.files && this.files[0]) handleManagerUpload(this.files[0]);
        });
    }

    if (uploadZone) {
        uploadZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        uploadZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
        uploadZone.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleManagerUpload(e.dataTransfer.files[0]);
            }
        });
    }

    // Editor modal events
    var customizeEl = document.getElementById('customize');
    if (customizeEl) {
        customizeEl.addEventListener('shown.bs.modal', function () {
            renderTemplateSelector();
            updateVoucherPreviews();
            renderLayers();
            applyAllElementStyles();
            editorZoomFit();
            // Update tag color label
            var tc = document.getElementById('TagColor');
            var tcl = document.getElementById('tagColorLabel');
            if (tc && tcl) tcl.textContent = tc.value;
        });
        customizeEl.addEventListener('hidden.bs.modal', function () {
            deselectAll();
        });
    }

    // Template Manager modal events
    var managerEl = document.getElementById('templateManager');
    if (managerEl) {
        managerEl.addEventListener('show.bs.modal', function () {
            renderManagerGallery();
        });
        managerEl.addEventListener('hidden.bs.modal', function () {
            // Refresh editor when template manager closes
            renderTemplateSelector();
            updateVoucherPreviews();
            // Restore body scroll class for editor modal
            document.body.classList.add('modal-open');
        });
    }

    // Mouse wheel zoom in editor
    var canvasArea = document.getElementById('canvasArea');
    if (canvasArea) {
        canvasArea.addEventListener('wheel', function (e) {
            // Only zoom if Ctrl/Cmd held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                var delta = e.deltaY > 0 ? -0.1 : 0.1;
                editorSetZoom(editorZoom + delta);
            }
        }, { passive: false });
    }
});

$(document).ready(function() {
    // Basic navigation
    $('.nav-tab').on('click', function() {
        if($(this).hasClass('winbox-tab')) return; // Ignore the hotspot sub-tabs

        $('.nav-tab').removeClass('active');
        $(this).addClass('active');

        var target = $(this).data('target');
        $('.app-view').removeClass('active');
        $('#' + target).addClass('active');
    });
});
