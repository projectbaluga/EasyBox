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

// ---- Hotspot Users Management Modal Logic ----

async function loadHotspotUsersModal() {
    var tbody = document.querySelector('#manageUsersTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Loading...</td></tr>';

    try {
        var data = await mikrotikApi('/ip/hotspot/user');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found.</td></tr>';
            return;
        }

        var html = '';
        data.forEach(function(u) {
            if (u.name === 'default-trial') return;
            var uptime = u.uptime || '0s';
            var safeUser = btoa(unescape(encodeURIComponent(JSON.stringify(u))));
            html += `<tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.profile || 'default'}</td>
                <td>${uptime}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditUserForm('${safeUser}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUserModal('${u['.id']}', '${u.name}')">Delete</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${e.message}</td></tr>`;
    }
}

function openAddUserForm() {
    document.getElementById('editUserId').value = '';
    document.getElementById('userFormTitle').innerText = 'Add User';
    document.getElementById('formUsername').value = '';
    document.getElementById('formUsername').disabled = false;
    document.getElementById('formPassword').value = '';
    document.getElementById('formProfile').value = '';
    document.getElementById('formUptimeLimit').value = '';
    document.getElementById('formBytesLimit').value = '';

    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal'));
    modal.show();
}

function openEditUserForm(encodedUser) {
    var u = JSON.parse(decodeURIComponent(escape(atob(encodedUser))));
    document.getElementById('editUserId').value = u['.id'];
    document.getElementById('userFormTitle').innerText = 'Edit User: ' + u.name;
    document.getElementById('formUsername').value = u.name;
    document.getElementById('formUsername').disabled = true; // RouterOS requires recreating to change name usually, or its the primary key concept
    document.getElementById('formPassword').value = u.password || '';
    document.getElementById('formProfile').value = u.profile || '';
    document.getElementById('formUptimeLimit').value = u['limit-uptime'] || '';
    document.getElementById('formBytesLimit').value = u['limit-bytes-total'] || '';

    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal'));
    modal.show();
}

async function saveHotspotUser() {
    var id = document.getElementById('editUserId').value;
    var name = document.getElementById('formUsername').value.trim();
    var pass = document.getElementById('formPassword').value;
    var profile = document.getElementById('formProfile').value.trim();
    var limitUptime = document.getElementById('formUptimeLimit').value.trim();
    var limitBytes = document.getElementById('formBytesLimit').value.trim();

    if (!name) {
        alert("Username is required.");
        return;
    }

    var payload = { name: name };
    if (pass) payload.password = pass;
    if (profile) payload.profile = profile;
    if (limitUptime) payload['limit-uptime'] = limitUptime;
    if (limitBytes) payload['limit-bytes-total'] = limitBytes;

    try {
        if (id) {
            // Edit existing user
            await mikrotikApi(`/ip/hotspot/user/${id}`, 'PATCH', payload);
        } else {
            // Add new user
            await mikrotikApi('/ip/hotspot/user', 'PUT', payload);
        }

        var modal = bootstrap.Modal.getInstance(document.getElementById('userFormModal'));
        if (modal) modal.hide();

        loadHotspotUsersModal();
        loadHotspotUsers(); // Refresh background table if active
    } catch (e) {
        alert('Failed to save user: ' + e.message);
    }
}

async function deleteUserModal(id, name) {
    if (!confirm(`Are you sure you want to delete user '${name}'?`)) return;
    try {
        await mikrotikApi(`/ip/hotspot/user/${id}`, 'DELETE');
        loadHotspotUsersModal();
        loadHotspotUsers(); // Refresh background table if active
    } catch (e) {
        alert('Failed to delete: ' + e.message);
    }
}

// Hook up the Users modal to load data on open
document.getElementById('usersModal')?.addEventListener('show.bs.modal', function () {
    loadHotspotUsersModal();
});
