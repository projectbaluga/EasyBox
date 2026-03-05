// ============================================
// Mikrotik REST API Client & UI Manager
// ============================================

// ---- Storage ----





// ---- Router Profile Management ----
function getRouterProfiles() {
    try {
        var profiles = JSON.parse(localStorage.getItem('qv_router_profiles'));
        if (!Array.isArray(profiles) || profiles.length === 0) {
            // Migration from single setting
            var legacy = JSON.parse(localStorage.getItem('qv_router_settings'));
            if (legacy && legacy.ip) {
                legacy.id = 'default';
                legacy.name = 'Default Profile';
                return [legacy];
            }
            return [{ id: 'default', name: 'Default Profile', ip: '', user: 'admin', pass: '', proto: 'http', port: '' }];
        }
        return profiles;
    } catch (e) {
        return [{ id: 'default', name: 'Default Profile', ip: '', user: 'admin', pass: '', proto: 'http', port: '' }];
    }
}

function saveRouterProfiles(profiles) {
    localStorage.setItem('qv_router_profiles', JSON.stringify(profiles));
}

function getCurrentProfileId() {
    return localStorage.getItem('qv_current_profile_id') || 'default';
}

function setCurrentProfileId(id) {
    localStorage.setItem('qv_current_profile_id', id);
}

function getRouterSettings() {
    var profiles = getRouterProfiles();
    var currentId = getCurrentProfileId();
    var profile = profiles.find(p => p.id === currentId);
    return profile || profiles[0];
}

