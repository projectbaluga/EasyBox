// ============================================
// QuickVoucher v2.0 - Voucher Generator
// ============================================

// CSS path for print window (override before loading this script for hotspot deployments)
if (typeof VOUCHER_CSS === 'undefined') {
    var VOUCHER_CSS = 'css/voucher.css';
}

// Template background image (base64 data URL)
var templateBg = '';

// Character sets
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
    if (cfg.validity && cfg.validity !== '0m') {
        s += ' comment="' + cfg.vendo + '"';
    } else {
        s += ' comment="' + cfg.vendo + '"';
    }
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

// ---- Template Image Upload ----
function handleTemplateFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function (e) {
        templateBg = e.target.result;
        showTemplatePreview(templateBg);
        updateVoucherPreviews();
    };
    reader.readAsDataURL(file);
}

function showTemplatePreview(src) {
    var wrap = document.getElementById('templatePreviewWrap');
    var img = document.getElementById('templatePreviewImg');
    var content = document.getElementById('dropContent');
    if (wrap && img && content) {
        img.src = src;
        wrap.style.display = '';
        content.style.display = 'none';
    }
}

function removeTemplate() {
    templateBg = '';
    var wrap = document.getElementById('templatePreviewWrap');
    var img = document.getElementById('templatePreviewImg');
    var content = document.getElementById('dropContent');
    var input = document.getElementById('templateFile');
    if (wrap) wrap.style.display = 'none';
    if (content) content.style.display = '';
    if (img) img.src = '';
    if (input) input.value = '';
    updateVoucherPreviews();
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

// Init upload listeners after DOM is ready
$(function () {
    var fileInput = document.getElementById('templateFile');
    var dropZone = document.getElementById('dropZone');

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) handleTemplateFile(this.files[0]);
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleTemplateFile(e.dataTransfer.files[0]);
            }
        });
    }
});
