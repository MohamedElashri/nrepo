document.addEventListener('DOMContentLoaded', function() {
    const containers = document.querySelectorAll('.model-settings-container');
    containers.forEach(container => {
        fetch('partials/model-settings.html')
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                loadModels();
                initializeIgnorePatterns();
                document.dispatchEvent(new CustomEvent('modelSettingsLoaded'));
            })
            .catch(error => {
                console.error('Error loading model settings:', error);
                container.innerHTML = '<p class="text-red-500">Failed to load model settings</p>';
            });
    });
});

function loadModels() {
    const script = document.createElement('script');
    script.src = 'js/models.js';
    script.onload = () => {
        const modelSelect = document.getElementById('model-select');
        if (modelSelect && typeof models !== 'undefined') {
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                if (model.tokens >= 1000000) {
                    option.textContent = `${model.name} (${(model.tokens / 1000000)}M tokens)`;
                } else {
                    option.textContent = `${model.name} (${(model.tokens / 1000)}K tokens)`;
                }
                option.dataset.tokens = model.tokens;
                option.dataset.chars = model.chars;
                modelSelect.appendChild(option);
            });

            const defaultModel = 'claude-3-sonnet-20240229';
            const defaultOption = modelSelect.querySelector(`option[value="${defaultModel}"]`);
            if (defaultOption) {
                defaultOption.selected = true;
            }
        }
    };
    document.head.appendChild(script);
}

function initializeIgnorePatterns() {
    const commonIgnorePatterns = 
`.git/
.github/
.vscode/
node_modules/
__pycache__/
*.log
*.tmp
*.swp
.DS_Store
.idea/
dist/
build/
LICENSE
LICENSE.md
*.min.js
*.min.css`;

    const ignorePatterns = document.getElementById('ignore-patterns');
    if (ignorePatterns && !ignorePatterns.value) {
        ignorePatterns.value = commonIgnorePatterns;
    }
}

function checkTokenWarning() {
    if (!window.processedText) return;

    const tokenWarning = document.getElementById('token-warning');
    const tokenWarningStats = document.getElementById('token-warning-stats');

    if (!tokenWarning || !tokenWarningStats) return;

    if (typeof window.getModelLimits !== 'function' || typeof window.formatNumber !== 'function') {
        console.error('Required functions not available for token warning');
        return;
    }

    const { tokenLimit } = window.getModelLimits();
    const chars = window.processedText.length;
    const tokens = Math.ceil(chars / 3.5);

    if (tokens > tokenLimit) {
        tokenWarningStats.textContent = `Estimated: ${window.formatNumber(tokens)} tokens / Model limit: ${window.formatNumber(tokenLimit)} tokens`;
        tokenWarning.classList.remove('hidden');
    } else {
        tokenWarning.classList.add('hidden');
    }
}

function applyFiltersAndUpdateStats() {
    if (!window.originalFiles || !Array.isArray(window.originalFiles)) {
        console.error('Original files data not available');
        return;
    }

    const loader = document.querySelector('.loader');
    if (loader) loader.classList.remove('hidden');

    setTimeout(() => {
        if (typeof window.processFilesWithSettings === 'function') {
            window.processFilesWithSettings(window.originalFiles);
        } else {
            console.error('processFilesWithSettings function not available');
            if (loader) loader.classList.add('hidden');
        }
    }, 50);
}
