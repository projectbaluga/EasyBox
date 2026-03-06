// Basic i18n implementation
const translations = {
    en: {
        "nav_generator": "Generator",
        "nav_dashboard": "Dashboard",
        "nav_hotspot": "Hotspot",
        "nav_pppoe": "PPPoE",
        "basic_settings": "Basic Settings",
        "tag_name": "Tag Name",
        "prefix": "Prefix",
        "length": "Length",
        "characters": "Characters",
        "auth_type": "Auth Type",
        "price": "Price",
        "quantity": "Quantity",
        "time_data": "Time & Data",
        "duration": "Duration",
        "validity": "Validity",
        "data_package": "Data Package",
        "download_speed": "Download Speed",
        "upload_speed": "Upload Speed",
        "generate_vouchers": "Generate Vouchers",
        "copy_script": "Copy Script",
        "download_rsc": "Download .rsc",
        "print": "Print",
        "clear_all": "Clear All",
        "customize": "Customize"
    },
    es: {
        "nav_generator": "Generador",
        "nav_dashboard": "Tablero",
        "nav_hotspot": "Punto de acceso",
        "nav_pppoe": "PPPoE",
        "basic_settings": "Configuraciones básicas",
        "tag_name": "Nombre de etiqueta",
        "prefix": "Prefijo",
        "length": "Longitud",
        "characters": "Caracteres",
        "auth_type": "Tipo de autenticación",
        "price": "Precio",
        "quantity": "Cantidad",
        "time_data": "Tiempo y Datos",
        "duration": "Duración",
        "validity": "Validez",
        "data_package": "Paquete de datos",
        "download_speed": "Velocidad de descarga",
        "upload_speed": "Velocidad de subida",
        "generate_vouchers": "Generar Vales",
        "copy_script": "Copiar script",
        "download_rsc": "Descargar .rsc",
        "print": "Imprimir",
        "clear_all": "Borrar todo",
        "customize": "Personalizar"
    },
    tl: {
        "nav_generator": "Gawaan",
        "nav_dashboard": "Dashboard",
        "nav_hotspot": "Hotspot",
        "nav_pppoe": "PPPoE",
        "basic_settings": "Pangunahing Settings",
        "tag_name": "Pangalan ng Tag",
        "prefix": "Unlapi (Prefix)",
        "length": "Haba",
        "characters": "Karakter",
        "auth_type": "Uri ng Auth",
        "price": "Presyo",
        "quantity": "Dami",
        "time_data": "Oras at Data",
        "duration": "Tagal",
        "validity": "Bisa",
        "data_package": "Pakete ng Data",
        "download_speed": "Bilis ng Download",
        "upload_speed": "Bilis ng Upload",
        "generate_vouchers": "Gumawa ng Voucher",
        "copy_script": "Kopyahin ang Script",
        "download_rsc": "I-download ang .rsc",
        "print": "I-print",
        "clear_all": "Burahin Lahat",
        "customize": "I-customize"
    }
};

let currentLanguage = localStorage.getItem('eb_language') || 'en';

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('eb_language', lang);
    applyTranslations();
}

function t(key) {
    if (!translations[currentLanguage]) return key;
    return translations[currentLanguage][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = t(key);
        } else if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
            el.placeholder = t(key);
        } else {
            // Check if element contains icon SVGs we should keep
            if (el.querySelector('svg')) {
                // Keep SVG, replace text node
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === 3 && node.nodeValue.trim() !== '') {
                        node.nodeValue = ' ' + t(key);
                    }
                });
            } else {
                el.textContent = t(key);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});