function populateRouterSettings() {
    var profiles = getRouterProfiles();
    var currentId = getCurrentProfileId();

    var select = document.getElementById('routerProfileSelect');
    if(select) {
        select.innerHTML = '';
        profiles.forEach(p => {
            var opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name || p.id;
            if(p.id === currentId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    var profile = getRouterSettings();

    if (document.getElementById('routerIp')) {
        document.getElementById('routerProfileName').value = profile.name || '';
        document.getElementById('routerIp').value = profile.ip || '';
        document.getElementById('routerUser').value = profile.user || 'admin';
        document.getElementById('routerPass').value = profile.pass || '';
        document.getElementById('routerProto').value = profile.proto || 'http';
        document.getElementById('routerPort').value = profile.port || '';
    }
}

function loadSelectedRouterProfile() {
    var select = document.getElementById('routerProfileSelect');
    setCurrentProfileId(select.value);
    document.getElementById('profileNameContainer').style.display = 'block';
    populateRouterSettings();
}

function addNewRouterProfile() {
    var profiles = getRouterProfiles();
    var newId = 'profile_' + Date.now();
    var newProfile = {
        id: newId,
        name: 'New Profile ' + (profiles.length + 1),
        ip: '',
        user: 'admin',
        pass: '',
        proto: 'http',
        port: ''
    };
    profiles.push(newProfile);
    saveRouterProfiles(profiles);
    setCurrentProfileId(newId);
    populateRouterSettings();
    document.getElementById('profileNameContainer').style.display = 'block';
}

function deleteCurrentRouterProfile() {
    var profiles = getRouterProfiles();
    if (profiles.length <= 1) {
        alert("Cannot delete the last profile.");
        return;
    }
    var currentId = getCurrentProfileId();
    if (confirm("Are you sure you want to delete this profile?")) {
        profiles = profiles.filter(p => p.id !== currentId);
        saveRouterProfiles(profiles);
        setCurrentProfileId(profiles[0].id);
        populateRouterSettings();
    }
}

function saveRouterSettingsForm() {
    var currentId = getCurrentProfileId();
    var profiles = getRouterProfiles();
    var profileIndex = profiles.findIndex(p => p.id === currentId);

    if (profileIndex === -1) profileIndex = 0; // Fallback

    var nameField = document.getElementById('routerProfileName');
    var profileName = nameField.value.trim();
    if(!profileName) profileName = 'Profile ' + currentId;

    profiles[profileIndex] = {
        id: currentId,
        name: profileName,
        ip: document.getElementById('routerIp').value.trim(),
        user: document.getElementById('routerUser').value.trim(),
        pass: document.getElementById('routerPass').value,
        proto: document.getElementById('routerProto').value,
        port: document.getElementById('routerPort').value.trim()
    };

    saveRouterProfiles(profiles);

    // Also update the legacy key for backward compatibility or simple reads if any exist
    localStorage.setItem('qv_router_settings', JSON.stringify(profiles[profileIndex]));

    var modalEl = document.getElementById('routerSettingsModal');
    if (modalEl) {
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    alert('Router Profile Saved!');
}





function getSettingsFromForm() {
    return {
        ip: document.getElementById('routerIp').value.trim(),
        user: document.getElementById('routerUser').value.trim(),
        pass: document.getElementById('routerPass').value,
        proto: document.getElementById('routerProto').value,
        port: document.getElementById('routerPort').value.trim()
    };
}

async function testRouterConnection() {
    var btn = document.getElementById('btnTestConn');
    var resultDiv = document.getElementById('testConnResult');
    var settings = getSettingsFromForm();

    if (!settings.ip || !settings.user) {
        resultDiv.textContent = 'Please enter an IP address and Username.';
        resultDiv.className = 'mt-2 text-center text-danger';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Testing...';
    resultDiv.textContent = '';

    try {
        await mikrotikApi('/system/identity', 'GET', null, settings);
        resultDiv.textContent = 'Connection Successful! ✅';
        resultDiv.className = 'mt-2 text-center text-success';
    } catch (e) {
        resultDiv.textContent = 'Connection Failed: ' + e.message;
        resultDiv.className = 'mt-2 text-center text-danger';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Test Connection';
    }
}

// ---- REST API Client ----
async function mikrotikApi(endpoint, method = 'GET', body = null, customSettings = null) {
    var settings = customSettings || getRouterSettings();
    if (!settings.ip || !settings.user) {
        throw new Error('Router credentials not set.');
    }

    var portPart = settings.port ? ':' + settings.port : '';
    var url = `${settings.proto}://${settings.ip}${portPart}/rest${endpoint}`;

    var headers = {
        'Authorization': 'Basic ' + btoa(settings.user + ':' + settings.pass)
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        var isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
        var responseData;
        var responseStatus;
        var responseOk;

        if (isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
            // Use native Capacitor HTTP plugin to bypass CORS and allow cleartext
            var options = {
                url: url,
                method: method,
                headers: headers
            };
            if (body) {
                options.data = body;
            }

            var response = await window.Capacitor.Plugins.CapacitorHttp.request(options);
            responseStatus = response.status;
            responseOk = responseStatus >= 200 && responseStatus < 300;
            responseData = response.data;

        } else {
            // Fallback to standard fetch (will hit CORS issues in browser)
            var fetchOptions = {
                method: method,
                headers: headers
            };
            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }
            var response = await fetch(url, fetchOptions);
            responseStatus = response.status;
            responseOk = response.ok;

            if (responseOk && method !== 'DELETE') {
                responseData = await response.json();
            } else if (!responseOk) {
                responseData = await response.text();
            }
        }

        if (!responseOk) {
            if (responseStatus === 401) {
                throw new Error('Authentication Failed (401). Check Username/Password.');
            }
            if (responseStatus === 404) {
                throw new Error('Endpoint not found (404). Ensure REST API is enabled in RouterOS v7.');
            }
            var errText = (typeof responseData === 'object' ? JSON.stringify(responseData) : responseData) || 'Unknown Error';
            throw new Error(`API Error ${responseStatus}: ${errText}`);
        }

        // DELETE often returns empty body
        if (method === 'DELETE') return true;

        return responseData;
    } catch (error) {
        console.error('Mikrotik API Error:', error);

        var isNetworkError = false;
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            isNetworkError = true;
        } else if (error.message && error.message.includes('Network Error')) {
            isNetworkError = true;
        }

        if (isNetworkError) {
            var browserMsg = '';
            if (!(window.Capacitor && window.Capacitor.isNativePlatform())) {
                browserMsg = `If testing on PC, CORS blocks requests to the router. Launch Chrome from Win+R: chrome.exe --user-data-dir="C:/ChromeDevSession" --disable-web-security \n\n`;
            }
            throw new Error(`Network Error: Failed to connect to ${settings.ip}. \n\n${browserMsg}Check IP, Port, Protocol (HTTP/HTTPS), or if the REST API is enabled in Winbox (IP -> Services -> www). Note: Android cleartext traffic is now enabled.`);
        }

        throw error;
    }
}


// ==========================================
// WINBOX-STYLE DYNAMIC HOTSPOT CONTROLLER
// ==========================================

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const HOTSPOT_TABS_CONFIG = {
    'servers': {
        endpoint: '/ip/hotspot',
        title: 'Servers',
        columns: ['name', 'interface', 'profile', 'idle-timeout'],
        fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'interface', label: 'Interface', type: 'text', required: true, hint: 'e.g. bridge' },
            { id: 'profile', label: 'Profile', type: 'text', required: false, default: 'default' },
            { id: 'idle-timeout', label: 'Idle Timeout', type: 'text', required: false, default: '5m' }
        ]
    },
    'server-profiles': {
        endpoint: '/ip/hotspot/profile',
        title: 'Server Profiles',
        columns: ['name', 'hotspot-address', 'dns-name', 'html-directory', 'login-by'],
        fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'hotspot-address', label: 'Hotspot Address', type: 'text', required: true },
            { id: 'dns-name', label: 'DNS Name', type: 'text', required: false },
            { id: 'html-directory', label: 'HTML Directory', type: 'text', required: true, default: 'hotspot' },
            { id: 'login-by', label: 'Login By', type: 'text', required: false, default: 'mac,cookie,http-chap' }
        ]
    },
    'users': {
        endpoint: '/ip/hotspot/user',
        title: 'Users',
        columns: ['name', 'profile', 'uptime', 'bytes-in', 'bytes-out', 'limit-uptime'],
        fields: [
            { id: 'name', label: 'Name / Username', type: 'text', required: true },
            { id: 'password', label: 'Password', type: 'text', required: false },
            { id: 'profile', label: 'Profile', type: 'text', required: false, default: 'default' },
            { id: 'limit-uptime', label: 'Limit Uptime', type: 'text', required: false, hint: 'e.g. 1d 12h' },
            { id: 'limit-bytes-total', label: 'Limit Bytes Total', type: 'number', required: false }
        ]
    },
    'user-profiles': {
        endpoint: '/ip/hotspot/user/profile',
        title: 'User Profiles',
        columns: ['name', 'shared-users', 'rate-limit', 'mac-cookie-timeout'],
        fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'shared-users', label: 'Shared Users', type: 'number', required: false, default: '1' },
            { id: 'rate-limit', label: 'Rate Limit (Rx/Tx)', type: 'text', required: false, hint: 'e.g. 5M/5M' },
            { id: 'mac-cookie-timeout', label: 'MAC Cookie Timeout', type: 'text', required: false, default: '3d' }
        ]
    },
    'active': {
        endpoint: '/ip/hotspot/active',
        title: 'Active Connections',
        columns: ['user', 'address', 'mac-address', 'uptime', 'session-time-left'],
        readonly: true // Cannot Add directly, can only Remove/Disconnect
    },
    'hosts': {
        endpoint: '/ip/hotspot/host',
        title: 'Hosts',
        columns: ['mac-address', 'address', 'to-address', 'server', 'uptime'],
        readonly: true
    },
    'ip-bindings': {
        endpoint: '/ip/hotspot/ip-binding',
        title: 'IP Bindings',
        columns: ['mac-address', 'address', 'to-address', 'server', 'type'],
        fields: [
            { id: 'mac-address', label: 'MAC Address', type: 'text', required: false },
            { id: 'address', label: 'Address', type: 'text', required: false },
            { id: 'to-address', label: 'To Address', type: 'text', required: false },
            { id: 'server', label: 'Server', type: 'text', required: false, default: 'all' },
            { id: 'type', label: 'Type', type: 'select', options: ['regular', 'bypassed', 'blocked'], default: 'bypassed' }
        ]
    },
    'service-ports': {
        endpoint: '/ip/firewall/service-port',
        title: 'Service Ports',
        columns: ['name', 'ports'],
        readonly: true // Complex to add generically
    },
    'walled-garden': {
        endpoint: '/ip/hotspot/walled-garden',
        title: 'Walled Garden',
        columns: ['action', 'server', 'dst-host', 'dst-port', 'hits'],
        fields: [
            { id: 'action', label: 'Action', type: 'select', options: ['allow', 'deny'], default: 'allow' },
            { id: 'server', label: 'Server', type: 'text', required: false, default: 'all' },
            { id: 'dst-host', label: 'Dst Host', type: 'text', required: true, hint: 'e.g. *facebook.com*' },
            { id: 'dst-port', label: 'Dst Port', type: 'text', required: false }
        ]
    },
    'walled-garden-ip': {
        endpoint: '/ip/hotspot/walled-garden/ip',
        title: 'Walled Garden IP List',
        columns: ['action', 'server', 'dst-address', 'protocol', 'dst-port'],
        fields: [
            { id: 'action', label: 'Action', type: 'select', options: ['accept', 'drop', 'reject'], default: 'accept' },
            { id: 'server', label: 'Server', type: 'text', required: false, default: 'all' },
            { id: 'dst-address', label: 'Dst Address', type: 'text', required: true, hint: 'e.g. 8.8.8.8/32' },
            { id: 'protocol', label: 'Protocol', type: 'text', required: false, default: 'tcp' },
            { id: 'dst-port', label: 'Dst Port', type: 'text', required: false }
        ]
    },
    'cookies': {
        endpoint: '/ip/hotspot/cookie',
        title: 'Cookies',
        columns: ['user', 'mac-address', 'expires-in'],
        readonly: true
    }
};

