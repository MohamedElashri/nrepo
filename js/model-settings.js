// Load the model settings component
document.addEventListener('DOMContentLoaded', function() {
    // Find all model-settings-container elements
    const containers = document.querySelectorAll('.model-settings-container');
    
    // For each container, load the model settings
    containers.forEach(container => {
        fetch('./partials/model-settings.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load model settings');
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                
                // Initialize model settings based on page-specific IDs
                const pageType = document.body.dataset.pageType;
                
                if (pageType === 'index') {
                    // In index.html, use kebab-case IDs
                    adjustElementIds({
                        'model-select': 'model-select',
                        'strip-comments': 'strip-comments',
                        'respect-gitignore': 'respect-gitignore',
                        'ignore-patterns': 'ignore-patterns',
                        'apply-ignore-patterns': 'apply-ignore-patterns',
                        // Handle exclude-patterns ID needed by script.js
                        'ignore-patterns': 'exclude-patterns'
                    });

                    // Also handle the use-gitignore ID for the index page
                    const respectGitignore = document.getElementById('respect-gitignore');
                    if (respectGitignore) {
                        const useGitignoreElement = document.createElement('input');
                        useGitignoreElement.type = 'checkbox';
                        useGitignoreElement.id = 'use-gitignore';
                        useGitignoreElement.style.display = 'none';
                        document.body.appendChild(useGitignoreElement);
                        
                        // Sync the checkboxes
                        respectGitignore.addEventListener('change', function() {
                            useGitignoreElement.checked = this.checked;
                            // Don't create a new event, directly trigger the original event handler
                            if (useGitignoreElement.onchange) {
                                useGitignoreElement.onchange();
                            }
                            
                            // If processing is already done, apply the gitignore filter dynamically
                            if (window.processedText && window.originalFiles) {
                                applyFiltersAndUpdateStats();
                            }
                        });
                    }

                    // Add event listener for model selection change
                    const modelSelect = document.getElementById('model-select');
                    if (modelSelect) {
                        modelSelect.addEventListener('change', function() {
                            // Update the stats if they exist (processing has occurred)
                            if (window.processedText && typeof updateStats === 'function') {
                                updateStats();
                                
                                // Check if token warning should be displayed
                                checkTokenWarning();
                            }
                        });
                    }
                    
                    // Add event listener for strip comments checkbox
                    const stripComments = document.getElementById('strip-comments');
                    if (stripComments) {
                        stripComments.addEventListener('change', function() {
                            // If processing is already done, apply the comment stripper dynamically
                            if (window.processedText && window.originalFiles) {
                                applyFiltersAndUpdateStats();
                            }
                        });
                    }
                    
                    // Add event listener for apply ignore patterns button
                    const applyIgnorePatternsBtn = document.getElementById('apply-ignore-patterns');
                    if (applyIgnorePatternsBtn) {
                        console.log('Found apply-ignore-patterns button', applyIgnorePatternsBtn);
                        applyIgnorePatternsBtn.addEventListener('click', function() {
                            console.log('Apply ignore patterns button clicked');
                            // If processing is already done, apply the new ignore patterns
                            if (window.processedText && window.originalFiles) {
                                console.log('Applying new ignore patterns to', window.originalFiles.length, 'files');
                                applyFiltersAndUpdateStats();
                            } else {
                                console.log('Cannot apply patterns - no processed text or original files available');
                            }
                        });
                    } else {
                        console.error('Could not find apply-ignore-patterns button');
                    }
                } else if (pageType === 'github' || pageType === 'gitlab') {
                    // In repo.html and gitlab.html, use camelCase IDs
                    adjustElementIds({
                        'model-select': 'modelSelect',
                        'strip-comments': 'stripComments',
                        'respect-gitignore': 'respectGitignore',
                        'ignore-patterns': 'ignorePatterns',
                        'apply-ignore-patterns': 'applyIgnorePatterns'
                    });

                    // Add event listener for model selection change
                    const modelSelect = document.getElementById('modelSelect');
                    if (modelSelect) {
                        modelSelect.addEventListener('change', function() {
                            // Update the stats if they exist (processing has occurred)
                            if (window.processedText && typeof updateStats === 'function') {
                                updateStats();
                                
                                // Check if token warning should be displayed
                                checkTokenWarning();
                            }
                        });
                    }
                    
                    // Add event listener for strip comments checkbox
                    const stripComments = document.getElementById('stripComments');
                    if (stripComments) {
                        stripComments.addEventListener('change', function() {
                            // If processing is already done, apply the comment stripper dynamically
                            if (window.processedText && window.originalFiles) {
                                applyFiltersAndUpdateStats();
                            }
                        });
                    }
                    
                    // Add event listener for respect gitignore checkbox
                    const respectGitignore = document.getElementById('respectGitignore');
                    if (respectGitignore) {
                        respectGitignore.addEventListener('change', function() {
                            // If processing is already done, apply the gitignore filter dynamically
                            if (window.processedText && window.originalFiles) {
                                applyFiltersAndUpdateStats();
                            }
                        });
                    }
                    
                    // Add event listener for apply ignore patterns button
                    const applyIgnorePatternsBtn = document.getElementById('applyIgnorePatterns');
                    if (applyIgnorePatternsBtn) {
                        console.log('Found applyIgnorePatterns button', applyIgnorePatternsBtn);
                        applyIgnorePatternsBtn.addEventListener('click', function() {
                            console.log('Apply ignore patterns button clicked (github/gitlab)');
                            // If processing is already done, apply the new ignore patterns
                            if (window.processedText && window.originalFiles) {
                                console.log('Applying new ignore patterns to', window.originalFiles.length, 'files');
                                applyFiltersAndUpdateStats();
                            } else {
                                console.log('Cannot apply patterns - no processed text or original files available');
                            }
                        });
                    } else {
                        console.error('Could not find applyIgnorePatterns button');
                    }
                }

                // Initialize the ignore patterns with common defaults
                initializeIgnorePatterns();

                // Fire an event to indicate model settings are loaded
                document.dispatchEvent(new CustomEvent('modelSettingsLoaded'));
            })
            .catch(error => {
                console.error('Error loading model settings:', error);
                container.innerHTML = '<p class="text-red-500">Failed to load model settings</p>';
            });
    });
    
    // Helper function to adjust element IDs and sync values
    function adjustElementIds(idMap) {
        for (const [sourceId, targetId] of Object.entries(idMap)) {
            const sourceElement = document.getElementById(sourceId);
            
            if (!sourceElement) continue;

            // Skip if already processed or same ID
            if (sourceElement.dataset.processed === 'true' || sourceId === targetId) {
                continue;
            }
            
            // Mark as processed to avoid recursion
            sourceElement.dataset.processed = 'true';
            
            // Store original element's properties
            const tagName = sourceElement.tagName;
            const type = sourceElement.type;
            const isChecked = sourceElement.checked;
            const value = sourceElement.value;
            
            // Change the ID
            sourceElement.id = targetId;
            
            // Set back the original value/state
            if (type === 'checkbox') {
                sourceElement.checked = isChecked;
            } else if (tagName === 'SELECT' || tagName === 'TEXTAREA') {
                sourceElement.value = value;
            }
        }
    }
});

