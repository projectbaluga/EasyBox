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
    var tables = document.querySelectorAll('.voucher-preview table.voucher');
    tables.forEach(function (t) {
        if (templateBg) {
            t.style.backgroundImage = 'url(' + templateBg + ')';
            t.style.backgroundSize = 'cover';
            t.style.backgroundRepeat = 'no-repeat';
            t.style.backgroundPosition = 'center';
        } else {
            t.style.backgroundImage = '';
            t.style.backgroundSize = '';
            t.style.backgroundRepeat = '';
            t.style.backgroundPosition = '';
        }
    });
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
    var w = qr ? 200 : 170;
    var bgStyle = '';
    if (templateBg) {
        bgStyle = 'background-image:url(' + templateBg + ');background-size:cover;background-repeat:no-repeat;background-position:center;';
    }
    var h = '<table class="voucher" style="width:' + w + 'px;' + bgStyle + '"><tbody><tr>';

    // Price sidebar
    var sidebarBg = templateBg ? 'transparent' : cfg.color;
    h += '<td class="rotate" style="font-weight:700;border-right:1px solid #ccc;background-color:' + sidebarBg + ';-webkit-print-color-adjust:exact;" rowspan="4">';
    h += '<span>' + cfg.currency + ' ' + cfg.price + '</span></td>';

    // Tag name
    h += '<td style="font-weight:700" colspan="2">' + cfg.vendo + '</td>';

    // QR code
    if (qr) {
        var url = 'http://' + cfg.ip + '/login?username=' + code;
        if (userpass) url += '&password=' + code;
        h += '<td rowspan="3"><div class="qr-wrapper"><img class="qr-img p-1" src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=' + encodeURIComponent(url) + '"></div></td>';
    }
    h += '</tr>';

    // Code
    h += '<tr><td style="width:100%;font-weight:700;font-size:18px;text-align:center">' + code + '</td></tr>';

    // Duration
    h += '<tr><td style="font-size:11px">Duration: ' + cfg.durDisplay + '</td></tr>';

    // Login info
    if (cfg.ip) {
        h += '<tr><td style="font-size:12px" colspan="3">Login: <span style="font-weight:700">http://' + cfg.ip + '</span></td></tr>';
    }

    h += '</tbody></table>';
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
    $('#voucher1, #voucher2').attr('style', 'font-weight:700;border-right:1px solid #ccc;background-color:' + c + ';-webkit-print-color-adjust:exact;');
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

// ---- Init ----
$(function () {
    loadActiveTemplate();
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
