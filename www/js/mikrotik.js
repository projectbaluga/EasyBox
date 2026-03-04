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
            proto: 'http'
        };
    } catch (e) {
        return { ip: '', user: 'admin', pass: '', proto: 'http' };
    }
}

function saveRouterSettings() {
    var settings = {
        ip: document.getElementById('routerIp').value.trim(),
        user: document.getElementById('routerUser').value.trim(),
        pass: document.getElementById('routerPass').value,
        proto: document.getElementById('routerProto').value
    };
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
}

// ---- REST API Client ----
async function mikrotikApi(endpoint, method = 'GET', body = null) {
    var settings = getRouterSettings();
    if (!settings.ip || !settings.user) {
        throw new Error('Router credentials not set.');
    }

    var url = `${settings.proto}://${settings.ip}/rest${endpoint}`;
    var headers = new Headers();

    // Basic Auth
    headers.set('Authorization', 'Basic ' + btoa(settings.user + ':' + settings.pass));

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers.set('Content-Type', 'application/json');
    }

    var options = {
        method: method,
        headers: headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        var response = await fetch(url, options);
        if (!response.ok) {
            var errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }
        // DELETE often returns empty body
        if (method === 'DELETE') return true;

        return await response.json();
    } catch (error) {
        console.error('Mikrotik API Error:', error);
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