// Initialize ignore patterns with common defaults
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
*.min.js
*.min.css`;

    // Find the ignore patterns textarea (could be either ID based on page type)
    const ignorePatterns = document.getElementById('ignore-patterns') || document.getElementById('ignorePatterns');
    
    if (ignorePatterns && !ignorePatterns.value) {
        ignorePatterns.value = commonIgnorePatterns;
    }
}

// Helper function to check if token warning should be displayed
function checkTokenWarning() {
    if (!window.processedText) return;
    
    const tokenWarning = document.getElementById('token-warning');
    const tokenWarningStats = document.getElementById('token-warning-stats');
    
    if (!tokenWarning || !tokenWarningStats) return;
    
    // Access the functions through the window object
    if (typeof window.getModelLimits !== 'function' || typeof window.formatNumber !== 'function') {
        console.error('Required functions not available for token warning');
        return;
    }
    
    const { tokenLimit, charLimit } = window.getModelLimits();
    const chars = window.processedText.length;
    const tokens = Math.ceil(chars / 3.5);
    
    if (tokens > tokenLimit) {
        // Update the warning stats
        tokenWarningStats.textContent = `Estimated: ${window.formatNumber(tokens)} tokens / Model limit: ${window.formatNumber(tokenLimit)} tokens`;
        tokenWarning.classList.remove('hidden');
    } else {
        // Hide the warning if token count is now below the limit
        tokenWarning.classList.add('hidden');
    }
}

// Function to reapply filters based on current settings and update stats
function applyFiltersAndUpdateStats() {
    if (!window.originalFiles || !Array.isArray(window.originalFiles)) {
        console.error('Original files data not available');
        return;
    }
    
    // Show loader during reprocessing
    const loader = document.querySelector('.loader');
    if (loader) loader.classList.remove('hidden');
    
    // Use setTimeout to allow the UI to update before starting processing
    setTimeout(() => {
        console.log('Reapplying filters to processed files');
        
        // Use the same logic as in processFiles but without reading files again
        if (typeof window.processFilesWithSettings === 'function') {
            window.processFilesWithSettings(window.originalFiles);
        } else {
            console.error('processFilesWithSettings function not available');
            
            // Hide loader if processing failed
            if (loader) loader.classList.add('hidden');
        }
    }, 50);
}
