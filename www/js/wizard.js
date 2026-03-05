// Quick Setup Wizard Logic

let currentStep = 1;
const totalSteps = 5;

// Listeners for Radio Buttons to show/hide dynamic fields
document.addEventListener('DOMContentLoaded', () => {
    // Internet Connection (DHCP vs PPPoE)
    document.querySelectorAll('input[name="internetType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const pppoeFields = document.getElementById('pppoeFields');
            if (e.target.value === 'pppoe') {
                pppoeFields.classList.remove('d-none');
            } else {
                pppoeFields.classList.add('d-none');
            }
        });
    });

    // WiFi Source (Built-in vs External)
    document.querySelectorAll('input[name="wifiType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const ssidField = document.getElementById('ssidField');
            if (e.target.value === 'builtin') {
                ssidField.classList.remove('d-none');
            } else {
                ssidField.classList.add('d-none');
            }
        });
    });

    // Reset wizard when modal is closed
    const wizardModal = document.getElementById('wizardModal');
    if (wizardModal) {
        wizardModal.addEventListener('hidden.bs.modal', resetWizard);
    }
});

function updateWizardButtons() {
    const btnBack = document.getElementById('wizBtnBack');
    const btnNext = document.getElementById('wizBtnNext');
    const btnExecute = document.getElementById('wizBtnExecute');
    const btnDone = document.getElementById('wizBtnDone');

    // Back Button
    if (currentStep > 1 && currentStep < totalSteps) {
        btnBack.classList.remove('d-none');
    } else {
        btnBack.classList.add('d-none');
    }

    // Next/Execute Buttons
    if (currentStep < totalSteps - 1) {
        btnNext.classList.remove('d-none');
        btnExecute.classList.add('d-none');
        btnDone.classList.add('d-none');
    } else if (currentStep === totalSteps - 1) {
        btnNext.classList.add('d-none');
        btnExecute.classList.remove('d-none');
        btnDone.classList.add('d-none');
    } else {
        // Step 5
        btnBack.classList.add('d-none');
        btnNext.classList.add('d-none');
        btnExecute.classList.add('d-none');
        // Done button handles its own visibility in success state
    }
}

function wizNext() {
    if (currentStep < totalSteps - 1) {
        document.getElementById(`step${currentStep}`).classList.add('d-none');
        currentStep++;
        document.getElementById(`step${currentStep}`).classList.remove('d-none');
        updateWizardButtons();
    }
}

// Ensure functions are available globally for HTML event handlers
window.wizNext = wizNext;
window.wizBack = wizBack;
window.wizExecute = wizExecute;

function wizBack() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).classList.add('d-none');
        currentStep--;
        document.getElementById(`step${currentStep}`).classList.remove('d-none');
        updateWizardButtons();
    }
}

function setWizStatus(text) {
    const el = document.getElementById('wizStatusText');
    if (el) el.textContent = text;
}

function showWizError(msg) {
    const alertEl = document.getElementById('wizardAlert');
    alertEl.textContent = msg;
    alertEl.classList.remove('d-none');

    document.getElementById('wizProgressArea').classList.add('d-none');
    document.getElementById('wizBtnExecute').disabled = false;
    document.getElementById('wizBtnBack').classList.remove('d-none');
}

function resetWizard() {
    currentStep = 1;
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`step${i}`).classList.add('d-none');
    }
    document.getElementById('step1').classList.remove('d-none');

    document.getElementById('wizardAlert').classList.add('d-none');
    document.getElementById('wizProgressArea').classList.add('d-none');
    document.getElementById('wizSuccessArea').classList.add('d-none');
    document.getElementById('wizReadyText').classList.remove('d-none');
    document.getElementById('wizBtnExecute').disabled = false;

    updateWizardButtons();
}