let currentHotspotTab = 'users';

function initHotspotTabs() {
    document.querySelectorAll('.winbox-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.winbox-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentHotspotTab = e.target.dataset.tab;
            loadHotspotCurrentTab();
        });
    });
}

async function loadHotspotCurrentTab() {
    const config = HOTSPOT_TABS_CONFIG[currentHotspotTab];
    if (!config) return;

    const thead = document.getElementById('hotspotDynamicThead');
    const tbody = document.getElementById('hotspotDynamicTbody');

    // Setup columns
    let thHtml = '<tr><th style="width:30px;"><input type="checkbox" id="selectAllItems" onchange="toggleSelectAllItems(this)"></th>';
    config.columns.forEach(col => {
        thHtml += `<th>${col.toUpperCase().replace(/-/g, ' ')}</th>`;
    });
    thHtml += '</tr>';
    thead.innerHTML = thHtml;
    tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="text-center text-muted py-4">Loading ${config.title}...</td></tr>`;

    try {
        let data = await mikrotikApi(config.endpoint);
        if (!data) data = [];
        if (!Array.isArray(data)) data = [data]; // Some Mikrotik versions return single object if only 1 item

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="text-center text-muted py-4">No records found.</td></tr>`;
            return;
        }

        let tbHtml = '';
        data.forEach(item => {
            const id = item['.id'];
            const disabled = item.disabled === "true" || item.disabled === true ? "text-muted" : "";

            tbHtml += `<tr class="${disabled}">`;
            tbHtml += `<td><input type="checkbox" class="item-checkbox" value="${id}"></td>`;

            config.columns.forEach(col => {
                let val = item[col] || '';
                // Format uptime or large bytes if needed
                if (col.includes('bytes')) {
                    const b = parseInt(val);
                    if (!isNaN(b) && val !== "") val = (b / 1024 / 1024).toFixed(2) + ' MB';
                }

                // Add icons for status
                let prefix = '';
                if (col === config.columns[0]) {
                    if (item.disabled === "true" || item.disabled === true) {
                        prefix = '<span class="text-danger fw-bold" title="Disabled">X</span> ';
                    } else if (config.endpoint.includes('/active')) {
                        prefix = '<span class="text-success fw-bold" title="Active">A</span> ';
                    } else if (item.dynamic === "true" || item.dynamic === true) {
                        prefix = '<span class="text-primary fw-bold" title="Dynamic">D</span> ';
                    } else if (item.blocked === "true" || item.blocked === true) {
                         prefix = '<span class="text-warning fw-bold" title="Blocked">B</span> ';
                    }
                }

                tbHtml += `<td>${prefix}${escapeHtml(val)}</td>`;
            });
            tbHtml += `</tr>`;
        });

        tbody.innerHTML = tbHtml;

    } catch (error) {
        console.error(`Error loading ${currentHotspotTab}:`, error);
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="text-center text-danger py-4">Connection failed. Check router settings.</td></tr>`;
    }
}

function toggleSelectAllItems(checkbox) {
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = checkbox.checked);
}

function getSelectedIds() {
    return Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.value);
}

async function deleteHotspotSelected() {
    const ids = getSelectedIds();
    if (ids.length === 0) {
        alert("Please select items to remove.");
        return;
    }

    if (!confirm(`Are you sure you want to remove ${ids.length} item(s)?`)) return;

    const config = HOTSPOT_TABS_CONFIG[currentHotspotTab];
    let successCount = 0;

    for (const id of ids) {
        try {
            await mikrotikApi(`${config.endpoint}/${id}`, 'DELETE');
            successCount++;
        } catch (e) {
            console.error(e);
        }
    }

    alert(`Removed ${successCount} out of ${ids.length} items.`);
    loadHotspotCurrentTab();
}

async function toggleHotspotSelected(action) {
    // action is 'enable' or 'disable'
    const ids = getSelectedIds();
    if (ids.length === 0) {
        alert("Please select items to modify.");
        return;
    }

    const config = HOTSPOT_TABS_CONFIG[currentHotspotTab];
    if (config.readonly) {
        alert("Cannot enable/disable items in this tab.");
        return;
    }

    const disabledVal = action === 'disable' ? 'true' : 'false';
    let successCount = 0;

    for (const id of ids) {
        try {
            await mikrotikApi(`${config.endpoint}/${id}`, 'PATCH', { disabled: disabledVal });
            successCount++;
        } catch (e) {
            console.error(e);
        }
    }

    loadHotspotCurrentTab();
}

function openHotspotGenericModal() {
    const config = HOTSPOT_TABS_CONFIG[currentHotspotTab];
    if (config.readonly) {
        alert(`Adding items to ${config.title} is not supported directly via this interface.`);
        return;
    }

    document.getElementById('hotspotGenericModalTitle').innerText = `Add ${config.title.slice(0, -1)}`;
    const form = document.getElementById('hotspotGenericForm');

    let html = '';
    config.fields.forEach(f => {
        const hint = f.hint ? ` <small class="text-muted">(${f.hint})</small>` : '';
        const req = f.required ? 'required' : '';
        const def = f.default || '';

        if (f.type === 'select') {
            let opts = f.options.map(o => `<option value="${o}" ${def===o?'selected':''}>${o}</option>`).join('');
            html += `
            <div class="mb-2">
                <label class="form-label mb-1" style="font-size: 13px; font-weight: 500;">${f.label}${hint}</label>
                <select class="form-select form-select-sm" id="genf_${f.id}" ${req}>${opts}</select>
            </div>`;
        } else {
            html += `
            <div class="mb-2">
                <label class="form-label mb-1" style="font-size: 13px; font-weight: 500;">${f.label}${hint}</label>
                <input type="${f.type}" class="form-control form-control-sm" id="genf_${f.id}" value="${def}" ${req}>
            </div>`;
        }
    });

    form.innerHTML = html;

    var myModal = new bootstrap.Modal(document.getElementById('hotspotGenericModal'));
    myModal.show();
}

async function saveHotspotGeneric() {
    const config = HOTSPOT_TABS_CONFIG[currentHotspotTab];
    const payload = {};

    // Validate and collect
    for (const f of config.fields) {
        const el = document.getElementById(`genf_${f.id}`);
        if (!el) continue;
        const val = el.value.trim();

        if (f.required && !val) {
            alert(`${f.label} is required.`);
            return;
        }

        if (val) {
            if (f.type === 'number') {
                payload[f.id] = parseInt(val);
            } else {
                payload[f.id] = val;
            }
        }
    }

    try {
        await mikrotikApi(config.endpoint, 'PUT', payload);
        bootstrap.Modal.getInstance(document.getElementById('hotspotGenericModal')).hide();
        loadHotspotCurrentTab();
    } catch (e) {
        console.error(e);
        alert(`Failed to save: ${e.message}`);
    }
}

// ==========================================
// PPPoE CONTROLLER
// ==========================================

async function loadPppoeSecrets() {
    const tbody = document.querySelector('#pppoeSecretsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Loading...</td></tr>';

    try {
        let data = await mikrotikApi('/ppp/secret');
        if (!data) data = [];
        if (!Array.isArray(data)) data = [data];

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No PPPoE secrets found.</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const id = item['.id'];
            const disabled = item.disabled === "true" || item.disabled === true;
            const cls = disabled ? 'text-muted' : '';
            const prefix = disabled ? '<span class="text-danger fw-bold" title="Disabled">X</span> ' : '';

            html += `<tr class="${cls}">`;
            html += `<td>${prefix}${escapeHtml(item.name || '')}</td>`;
            html += `<td>${escapeHtml(item.profile || '')}</td>`;
            html += `<td>${escapeHtml(item.service || '')}</td>`;
            html += `<td>`;
            if (!disabled) {
                html += `<button class="btn btn-outline-danger btn-sm" onclick="deletePppoeSecret('${id}')">Remove</button>`;
            } else {
                html += `<button class="btn btn-outline-success btn-sm" onclick="enablePppoeSecret('${id}')">Enable</button>`;
            }
            html += `</td></tr>`;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading PPPoE secrets:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">Connection failed. Check router settings.</td></tr>`;
    }
}

