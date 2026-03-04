// ============================================
// QuickVoucher v2.3 - Voucher Generator
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
    var customizeModal = bootstrap.Modal.getInstance(document.getElementById('customize'));
    if (customizeModal) customizeModal.hide();
    setTimeout(function () {
        renderManagerGallery();
        var mgr = new bootstrap.Modal(document.getElementById('templateManager'));
        mgr.show();
    }, 300);
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

var LAYER_NAMES = {
    price: 'Price',
    vendor: 'Tag Name',
    code: 'Code',
    duration: 'Duration',
    login: 'Login Info',
    qr: 'QR Code'
};

var layerOrder = ['qr', 'login', 'duration', 'code', 'vendor', 'price'];

var voucherContainerSize = { width: 200, height: 100 };

var voucherElementsConfig = {
    price:    { id: 'dragPrice',    visible: true,  left: 0,   top: 0,  fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' },
    vendor:   { id: 'dragVendor',   visible: true,  left: 35,  top: 5,  fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' },
    code:     { id: 'dragCode',     visible: true,  left: 35,  top: 30, fontSize: 18, fontFamily: 'Arial, sans-serif', color: '#000000', bold: true,  italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' },
    duration: { id: 'dragDuration', visible: true,  left: 35,  top: 60, fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' },
    login:    { id: 'dragLogin',    visible: true,  left: 35,  top: 75, fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' },
    qr:       { id: 'dragQR',       visible: false, left: 135, top: 5,  fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, opacity: 1, textTransform: 'none', textDecoration: 'none', letterSpacing: 0, textShadow: false, rotation: 0, bgColor: 'transparent' }
};

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
    var val = parseInt(document.getElementById('voucherBorderRadius').value) || 0;
    voucherBorderRadius = val;
    var label = document.getElementById('borderRadiusVal');
    if (label) label.textContent = val + 'px';
    var container = document.getElementById('dragVoucherContainer');
    if (container) container.style.borderRadius = val + 'px';
    localStorage.setItem('qv_border_radius', val);
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
    }

    // Rotation (for all elements including QR, but skip price's built-in rotation)
    if (key === 'price') {
        // Price has built-in vertical rotation; user rotation adds on top
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
    if (elCfg.bgColor && elCfg.bgColor !== 'transparent') s += ' background-color: ' + elCfg.bgColor + '; padding: 1px 3px; -webkit-print-color-adjust: exact;';
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
    var h = '<div class="voucher" style="width: ' + w + 'px; height: ' + vh + 'px; position: relative; border: ' + border + '; background-color: ' + bgColor + '; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; page-break-inside: avoid; margin: 5px; float: left; ' + bRadius + ' ' + bgStyle + '">';

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
        var qrStyle = 'position: absolute; left: ' + cQR.left + 'px; top: ' + cQR.top + 'px; opacity: ' + (cQR.opacity !== undefined ? cQR.opacity : 1) + ';';
        h += '<div style="' + qrStyle + '">';
        h += '<img class="qr-img p-1" src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=' + encodeURIComponent(url) + '" width="60" height="60" style="background: white;">';
        h += '</div>';
    }

    h += '</div>';
    return h;
}

// ---- Main Generate Function ----
function Generate() {
    var vendo = $('#Vendo').val() || 'QuickVoucher';
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
function printvoucher() {
    var body = document.getElementById('PrintBody');
    if (!body || !body.innerHTML.trim()) return;
    copyCode();
    var title = ($('#Vendo').val() || 'voucher') + '_' + ($('#Prefix').val() || '') + '_' + ($('#Quantity').val() || '0') + 'pcs_' + getDateStr();
    var html = body.innerHTML;
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
            if (Array.isArray(parsedOrder) && parsedOrder.length === layerOrder.length) {
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
