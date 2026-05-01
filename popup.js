const extApi = (typeof browser !== 'undefined') ? browser : chrome;

const DEFAULTS = {
    showOldPrice: true,
    showDates: true,
    showMileage: true,
    showBadge: true,
    showHistory: true,
    showCopyButton: true,
    badgeThreshold: 5,
};

const TOGGLES = ['showOldPrice', 'showDates', 'showMileage', 'showBadge', 'showHistory', 'showCopyButton'];

const thresholdInput = document.getElementById('badgeThreshold');
const thresholdVal = document.getElementById('thresholdVal');
const thresholdRow = document.getElementById('badgeThresholdRow');

// Charger les options sauvegardées et initialiser l'UI
extApi.storage.sync.get(DEFAULTS, (items) => {
    const opts = { ...DEFAULTS, ...items };

    for (const id of TOGGLES) {
        const el = document.getElementById(id);
        if (el) el.checked = opts[id];
    }

    thresholdInput.value = opts.badgeThreshold;
    thresholdVal.textContent = opts.badgeThreshold + '%';
    updateThresholdVisibility(opts.showBadge);
});

// Écouter les changements de toggles
for (const id of TOGGLES) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', () => {
        if (id === 'showBadge') updateThresholdVisibility(el.checked);
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
        const el = document.getElementById(id);
        if (el) data[id] = el.checked;
    }
    data.badgeThreshold = parseInt(thresholdInput.value, 10);
    extApi.storage.sync.set(data);
}