async function loadPppoeActive() {
    const tbody = document.querySelector('#pppoeActiveTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Loading...</td></tr>';

    try {
        let data = await mikrotikApi('/ppp/active');
        if (!data) data = [];
        if (!Array.isArray(data)) data = [data];

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No active PPPoE connections.</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            html += `<tr>`;
            html += `<td><span class="text-success fw-bold" title="Active">A</span> ${escapeHtml(item.name || '')}</td>`;
            html += `<td>${escapeHtml(item.address || '')}</td>`;
            html += `<td>${escapeHtml(item.uptime || '')}</td>`;
            html += `</tr>`;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading PPPoE active:', error);
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">Connection failed. Check router settings.</td></tr>`;
    }
}

async function deletePppoeSecret(id) {
    if (!confirm('Are you sure you want to remove this PPPoE secret?')) return;
    try {
        await mikrotikApi(`/rest/ppp/secret/${id}`, 'DELETE');
        loadPppoeSecrets();
    } catch (e) {
        alert('Failed to remove: ' + e.message);
    }
}

async function enablePppoeSecret(id) {
    try {
        await mikrotikApi(`/rest/ppp/secret/${id}`, 'PATCH', { disabled: 'false' });
        loadPppoeSecrets();
    } catch (e) {
        alert('Failed to enable: ' + e.message);
    }
}

// Intercept navigation to load data when hotspot/pppoe view is opened
document.addEventListener('DOMContentLoaded', () => {
    initHotspotTabs();

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            if (target === 'hotspot-view') {
                setTimeout(() => {
                    loadHotspotCurrentTab();
                }, 100);
            }
            if (target === 'pppoe-view') {
                setTimeout(() => {
                    loadPppoeSecrets();
                    loadPppoeActive();
                }, 100);
            }
            if (target === 'dashboard-view') {
                setTimeout(() => {
                    loadDashboardData();
                }, 100);
            }
        });
    });
});