async function wizExecute() {
    // Collect Inputs
    const internetType = document.querySelector('input[name="internetType"]:checked').value;
    const pppoeUser = document.getElementById('pppoeUser').value.trim();
    const pppoePass = document.getElementById('pppoePass').value;

    const wifiType = document.querySelector('input[name="wifiType"]:checked').value;
    const ssid = document.getElementById('wizSsid').value.trim();
    const portalUrl = document.getElementById('wizPortalUrl').value.trim();

    const promoName = document.getElementById('wizPromoName').value.trim();
    const duration = document.getElementById('wizDuration').value;
    const speed = document.getElementById('wizSpeed').value;

    // Basic Validation
    if (internetType === 'pppoe' && !pppoeUser) {
        showWizError("Please enter PPPoE Username.");
        return;
    }
    if (wifiType === 'builtin' && !ssid) {
        showWizError("Please enter a WiFi Name (SSID).");
        return;
    }
    if (!portalUrl) {
        showWizError("Please enter a Login Portal URL.");
        return;
    }
    if (!promoName) {
        showWizError("Please enter a Promo Name.");
        return;
    }

    // Move to Execution Step UI
    document.getElementById(`step${currentStep}`).classList.add('d-none');
    currentStep = totalSteps;
    document.getElementById(`step${totalSteps}`).classList.remove('d-none');
    updateWizardButtons();

    document.getElementById('wizProgressArea').classList.remove('d-none');
    document.getElementById('wizReadyText').classList.add('d-none');
    document.getElementById('wizBtnExecute').disabled = true;
    document.getElementById('wizardAlert').classList.add('d-none');

    try {
        // 1. Internet Connection
        if (internetType === 'dhcp') {
            setWizStatus("Configuring DHCP Client on ether1...");
            await mikrotikApi('/ip/dhcp-client', 'PUT', {
                "interface": "ether1",
                "disabled": "false"
            });
        } else {
            setWizStatus("Configuring PPPoE Client on ether1...");
            await mikrotikApi('/interface/pppoe-client', 'PUT', {
                "name": "pppoe-out1",
                "interface": "ether1",
                "user": pppoeUser,
                "password": pppoePass,
                "disabled": "false",
                "add-default-route": "true",
                "use-peer-dns": "true"
            });
        }

        // 2. Create Bridge
        setWizStatus("Creating Bridge (bridge-HOTSPOT)...");
        await mikrotikApi('/interface/bridge', 'PUT', { "name": "bridge-HOTSPOT" });

        // 3. Add Ports to Bridge (ether2-ether5)
        setWizStatus("Adding ports ether2-ether5 to bridge...");
        for (let i = 2; i <= 5; i++) {
            await mikrotikApi('/interface/bridge/port', 'PUT', {
                "bridge": "bridge-HOTSPOT",
                "interface": `ether${i}`
            });
        }

        // 4. Configure WiFi (if builtin)
        if (wifiType === 'builtin') {
            setWizStatus("Configuring Built-in WiFi (wlan1)...");
            // Assuming wlan1 is standard. We use PATCH to modify the existing interface.
            let wlans = await mikrotikApi('/interface/wireless');
            let wlan1 = wlans.find(w => w.name === 'wlan1');

            if (wlan1) {
                await mikrotikApi(`/interface/wireless/${wlan1['.id']}`, 'PATCH', {
                    "disabled": "false",
                    "mode": "ap-bridge",
                    "ssid": ssid
                });
            } else {
                await mikrotikApi(`/interface/wireless/wlan1`, 'PATCH', {
                    "disabled": "false",
                    "mode": "ap-bridge",
                    "ssid": ssid
                });
            }

            // Add wlan1 to bridge
            await mikrotikApi('/interface/bridge/port', 'PUT', {
                "bridge": "bridge-HOTSPOT",
                "interface": "wlan1"
            });
        }

        // 5. Assign IP
        setWizStatus("Assigning IP Address (10.0.0.1/24)...");
        await mikrotikApi('/ip/address', 'PUT', {
            "address": "10.0.0.1/24",
            "interface": "bridge-HOTSPOT"
        });

        // 6. Setup NAT
        setWizStatus("Configuring NAT (Masquerade)...");
        let outInt = internetType === 'dhcp' ? 'ether1' : 'pppoe-out1';
        await mikrotikApi('/ip/firewall/nat', 'PUT', {
            "chain": "srcnat",
            "action": "masquerade",
            "out-interface": outInt
        });

        // 7. Hotspot Server Profile
        setWizStatus("Creating Hotspot Server Profile...");
        let profileId = "*1"; // Default profile might be *1, but let's PUT a new one
        let pRes = await mikrotikApi('/ip/hotspot/profile', 'PUT', {
            "name": "hsprof1",
            "hotspot-address": "10.0.0.1",
            "dns-name": portalUrl,
            "login-by": "mac,cookie,http-chap",
            "html-directory": "hotspot" // standard for our app
        });
        if (pRes && pRes['.id']) profileId = pRes['.id'];

        // 7.b Hotspot Server
        setWizStatus("Creating Hotspot Server...");
        await mikrotikApi('/ip/hotspot', 'PUT', {
            "name": "hotspot1",
            "interface": "bridge-HOTSPOT",
            "profile": "hsprof1",
            "disabled": "false"
        });

        // 8. Create Promo Profile
        setWizStatus(`Creating Voucher Profile (${promoName})...`);
        const onLogoutScript = `:local username $user;\r\n:local useruptime [/ip hotspot user get [find name=$username] uptime];\r\n:local userlimit [/ip hotspot user get [find name=$username] limit-uptime];\r\n:if ($useruptime >= $userlimit) do={\r\n    /ip hotspot user remove [find name=$username];\r\n}`;

        await mikrotikApi('/ip/hotspot/user/profile', 'PUT', {
            "name": promoName,
            "shared-users": "1",
            "rate-limit": speed,
            "session-timeout": duration,
            "on-logout": onLogoutScript
        });

        // Done!
        document.getElementById('wizProgressArea').classList.add('d-none');
        document.getElementById('wizSuccessArea').classList.remove('d-none');
        document.getElementById('wizBtnDone').classList.remove('d-none');

    } catch (error) {
        showWizError(error.message || "An unknown error occurred during setup.");
    }
}
