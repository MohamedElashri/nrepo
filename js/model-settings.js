// Load the model settings component
document.addEventListener('DOMContentLoaded', function() {
    // Find all model-settings-container elements
    const containers = document.querySelectorAll('.model-settings-container');
    
    // For each container, load the model settings
    containers.forEach(container => {
        fetch('/partials/model-settings.html')
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
                        });
                    }
                } else if (pageType === 'github' || pageType === 'gitlab') {
                    // In repo.html and gitlab.html, use camelCase IDs
                    adjustElementIds({
                        'model-select': 'modelSelect',
                        'strip-comments': 'stripComments',
                        'respect-gitignore': 'respectGitignore',
                        'ignore-patterns': 'ignorePatterns'
                    });
                }

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
