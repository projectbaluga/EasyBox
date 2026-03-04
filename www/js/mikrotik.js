// ============================================
// Mikrotik REST API Client & UI Manager
// ============================================

// ---- Storage ----
function getRouterSettings() {
    try {
        return JSON.parse(localStorage.getItem('qv_router_settings')) || {
            ip: '',
            user: 'admin',
            pass: '',
            proto: 'http',
            port: ''
        };
    } catch (e) {
        return { ip: '', user: 'admin', pass: '', proto: 'http', port: '' };
    }
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

function saveRouterSettings() {
    var settings = getSettingsFromForm();
    localStorage.setItem('qv_router_settings', JSON.stringify(settings));

    var modalEl = document.getElementById('routerSettingsModal');
    if (modalEl) {
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }

    // Auto refresh active view if credentials exist
    if (settings.ip && settings.user) {
        var activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) {
            var target = activeTab.getAttribute('data-target');
            if (target === 'hotspot-view') {
                loadHotspotUsers();
                loadHotspotActive();
            } else if (target === 'pppoe-view') {
                loadPppoeSecrets();
                loadPppoeActive();
            }
        }
    }
}

function populateRouterSettings() {
    var settings = getRouterSettings();
    document.getElementById('routerIp').value = settings.ip || '';
    document.getElementById('routerUser').value = settings.user || 'admin';
    document.getElementById('routerPass').value = settings.pass || '';
    document.getElementById('routerProto').value = settings.proto || 'http';
    document.getElementById('routerPort').value = settings.port || '';
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
            var browserMsg = window.Capacitor && window.Capacitor.isNativePlatform() ? '' : 'If running in a PC Browser, CORS will block this. Use the Android App or launch Chrome with --disable-web-security. ';
            throw new Error(`Network Error: Failed to connect to ${settings.ip}. ${browserMsg}Check the IP, Port, Protocol (HTTP/HTTPS), or if the REST API is enabled in Winbox (IP -> Services -> www).`);
        }

        throw error;
    }
}

// ---- Hotspot Manager ----
async function loadHotspotUsers() {
    var tbody = document.querySelector('#hotspotUsersTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading...</td></tr>';

    try {
        var data = await mikrotikApi('/ip/hotspot/user');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found.</td></tr>';
            return;
        }

        var html = '';
        data.forEach(function(u) {
            if (u.name === 'default-trial') return; // skip trial
            var uptime = u.uptime || '0s';
            html += `<tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.profile || 'default'}</td>
                <td>${uptime}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteHotspotUser('${u['.id']}', '${u.name}')">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${e.message}</td></tr>`;
    }
}

async function loadHotspotActive() {
    var tbody = document.querySelector('#hotspotActiveTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>';

    try {
        var data = await mikrotikApi('/ip/hotspot/active');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No active connections.</td></tr>';
            return;
        }

        var html = '';
        data.forEach(function(a) {
            html += `<tr>
                <td><strong>${a.user}</strong></td>
                <td>${a.address}</td>
                <td>${a.uptime}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${e.message}</td></tr>`;
    }
}

async function deleteHotspotUser(id, name) {
    if (!confirm(`Are you sure you want to delete user '${name}'?`)) return;
    try {
        await mikrotikApi(`/ip/hotspot/user/${id}`, 'DELETE');
        loadHotspotUsers();
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// ---- PPPoE Manager ----
async function loadPppoeSecrets() {
    var tbody = document.querySelector('#pppoeSecretsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading...</td></tr>';

    try {
        var data = await mikrotikApi('/ppp/secret');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No secrets found.</td></tr>';
            return;
        }

        var html = '';
        data.forEach(function(s) {
            html += `<tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.profile || 'default'}</td>
                <td>${s.service || 'any'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePppoeSecret('${s['.id']}', '${s.name}')">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${e.message}</td></tr>`;
    }
}

async function loadPppoeActive() {
    var tbody = document.querySelector('#pppoeActiveTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>';

    try {
        var data = await mikrotikApi('/ppp/active');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No active connections.</td></tr>';
            return;
        }

        var html = '';
        data.forEach(function(a) {
            html += `<tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.address || '-'}</td>
                <td>${a.uptime}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${e.message}</td></tr>`;
    }
}

async function deletePppoeSecret(id, name) {
    if (!confirm(`Are you sure you want to delete PPPoE secret '${name}'?`)) return;
    try {
        await mikrotikApi(`/ppp/secret/${id}`, 'DELETE');
        loadPppoeSecrets();
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// ---- Initialization & Navigation ----
document.addEventListener('DOMContentLoaded', function() {
    populateRouterSettings();

    // Tab Navigation
    var tabs = document.querySelectorAll('.nav-tab');
    var views = document.querySelectorAll('.app-view');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            // Add active class to clicked tab and corresponding view
            this.classList.add('active');
            var targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Load data if switching to management tabs
            var settings = getRouterSettings();
            if (settings.ip && settings.user) {
                if (targetId === 'hotspot-view') {
                    loadHotspotUsers();
                    loadHotspotActive();
                } else if (targetId === 'pppoe-view') {
                    loadPppoeSecrets();
                    loadPppoeActive();
                }
            } else if (targetId !== 'generator-view') {
                // If no credentials, trigger modal
                var modalEl = document.getElementById('routerSettingsModal');
                if (modalEl) {
                    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                }
            }
        });
    });
});