// ---- Dark Mode ----
function initDarkMode() {
    var isDark = localStorage.getItem('qv_dark_mode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function toggleDarkMode() {
    var isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('qv_dark_mode', 'false');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('qv_dark_mode', 'true');
    }
}

// Initialize on load
$(document).ready(function() {
    initDarkMode();
});

// ---- QR Code Importer ----
function scanQRImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);

            const imageData = context.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, img.width, img.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                try {
                    // Try parsing as JSON first
                    const data = JSON.parse(code.data);
                    if (data.ip) $('#routerIp').val(data.ip);
                    if (data.user) $('#routerUser').val(data.user);
                    if (data.pass) $('#routerPass').val(data.pass);
                    if (data.port) $('#routerPort').val(data.port);
                    if (data.proto) $('#routerProto').val(data.proto);
                    if (data.name) $('#routerProfileName').val(data.name);
                    alert('QR Code imported successfully! Please save the settings.');
                } catch (err) {
                    // If not JSON, maybe simple string format like IP,User,Pass,Port
                    const parts = code.data.split(',');
                    if (parts.length >= 3) {
                        $('#routerIp').val(parts[0].trim());
                        $('#routerUser').val(parts[1].trim());
                        $('#routerPass').val(parts[2].trim());
                        if (parts[3]) $('#routerPort').val(parts[3].trim());
                        alert('QR Code imported successfully! Please save the settings.');
                    } else {
                        alert('Unrecognized QR code format. Please use JSON or IP,User,Pass,Port format.');
                    }
                }
            } else {
                alert('No QR code found in the image. Please try another image.');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input
    event.target.value = '';
}

