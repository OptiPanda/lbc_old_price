const extApi = (typeof browser !== 'undefined') ? browser : chrome;

const DEFAULTS = {
    enableDebug: true,
    showOldPrice: true,
    showDates: true,
    showMileage: true,
    showBadge: true,
    showHistory: true,
    showCopyButton: true,
    badgeThreshold: 5,
};

const TOGGLES = ['enableDebug', 'showOldPrice', 'showDates', 'showMileage', 'showBadge', 'showHistory', 'showCopyButton'];

const thresholdInput = document.getElementById('badgeThreshold');
const thresholdVal = document.getElementById('thresholdVal');
const thresholdRow = document.getElementById('badgeThresholdRow');

// Charger les options sauvegardées et initialiser l'UI
extApi.storage.sync.get(DEFAULTS, (items) => {
    const opts = {...DEFAULTS, ...items};

    for (const id of TOGGLES) {
        const element = document.getElementById(id);
        if (element) {
            element.checked = opts[id];
        }
    }

    thresholdInput.value = opts.badgeThreshold;
    thresholdVal.textContent = opts.badgeThreshold + '%';
    updateThresholdVisibility(opts.showBadge);
});

// Toggle le bouton pour afficher ou non les logs de debug
document.getElementById("header").addEventListener("click", (e) => {
    if (e.altKey) {
        const element = document.getElementById("showDebugOption");
        element.classList.toggle("hidden");
    }
})

// Écouter les changements de toggles
for (const id of TOGGLES) {
    const element = document.getElementById(id);
    if (!element) {
        continue;
    }
    element.addEventListener('change', () => {
        if (id === 'showBadge') {
            updateThresholdVisibility(element.checked);
        }
        save();
    });
}

// Écouter le slider de seuil
thresholdInput.addEventListener('input', () => {
    thresholdVal.textContent = thresholdInput.value + '%';
    save();
});

function updateThresholdVisibility(show) {
    thresholdRow.classList.toggle('visible', show);
}

function save() {
    const data = {};
    for (const id of TOGGLES) {
        const element = document.getElementById(id);
        if (element) {
            data[id] = element.checked;
        }
    }
    data.badgeThreshold = parseInt(thresholdInput.value, 10);
    extApi.storage.sync.set(data);
}
