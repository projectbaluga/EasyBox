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

    // Populate Header Switcher
    populateHeaderRouterSwitcher();

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
    // Auto refresh dashboard if active
    if (document.getElementById('dashboard-view').classList.contains('active')) {
        loadDashboardData();
    }
}

function populateHeaderRouterSwitcher() {
    var profiles = getRouterProfiles();
    var currentId = getCurrentProfileId();
    var list = document.getElementById('headerRouterList');
    var activeLabel = document.getElementById('activeRouterName');

    if (!list) return;

    list.innerHTML = '';
    var activeProfileName = 'Select Router';

    profiles.forEach(p => {
        var isSelected = p.id === currentId;
        if (isSelected) activeProfileName = p.name || p.id;

        var li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item d-flex align-items-center justify-content-between ${isSelected ? 'active' : ''}" href="#" onclick="switchRouterFromHeader('${p.id}'); return false;">
                <span>${p.name || p.id}</span>
                ${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </a>
        `;
        list.appendChild(li);
    });

    if (activeLabel) activeLabel.textContent = activeProfileName;
}

function switchRouterFromHeader(id) {
    setCurrentProfileId(id);
    populateRouterSettings();

    // Notify user
    var profile = getRouterSettings();
    console.log('Switched to router:', profile.name);

    // Refresh current view
    var activeView = document.querySelector('.app-view.active');
    if (activeView) {
        var id = activeView.id;
        if (id === 'dashboard-view') loadDashboardData();
        if (id === 'hotspot-view') loadHotspotCurrentTab();
        if (id === 'pppoe-view') { loadPppoeSecrets(); loadPppoeActive(); }
    }
}

function filterRouterProfiles() {
    var query = document.getElementById('routerProfileSearch').value.toLowerCase();
    var select = document.getElementById('routerProfileSelect');
    var profiles = getRouterProfiles();

    select.innerHTML = '';
    profiles.forEach(p => {
        if ((p.name && p.name.toLowerCase().includes(query)) || p.ip.includes(query)) {
            var opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name || p.id;
            if(p.id === getCurrentProfileId()) opt.selected = true;
            select.appendChild(opt);
        }
    });
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
    btn.textContent = t('testing') || 'Testing...';
    resultDiv.textContent = '';

    try {
        await mikrotikApi('/system/identity', 'GET', null, settings);
        resultDiv.textContent = t('conn_success');
        resultDiv.className = 'mt-2 text-center text-success';
    } catch (e) {
        resultDiv.textContent = t('conn_failed') + e.message;
        resultDiv.className = 'mt-2 text-center text-danger';
    } finally {
        btn.disabled = false;
        btn.textContent = t('test_connection');
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
        title: 'All Vouchers',
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
        title: 'Internet Packages',
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
        title: 'Online Users',
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
    const mainTabs = document.querySelectorAll('.winbox-tab');
    const advTabs = document.querySelectorAll('.winbox-tab-adv');

    const handleTabSwitch = (e, isAdv = false) => {
        // Remove active from all main tabs
        mainTabs.forEach(t => t.classList.remove('active'));

        if (!isAdv) {
            e.currentTarget.classList.add('active');
        } else {
            // Keep Advanced visually active or similar, for now just de-select others
            // Could add active class to the dropdown button if desired
        }

        currentHotspotTab = e.currentTarget.dataset.tab;

        const toolbar = document.querySelector('.winbox-toolbar');
        const tableWrap = document.querySelector('.winbox-table-wrapper');
        const genContent = document.getElementById('generator-content');

        if (currentHotspotTab === 'generator') {
            toolbar.style.display = 'none';
            tableWrap.style.display = 'none';
            genContent.style.display = 'block';
            if (typeof editorZoomFit === 'function') setTimeout(editorZoomFit, 50);
        } else {
            toolbar.style.display = 'flex';
            tableWrap.style.display = 'block';
            genContent.style.display = 'none';
            loadHotspotCurrentTab();
        }
    };

    mainTabs.forEach(tab => tab.addEventListener('click', (e) => handleTabSwitch(e, false)));
    advTabs.forEach(tab => tab.addEventListener('click', (e) => handleTabSwitch(e, true)));
}

async function loadHotspotCurrentTab() {
    if (currentHotspotTab === 'generator') return;
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
        await mikrotikApi(`/ppp/secret/${id}`, 'DELETE');
        loadPppoeSecrets();
    } catch (e) {
        alert('Failed to remove: ' + e.message);
    }
}

async function enablePppoeSecret(id) {
    try {
        await mikrotikApi(`/ppp/secret/${id}`, 'PATCH', { disabled: 'false' });
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
            if (target === 'bulk-push-view') {
                setTimeout(() => {
                    renderBulkRouterList();
                    updateBulkConfigFields();
                }, 100);
            }
        });
    });
});

// ==========================================
// BULK PUSH CONFIGURATION
// ==========================================

const COMMON_SCRIPTS = {
    'hp-clear-active': {
        name: 'Clear Active Users',
        desc: 'Removes all currently logged-in hotspot users.',
        script: '/ip hotspot active remove [find]'
    },
    'hp-clear-cookies': {
        name: 'Clear Hotspot Cookies',
        desc: 'Removes saved login sessions from the router.',
        script: '/ip hotspot cookie remove [find]'
    },
    'hp-cleanup-expired': {
        name: 'Auto-Cleanup Expired',
        desc: 'Finds and deletes users whose time limit has reached.',
        script: '/ip hotspot user remove [find where uptime>=limit-uptime and limit-uptime>0s]'
    },
    'set-dns-google': {
        name: 'Set Google DNS',
        desc: 'Configures router to use 8.8.8.8 and 8.8.4.4.',
        script: '/ip dns set servers=8.8.8.8,8.8.4.4; /ip dns cache flush'
    },
    'set-dns-cloudflare': {
        name: 'Set Cloudflare DNS',
        desc: 'Configures router to use 1.1.1.1 and 1.0.0.1.',
        script: '/ip dns set servers=1.1.1.1,1.0.0.1; /ip dns cache flush'
    },
    'sys-ntp-setup': {
        name: 'NTP Time Sync',
        desc: 'Enables network time protocol for accurate logs.',
        script: '/system ntp client set enabled=yes servers=pool.ntp.org'
    },
    'sys-reboot': {
        name: 'Reboot Router',
        desc: 'Triggers a system restart immediately.',
        script: '/system reboot'
    },
    'sys-backup-local': {
        name: 'Local Backup',
        desc: 'Creates a configuration backup file on the router.',
        script: '/system backup save name=manual-backup'
    },
    'sys-backup-cloud': {
        name: 'Cloud Backup (v7+)',
        desc: 'Uploads configuration to MikroTik Cloud storage.',
        script: '/system backup cloud upload-file name=auto-backup'
    },
    'sec-hardening': {
        name: 'Security Hardening',
        desc: 'Disables insecure services (Telnet, FTP, API).',
        script: '/ip service disable telnet,ftp,api,api-ssl'
    },
    'diag-resource': {
        name: 'Check Resources',
        desc: 'Shows CPU, Memory, and Uptime info.',
        script: '/system resource print'
    },
    'diag-health': {
        name: 'System Health',
        desc: 'Checks voltage and temperature sensors.',
        script: '/system health print'
    },
    'diag-neighbors': {
        name: 'IP Neighbors',
        desc: 'Lists other MikroTik devices on the network.',
        script: '/ip neighbor print'
    }
};

function renderBulkRouterList() {
    var container = document.getElementById('bulk-router-list');
    if (!container) return;

    var profiles = getRouterProfiles();
    if (profiles.length === 0) {
        container.innerHTML = '<div class="text-muted small">No routers found.</div>';
        return;
    }

    var html = '';
    profiles.forEach(p => {
        html += `
            <div class="form-check">
                <input class="form-check-input bulk-router-check" type="checkbox" value="${p.id}" id="bulk_chk_${p.id}">
                <label class="form-check-label small" for="bulk_chk_${p.id}">
                    <strong>${p.name || p.id}</strong> (${p.ip})
                </label>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleBulkRouterSelectAll(chk) {
    document.querySelectorAll('.bulk-router-check').forEach(c => c.checked = chk.checked);
}

function syncBulkScriptArea() {
    var area = document.getElementById('bulk_script_text');
    if (!area) return;

    var selectedScripts = [];
    document.querySelectorAll('.bulk-script-chk:checked').forEach(chk => {
        var key = chk.value;
        if (COMMON_SCRIPTS[key]) {
            selectedScripts.push(COMMON_SCRIPTS[key].script);
        }
    });

    area.value = selectedScripts.join('\n');
}

function updateBulkConfigFields() {
    var type = document.getElementById('bulkConfigType').value;
    var container = document.getElementById('bulkConfigFields');
    if (!container) return;

    var html = '';
    if (type === 'hotspot-profile') {
        html = `
            <div class="row g-2">
                <div class="col-12">
                    <label class="form-label small fw-bold" data-i18n="profile_name">Profile Name</label>
                    <input type="text" class="form-control form-control-sm" id="bulk_hp_name" placeholder="e.g. VIP-1HOUR">
                </div>
                <div class="col-6">
                    <label class="form-label small fw-bold" data-i18n="wiz_speed_limit">Rate Limit</label>
                    <input type="text" class="form-control form-control-sm" id="bulk_hp_rate" placeholder="e.g. 5M/5M">
                </div>
                <div class="col-6">
                    <label class="form-label small fw-bold" data-i18n="adv_shared_users">Shared Users</label>
                    <input type="number" class="form-control form-control-sm" id="bulk_hp_shared" value="1">
                </div>
            </div>
        `;
    } else if (type === 'ip-binding') {
        html = `
            <div class="row g-2">
                <div class="col-12">
                    <label class="form-label small fw-bold">MAC Address</label>
                    <input type="text" class="form-control form-control-sm" id="bulk_ipb_mac" placeholder="AA:BB:CC:DD:EE:FF">
                </div>
                <div class="col-12">
                    <label class="form-label small fw-bold">Comment</label>
                    <input type="text" class="form-control form-control-sm" id="bulk_ipb_comment" placeholder="Whitelist device">
                </div>
            </div>
        `;
    } else if (type === 'script') {
        let scriptsHtml = '<div class="row g-2" style="max-height: 250px; overflow-y: auto;">';
        for (let key in COMMON_SCRIPTS) {
            let name = t(key) || COMMON_SCRIPTS[key].name;
            let desc = t(key + '_desc') || COMMON_SCRIPTS[key].desc;
            scriptsHtml += `
                <div class="col-12">
                    <div class="form-check p-2 border rounded bg-white shadow-xs d-flex align-items-center gap-2" style="cursor: pointer;" onclick="var c = this.querySelector('input'); c.checked = !c.checked; syncBulkScriptArea();">
                        <input class="form-check-input bulk-script-chk ms-0" type="checkbox" value="${key}" onclick="event.stopPropagation(); syncBulkScriptArea();" style="flex-shrink: 0;">
                        <div style="line-height: 1.2;">
                            <div class="fw-bold small">${name}</div>
                            <div class="text-muted" style="font-size: 10px;">${desc}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        scriptsHtml += '</div>';

        html = `
            <div class="mb-3">
                <label class="form-label small fw-bold mb-2" data-i18n="common_scripts">Common Scripts</label>
                ${scriptsHtml}
            </div>
            <div>
                <label class="form-label small fw-bold" data-i18n="commands">Commands (One per line)</label>
                <textarea class="form-control form-control-sm" id="bulk_script_text" rows="4" placeholder="/system resource print\\n/ip address print"></textarea>
                <small class="text-muted" style="font-size:10px;" data-i18n="cli_note">Note: Uses the /rest/cli endpoint. Enter raw RouterOS commands.</small>
            </div>
        `;
    }
    container.innerHTML = html;
    applyTranslations();
}

function logBulk(msg, type = 'info') {
    var log = document.getElementById('bulkExecutionLog');
    if (!log) return;

    var time = new Date().toLocaleTimeString();
    var color = '#0f0'; // green
    if (type === 'error') color = '#f00'; // red
    if (type === 'warn') color = '#ff0'; // yellow

    if (log.innerHTML.includes('Waiting for action...')) log.innerHTML = '';

    log.innerHTML += `<div>[${time}] <span style="color:${color}">${msg}</span></div>`;
    log.scrollTop = log.scrollHeight;
}

async function executeBulkPush() {
    var selectedIds = Array.from(document.querySelectorAll('.bulk-router-check:checked')).map(c => c.value);
    if (selectedIds.length === 0) {
        alert("Please select at least one router.");
        return;
    }

    var type = document.getElementById('bulkConfigType').value;
    var btn = document.getElementById('btnExecuteBulk');
    btn.disabled = true;

    logBulk(`Starting bulk push for ${selectedIds.length} routers...`, 'warn');

    var profiles = getRouterProfiles();

    for (var id of selectedIds) {
        var router = profiles.find(p => p.id === id);
        if (!router) continue;

        logBulk(`Connecting to ${router.name || router.ip}...`);

        try {
            if (type === 'hotspot-profile') {
                var payload = {
                    name: document.getElementById('bulk_hp_name').value.trim(),
                    'rate-limit': document.getElementById('bulk_hp_rate').value.trim(),
                    'shared-users': document.getElementById('bulk_hp_shared').value
                };
                if (!payload.name) throw new Error("Profile name is required.");
                await mikrotikApi('/ip/hotspot/user/profile', 'PUT', payload, router);
                logBulk(`SUCCESS: Hotspot Profile '${payload.name}' added to ${router.name}.`);

            } else if (type === 'ip-binding') {
                var payload = {
                    'mac-address': document.getElementById('bulk_ipb_mac').value.trim(),
                    'type': 'bypassed',
                    'comment': document.getElementById('bulk_ipb_comment').value.trim()
                };
                if (!payload['mac-address']) throw new Error("MAC address is required.");
                await mikrotikApi('/ip/hotspot/ip-binding', 'PUT', payload, router);
                logBulk(`SUCCESS: IP Binding for ${payload['mac-address']} added to ${router.name}.`);

            } else if (type === 'script') {
                var scriptText = document.getElementById('bulk_script_text').value.trim();
                if (!scriptText) throw new Error("No script provided.");

                logBulk(`Executing CLI script on ${router.name}...`);
                try {
                    // Try the standard MikroTik v7 /rest/cli endpoint
                    await mikrotikApi('/cli', 'POST', { command: scriptText }, router);
                    logBulk(`SUCCESS: Script executed on ${router.name}.`);
                } catch (cliError) {
                    if (cliError.message.includes('400') || cliError.message.includes('cli')) {
                        logBulk(`CLI endpoint failed. Attempting fallback via /system/script...`, 'warn');
                        // Fallback: Create and run a temporary script
                        var tmpName = 'eb_tmp_' + Math.floor(Math.random() * 10000);
                        try {
                            // 1. Create script
                            await mikrotikApi('/system/script', 'PUT', { name: tmpName, source: scriptText }, router);
                            // 2. Run script - In v7 REST, we can use the .id/run or the name/run endpoint
                            // A common way to run a script is via POST to /system/script/run with name
                            await mikrotikApi('/system/script/run', 'POST', { '.id': tmpName }, router);
                            // 3. Cleanup
                            await mikrotikApi('/system/script/' + tmpName, 'DELETE', null, router);
                            logBulk(`SUCCESS (via fallback): Script executed on ${router.name}.`);
                        } catch (fallbackError) {
                            throw new Error(`CLI and Fallback failed. ${cliError.message}`);
                        }
                    } else {
                        throw cliError;
                    }
                }
            }
        } catch (e) {
            logBulk(`FAILED on ${router.name}: ${e.message}`, 'error');
        }
    }

    logBulk("Bulk operation finished.", 'warn');
    btn.disabled = false;
}

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
    populateRouterSettings();

    // If dashboard is active, load its data
    if (document.getElementById('dashboard-view').classList.contains('active')) {
        loadDashboardData();
    }
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
        if (key && (key.startsWith('qv_') || key.startsWith('eb_') || key.startsWith('router_'))) {
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
                if (key.startsWith('qv_') || key.startsWith('eb_') || key.startsWith('router_')) {
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
    // Also load multi-router status
    loadMultiRouterStatus();

    try {
        // Fetch System Resources
        let res = await mikrotikApi('/system/resource', 'GET');
        let data = res[0] || res;

        if (data.uptime) document.getElementById('dash-uptime').textContent = formatUptime(data.uptime);
        if (data['cpu-load'] !== undefined) document.getElementById('dash-cpu').textContent = data['cpu-load'] + '%';
        if (data['board-name']) document.getElementById('dash-board').textContent = data['board-name'];
        if (data.version) {
            const versionLabel = t('routeros_version');
            document.getElementById('dash-version').textContent = versionLabel + ': ' + data.version;
        }

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
        let activeRes = await mikrotikApi('/ip/hotspot/active', 'GET');
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

// ==========================================
// MULTI-ROUTER STATUS
// ==========================================
async function loadMultiRouterStatus() {
    var container = document.getElementById('multi-router-list');
    var onlineBadge = document.getElementById('routers-online-count');
    if (!container) return;

    var profiles = getRouterProfiles();
    var currentId = getCurrentProfileId();

    if (profiles.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-3">No router profiles found.</div>';
        return;
    }

    container.innerHTML = '';
    var onlineCount = 0;

    // We process them sequentially or in parallel. Parallel is better for many routers.
    var promises = profiles.map(async (p) => {
        var cardId = `router-card-${p.id}`;
        var col = document.createElement('div');
        col.className = 'col-6 col-md-4';
        col.innerHTML = `
            <div class="p-2 border rounded d-flex flex-column gap-1 router-mini-card ${p.id === currentId ? 'border-primary' : ''}" id="${cardId}" onclick="switchRouterFromHeader('${p.id}')" style="cursor: pointer; background: var(--code-bg); transition: all 0.2s;">
                <div class="d-flex justify-content-between align-items-start">
                    <span class="fw-bold text-truncate" style="font-size: 12px; max-width: 80%;">${p.name || p.id}</span>
                    <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #ccc; margin-top: 4px;"></span>
                </div>
                <div class="d-flex justify-content-between align-items-center" style="font-size: 10px;">
                    <span class="text-muted">${p.ip}</span>
                    <span class="router-stats d-none">-- active</span>
                </div>
            </div>
        `;
        container.appendChild(col);

        try {
            // Check health
            let res = await mikrotikApi('/system/resource', 'GET', null, p);
            let data = res[0] || res;

            if (data) {
                onlineCount++;
                let dot = col.querySelector('.status-dot');
                if (dot) dot.style.background = '#2ECC71';

                // Try to get active users if it's a hotspot
                try {
                    let activeRes = await mikrotikApi('/ip/hotspot/active', 'GET', null, p);
                    let count = Array.isArray(activeRes) ? activeRes.length : 0;
                    let stats = col.querySelector('.router-stats');
                    if (stats) {
                        stats.textContent = count + ' active';
                        stats.classList.remove('d-none');
                    }
                } catch(e) {}
            }
        } catch (e) {
            let dot = col.querySelector('.status-dot');
            if (dot) dot.style.background = '#ef4444';
        }

        if (onlineBadge) onlineBadge.textContent = onlineCount + ' Online';
    });

    await Promise.all(promises);
}