// ---- Export / Import Settings ----
function exportSettings() {
    var settings = {};
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('qv_')) {
            settings[key] = localStorage.getItem(key);
        }
    }

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "easybox_settings_backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importSettings(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var settings = JSON.parse(e.target.result);
            var count = 0;
            for (var key in settings) {
                if (key.startsWith('qv_')) {
                    localStorage.setItem(key, settings[key]);
                    count++;
                }
            }
            if (count > 0) {
                alert("Settings imported successfully. The application will now reload.");
                window.location.reload();
            } else {
                alert("No valid EasyBox settings found in the selected file.");
            }
        } catch (err) {
            alert("Error parsing settings file. Please ensure it is a valid JSON backup.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
async function loadDashboardData() {
    try {
        // Fetch System Resources
        let res = await mikrotikApi('/rest/system/resource', 'GET');
        let data = res[0] || res;

        if (data.uptime) document.getElementById('dash-uptime').textContent = formatUptime(data.uptime);
        if (data['cpu-load'] !== undefined) document.getElementById('dash-cpu').textContent = data['cpu-load'] + '%';
        if (data['board-name']) document.getElementById('dash-board').textContent = data['board-name'];
        if (data.version) document.getElementById('dash-version').textContent = 'RouterOS Version: ' + data.version;

        // Memory
        if (data['free-memory'] !== undefined && data['total-memory'] !== undefined) {
            var freeMem = parseInt(data['free-memory']);
            var totMem = parseInt(data['total-memory']);
            var usedMem = totMem - freeMem;
            var memPct = Math.round((usedMem / totMem) * 100);

            document.getElementById('dash-mem-text').textContent = formatBytes(usedMem) + ' / ' + formatBytes(totMem);
            document.getElementById('dash-mem-pct').textContent = memPct + '%';
            var memBar = document.getElementById('dash-mem-bar');
            if (memBar) memBar.style.width = memPct + '%';
        }

        // HDD
        if (data['free-hdd-space'] !== undefined && data['total-hdd-space'] !== undefined) {
            var freeHdd = parseInt(data['free-hdd-space']);
            var totHdd = parseInt(data['total-hdd-space']);
            var usedHdd = totHdd - freeHdd;
            var hddPct = Math.round((usedHdd / totHdd) * 100);

            document.getElementById('dash-hdd-text').textContent = formatBytes(usedHdd) + ' / ' + formatBytes(totHdd);
            document.getElementById('dash-hdd-pct').textContent = hddPct + '%';
            var hddBar = document.getElementById('dash-hdd-bar');
            if (hddBar) hddBar.style.width = hddPct + '%';
        }
    } catch (err) {
        console.error("Dashboard resource error:", err);
        document.getElementById('dash-uptime').textContent = "Error";
        document.getElementById('dash-cpu').textContent = "Error";
    }

    try {
        // Fetch Active Hotspot Users Count
        let activeRes = await mikrotikApi('/rest/ip/hotspot/active', 'GET');
        var activeUsersCount = Array.isArray(activeRes) ? activeRes.length : 0;
        document.getElementById('dash-active-users').textContent = activeUsersCount;
    } catch (err) {
        console.error("Dashboard active users error:", err);
        document.getElementById('dash-active-users').textContent = "Error";
    }
}

// Utility: format uptime string from MikroTik (e.g. 1w2d3h4m5s)
function formatUptime(uptimeStr) {
    if (!uptimeStr) return '--';
    return uptimeStr.replace('w', 'w ').replace('d', 'd ').replace('h', 'h ').replace('m', 'm ').trim();
}

// Utility: format bytes to KB/MB/GB
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
