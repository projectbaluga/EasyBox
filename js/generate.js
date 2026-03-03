// ============================================
// QuickVoucher v2.1 - Voucher Generator
// ============================================

// CSS path for print window (override before loading this script for hotspot deployments)
if (typeof VOUCHER_CSS === 'undefined') {
    var VOUCHER_CSS = 'css/voucher.css';
}

// ---- Template Manager (localStorage) ----
var STORAGE_KEY = 'qv_templates';
var ACTIVE_KEY = 'qv_active_template';
var templateBg = '';

function getTemplates() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveTemplates(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getActiveTemplateId() {
    return localStorage.getItem(ACTIVE_KEY) || '';
}

function setActiveTemplateId(id) {
    if (id) {
        localStorage.setItem(ACTIVE_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_KEY);
    }
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

// ---- Render Template Selector (Customize modal) ----
function renderTemplateSelector() {
    var container = document.getElementById('templateSelector');
    if (!container) return;
    var list = getTemplates();
    var activeId = getActiveTemplateId();

    var html = '';
    // "None" option
    html += '<div class="tpl-thumb' + (!activeId ? ' active' : '') + '" onclick="selectTemplate(\'\')" title="No template (default)">';
    html += '<div class="tpl-thumb-img tpl-none"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
    html += '<span class="tpl-thumb-name">None</span></div>';

    for (var i = 0; i < list.length; i++) {
        var t = list[i];
        var isActive = t.id === activeId;
        html += '<div class="tpl-thumb' + (isActive ? ' active' : '') + '" onclick="selectTemplate(\'' + t.id + '\')" title="' + t.name + '">';
        html += '<img class="tpl-thumb-img" src="' + t.data + '" alt="' + t.name + '">';
        html += '<span class="tpl-thumb-name">' + t.name + '</span></div>';
    }

    // "Add" button
    html += '<div class="tpl-thumb tpl-add" onclick="openTemplateManager()" title="Manage templates">';
    html += '<div class="tpl-thumb-img tpl-none"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
    html += '<span class="tpl-thumb-name">Add</span></div>';

    container.innerHTML = html;
}

// ---- Render Manager Gallery (Template Manager modal) ----
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
        if (!isActive) {
            html += '<button class="btn btn-sm btn-primary tpl-btn" onclick="selectTemplate(\'' + t.id + '\')">Use</button>';
        } else {
            html += '<button class="btn btn-sm btn-outline-secondary tpl-btn" onclick="selectTemplate(\'\')">Deselect</button>';
        }
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

// ---- Upload Handler (Template Manager) ----
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

// Date string for filenames (MM_DD_YYYY)
function getDateStr() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return mm + '_' + dd + '_' + d.getFullYear();
}

// Generate random voucher code
function makeCode(prefix, length, charsetKey) {
    var chars = CHARSETS[charsetKey] || CHARSETS['1'];
    var code = prefix;
    var need = length - prefix.length;
    for (var i = 0; i < need; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Calculate total minutes
function calcMins(days, hours, mins) {
    return (24 * (parseInt(days) || 0) * 60) + (60 * (parseInt(hours) || 0)) + (parseInt(mins) || 0);
}

// Format duration for display
function fmtDuration(days, hours, mins) {
    var p = [];
    if (parseInt(days) > 0) p.push(days + ' D');
    if (parseInt(hours) > 0) p.push(hours + ' H');
    if (parseInt(mins) > 0) p.push(mins + ' M');
    return p.length ? p.join(' ') : '0 M';
}

// Build MikroTik script line
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

// Build voucher HTML for printing
function buildVoucher(code, userpass, qr, cfg) {
    var bgStyle = '';
    if (templateBg) {
        bgStyle = 'background-image:url(' + templateBg + ');background-size:cover;background-repeat:no-repeat;background-position:center;';
    }

    // Dynamic dimensions
    var w = voucherContainerSize.width;
    var vh = voucherContainerSize.height;

    // Container div instead of table
    var h = '<div class="voucher" style="width: ' + w + 'px; height: ' + vh + 'px; position: relative; border: 1px dashed #ccc; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; page-break-inside: avoid; margin: 5px; float: left; ' + bgStyle + '">';

    // Price
    var cPrice = voucherElementsConfig.price;
    if (cPrice && cPrice.visible) {
        var sidebarBg = templateBg ? 'transparent' : cfg.color;
        h += '<div style="position: absolute; left: ' + cPrice.left + 'px; top: ' + cPrice.top + 'px; width: 30px; height: ' + vh + 'px; background-color: ' + sidebarBg + '; writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border-right: 1px solid #ccc; -webkit-print-color-adjust: exact;">';
        h += cfg.currency + ' ' + cfg.price;
        h += '</div>';
    }

    // Tag name
    var cVendor = voucherElementsConfig.vendor;
    if (cVendor && cVendor.visible) {
        h += '<div style="position: absolute; left: ' + cVendor.left + 'px; top: ' + cVendor.top + 'px; font-weight: bold; font-size: 14px; white-space: nowrap;">' + cfg.vendo + '</div>';
    }

    // Code
    var cCode = voucherElementsConfig.code;
    if (cCode && cCode.visible) {
        h += '<div style="position: absolute; left: ' + cCode.left + 'px; top: ' + cCode.top + 'px; font-weight: bold; font-size: 18px; white-space: nowrap;">' + code + '</div>';
    }

    // Duration
    var cDur = voucherElementsConfig.duration;
    if (cDur && cDur.visible) {
        h += '<div style="position: absolute; left: ' + cDur.left + 'px; top: ' + cDur.top + 'px; font-size: 11px; white-space: nowrap;">Duration: ' + cfg.durDisplay + '</div>';
    }

    // Login info
    var cLog = voucherElementsConfig.login;
    if (cLog && cLog.visible && cfg.ip) {
        h += '<div style="position: absolute; left: ' + cLog.left + 'px; top: ' + cLog.top + 'px; font-size: 12px; white-space: nowrap;">Login: <b style="font-weight:700">http://' + cfg.ip + '</b></div>';
    }

    // QR code
    var cQR = voucherElementsConfig.qr;
    if (qr && cQR && cQR.visible) {
        var url = 'http://' + cfg.ip + '/login?username=' + code;
        if (userpass) url += '&password=' + code;
        h += '<div style="position: absolute; left: ' + cQR.left + 'px; top: ' + cQR.top + 'px;">';
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
    var hasQr = $('#qrcodebtn').is(':checked');

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

// ---- Apply Tag Color ----
function color() {
    var c = $('#TagColor').val();
    var priceEl = document.getElementById('dragPrice');
    if (priceEl && !templateBg) {
        priceEl.style.backgroundColor = c;
    }
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

// ---- Drag and Drop Functionality ----
var voucherContainerSize = { width: 200, height: 100 };
var voucherElementsConfig = {
    price: { id: 'dragPrice', visible: true, left: 0, top: 0 },
    vendor: { id: 'dragVendor', visible: true, left: 35, top: 5 },
    code: { id: 'dragCode', visible: true, left: 35, top: 30 },
    duration: { id: 'dragDuration', visible: true, left: 35, top: 60 },
    login: { id: 'dragLogin', visible: true, left: 35, top: 75 },
    qr: { id: 'dragQR', visible: false, left: 135, top: 5 }
};

function initDraggables() {
    var container = document.getElementById('dragVoucherContainer');
    if (!container) return;

    // Load saved sizes if any
    try {
        var savedSize = localStorage.getItem('qv_container_size');
        if (savedSize) {
            voucherContainerSize = JSON.parse(savedSize);
            container.style.width = voucherContainerSize.width + 'px';
            container.style.height = voucherContainerSize.height + 'px';
        }
    } catch (e) {}

    // Load saved positions/visibility if any
    try {
        var saved = localStorage.getItem('qv_elements_config');
        if (saved) {
            var parsed = JSON.parse(saved);
            for (var key in parsed) {
                if (voucherElementsConfig[key]) {
                    voucherElementsConfig[key] = parsed[key];
                }
            }
        }
    } catch (e) {}

    // Apply config
    for (var key in voucherElementsConfig) {
        var elConf = voucherElementsConfig[key];
        var el = document.getElementById(elConf.id);
        if (el) {
            el.style.left = elConf.left + 'px';
            el.style.top = elConf.top + 'px';
            el.style.display = elConf.visible ? (key === 'price' ? 'flex' : 'block') : 'none';

            // Sync toggles
            var toggle = document.querySelector('.visibility-toggle[data-target="' + elConf.id + '"]');
            if (toggle) toggle.checked = elConf.visible;
        }

        // Special case for QR toggle which has different ID
        if (key === 'qr') {
            var qrToggle = document.getElementById('qrcodebtn');
            if (qrToggle) qrToggle.checked = elConf.visible;
        }
    }

    // Drag logic
    var dragElements = document.querySelectorAll('.drag-el');
    dragElements.forEach(function (el) {
        var isDragging = false;
        var startX, startY, initialLeft, initialTop;

        el.addEventListener('mousedown', dragStart);
        el.addEventListener('touchstart', dragStart, {passive: false});

        function dragStart(e) {
            if (e.target.tagName.toLowerCase() === 'input') return;
            e.preventDefault();
            isDragging = true;
            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;

            startX = clientX;
            startY = clientY;
            initialLeft = parseInt(el.style.left || 0);
            initialTop = parseInt(el.style.top || 0);

            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragMove, {passive: false});
            document.addEventListener('touchend', dragEnd);
        }

        function dragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;

            var dx = clientX - startX;
            var dy = clientY - startY;

            var newLeft = initialLeft + dx;
            var newTop = initialTop + dy;

            // Simple boundary check (optional, but good to keep elements inside)
            // if (newLeft < 0) newLeft = 0;
            // if (newTop < 0) newTop = 0;

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
        }

        function dragEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);

            saveElementsConfig();
        }
    });

    // Toggle logic
    var toggles = document.querySelectorAll('.visibility-toggle');
    toggles.forEach(function (toggle) {
        toggle.addEventListener('change', function () {
            var targetId = this.getAttribute('data-target');
            var el = document.getElementById(targetId);
            if (el) {
                var isPrice = targetId === 'dragPrice';
                el.style.display = this.checked ? (isPrice ? 'flex' : 'block') : 'none';
            }
            saveElementsConfig();
        });
    });

    // Special case for QR toggle
    var qrToggle = document.getElementById('qrcodebtn');
    if (qrToggle) {
        qrToggle.addEventListener('change', function () {
            var el = document.getElementById('dragQR');
            if (el) {
                el.style.display = this.checked ? 'block' : 'none';
            }
            saveElementsConfig();
        });
    }

    // Resize tracking
    var resizeObserver = new ResizeObserver(function (entries) {
        for (let entry of entries) {
            if (entry.target === container) {
                var newWidth = entry.contentRect.width;
                var newHeight = entry.contentRect.height;
                if (newWidth > 0 && newHeight > 0) {
                    voucherContainerSize.width = Math.round(newWidth);
                    voucherContainerSize.height = Math.round(newHeight);
                    localStorage.setItem('qv_container_size', JSON.stringify(voucherContainerSize));
                }
            }
        }
    });
    resizeObserver.observe(container);
}

function saveElementsConfig() {
    for (var key in voucherElementsConfig) {
        var elConf = voucherElementsConfig[key];
        var el = document.getElementById(elConf.id);
        if (el) {
            elConf.left = parseInt(el.style.left || 0);
            elConf.top = parseInt(el.style.top || 0);

            // Get visibility
            if (key === 'qr') {
                elConf.visible = document.getElementById('qrcodebtn').checked;
            } else {
                var toggle = document.querySelector('.visibility-toggle[data-target="' + elConf.id + '"]');
                if (toggle) {
                    elConf.visible = toggle.checked;
                }
            }
        }
    }
    localStorage.setItem('qv_elements_config', JSON.stringify(voucherElementsConfig));
}


// ---- Init ----
$(function () {
    loadActiveTemplate();
    initDraggables();
    renderTemplateSelector();

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

    // Re-render selector when Customize modal opens
    var customizeEl = document.getElementById('customize');
    if (customizeEl) {
        customizeEl.addEventListener('show.bs.modal', function () {
            renderTemplateSelector();
            updateVoucherPreviews();
        });
    }

    // Re-render gallery when Manager modal opens
    var managerEl = document.getElementById('templateManager');
    if (managerEl) {
        managerEl.addEventListener('show.bs.modal', function () {
            renderManagerGallery();
        });
    }
});
