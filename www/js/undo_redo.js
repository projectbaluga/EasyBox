var historyState = [];
var historyIndex = -1;

function captureState() {
    var state = {
        voucherContainerSize: JSON.parse(JSON.stringify(voucherContainerSize)),
        voucherElementsConfig: JSON.parse(JSON.stringify(voucherElementsConfig)),
        layerOrder: JSON.parse(JSON.stringify(layerOrder)),
        voucherBorderStyle: voucherBorderStyle,
        voucherBgColor: voucherBgColor,
        voucherBorderRadius: voucherBorderRadius,
        voucherGradient: voucherGradient,
        qrCodeSize: qrCodeSize,
        customTexts: JSON.parse(JSON.stringify(customTexts || {}))
    };
    return state;
}

function pushUndo() {
    if (typeof voucherElementsConfig === 'undefined') return;

    // Remove forward history if we are overwriting
    if (historyIndex < historyState.length - 1) {
        historyState = historyState.slice(0, historyIndex + 1);
    }

    historyState.push(captureState());

    // Limit history length to 50
    if (historyState.length > 50) {
        historyState.shift();
    } else {
        historyIndex++;
    }

    updateUndoRedoButtons();
    saveHistoryState();
}

var isUndoRedoing = false;

function applyState(state) {
    isUndoRedoing = true;
    if (!state) {
        isUndoRedoing = false;
        return;
    }

    voucherContainerSize = JSON.parse(JSON.stringify(state.voucherContainerSize));
    voucherElementsConfig = JSON.parse(JSON.stringify(state.voucherElementsConfig));
    layerOrder = JSON.parse(JSON.stringify(state.layerOrder));
    voucherBorderStyle = state.voucherBorderStyle;
    voucherBgColor = state.voucherBgColor;
    voucherBorderRadius = state.voucherBorderRadius;
    voucherGradient = state.voucherGradient;
    qrCodeSize = state.qrCodeSize;
    if (state.customTexts) customTexts = JSON.parse(JSON.stringify(state.customTexts));

    // Apply changes to DOM
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        container.style.width = voucherContainerSize.width + 'px';
        container.style.height = voucherContainerSize.height + 'px';
        container.style.border = voucherBorderStyle;
        container.style.backgroundColor = voucherBgColor;
        container.style.borderRadius = voucherBorderRadius + 'px';
        container.style.backgroundImage = voucherGradient || 'none';
    }

    var canvasW = document.getElementById('canvasW');
    var canvasH = document.getElementById('canvasH');
    if (canvasW) canvasW.value = voucherContainerSize.width;
    if (canvasH) canvasH.value = voucherContainerSize.height;

    var borderSelect = document.getElementById('voucherBorder');
    if (borderSelect) borderSelect.value = voucherBorderStyle;

    var bgColorInput = document.getElementById('voucherBgColor');
    var bgColorLabel = document.getElementById('voucherBgColorLabel');
    if (bgColorInput) bgColorInput.value = voucherBgColor;
    if (bgColorLabel) bgColorLabel.textContent = voucherBgColor;

    var radiusInput = document.getElementById('voucherBorderRadius');
    var radiusVal = document.getElementById('borderRadiusVal');
    if (radiusInput) radiusInput.value = voucherBorderRadius;
    if (radiusVal) radiusVal.textContent = voucherBorderRadius + 'px';

    var gradSelect = document.getElementById('voucherGradient');
    if (gradSelect) gradSelect.value = voucherGradient;

    var qrImg = document.querySelector('#dragQR img');
    if (qrImg) {
        qrImg.width = qrCodeSize;
        qrImg.height = qrCodeSize;
    }
    var qrSizeRange = document.getElementById('qrCodeSize');
    var qrSizeVal = document.getElementById('qrSizeVal');
    if (qrSizeRange) qrSizeRange.value = qrCodeSize;
    if (qrSizeVal) qrSizeVal.textContent = qrCodeSize + 'px';


    // Synchronize Custom Text DOM elements
    var container = document.getElementById('dragVoucherContainer');
    if (container) {
        // 1. Remove elements from DOM that are no longer in config
        var currentCustomDivs = container.querySelectorAll('.drag-el[id^="dragCustom"]');
        currentCustomDivs.forEach(function(div) {
            var key = div.getAttribute('data-key');
            if (!voucherElementsConfig[key]) {
                div.remove();
            }
        });

        // 2. Create elements that are in config but not in DOM
        for (var key in voucherElementsConfig) {
            if (key.startsWith('custom') && !document.getElementById(voucherElementsConfig[key].id)) {
                var div = document.createElement('div');
                div.id = voucherElementsConfig[key].id;
                div.className = 'drag-el';
                div.setAttribute('data-key', key);
                div.style.cssText = 'position: absolute; cursor: move; white-space: nowrap;';
                div.textContent = customTexts[key] || 'Text';
                container.appendChild(div);

                // Needs draggable init if function exists
                if (typeof initSingleDraggable === 'function') {
                    initSingleDraggable(div);
                }
            }
        }
    }


        // 3. Update textContent for existing custom text elements
        for (var key in voucherElementsConfig) {
            if (key.startsWith('custom')) {
                var div = document.getElementById(voucherElementsConfig[key].id);
                if (div) {
                    div.textContent = customTexts[key] || 'Text';
                }
            }
        }

    // Re-render elements
    applyAllElementStyles();
    saveElementsConfig();
    renderLayers();
    updatePropertiesPanel();
    updateCustomTextsList();
    isUndoRedoing = false;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        applyState(historyState[historyIndex]);
        updateUndoRedoButtons();
        saveHistoryState();
    }
}

function redo() {
    if (historyIndex < historyState.length - 1) {
        historyIndex++;
        applyState(historyState[historyIndex]);
        updateUndoRedoButtons();
        saveHistoryState();
    }
}

function updateUndoRedoButtons() {
    var undoBtn = document.getElementById('undoBtn');
    var redoBtn = document.getElementById('redoBtn');

    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= historyState.length - 1;
}

function saveHistoryState() {
    try {
        localStorage.setItem('qv_editor_history', JSON.stringify(historyState));
        localStorage.setItem('qv_editor_history_index', historyIndex);
    } catch (e) {
        console.error("Failed to save history state to localStorage", e);
    }
}

function loadHistoryState() {
    try {
        var savedHistory = localStorage.getItem('qv_editor_history');
        var savedIndex = localStorage.getItem('qv_editor_history_index');

        if (savedHistory && savedIndex) {
            historyState = JSON.parse(savedHistory);
            historyIndex = parseInt(savedIndex);

            // Re-apply if we are not starting from scratch
            if (historyState.length > 0 && historyIndex >= 0 && historyIndex < historyState.length) {
                // Ensure elements are initialized before applying
                setTimeout(function() {
                    applyState(historyState[historyIndex]);
                    updateUndoRedoButtons();
                }, 100);
            }
        }
    } catch (e) {
        console.error("Failed to load history state from localStorage", e);
    }
}

// Hook into initial state
$(document).ready(function() {
    // Initial push after draggables loaded
    setTimeout(function() {
        if (historyState.length === 0) {
            pushUndo();
        } else {
            loadHistoryState();
        }
    }, 500);
});
