// Utility Functions
const isTextFile = (filename) => {
    const textExtensions = ['.txt', '.js', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.html', '.css', '.json', '.xml', '.md', '.sh', '.bat', '.ps1', '.yaml', '.yml', '.ini', '.cfg', '.conf', '.log'];
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return textExtensions.includes(ext);
};

const stripComments = (content, extension) => {
    // Basic comment stripping for common languages
    switch(extension) {
        case '.js':
        case '.java':
        case '.c':
        case '.cpp':
            content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            break;
        case '.py':
            content = content.replace(/'''[\s\S]*?'''|#.*/g, '');
            break;
        case '.html':
            content = content.replace(/<!--[\s\S]*?-->/g, '');
            break;
    }
    return content;
};

const updateProgress = (current, total) => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const currentFile = document.getElementById('current-file');
    const filesCounter = document.getElementById('files-counter');
    
    const percentage = Math.round((current / total) * 100);
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.classList.add('transition-all', 'duration-300');
    }
    
    if (progressText) {
        progressText.textContent = `Processing: ${current.toLocaleString()} of ${total.toLocaleString()} files (${percentage}%)`;
    }
    
    if (filesCounter) {
        filesCounter.textContent = current.toLocaleString();
    }
};

const toggleStatus = (show, message = '') => {
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    
    if (statusContainer) {
        if (show) {
            statusContainer.classList.remove('hidden');
            if (statusMessage && message) {
                statusMessage.textContent = message;
                statusMessage.classList.add('opacity-0');
                setTimeout(() => {
                    statusMessage.classList.remove('opacity-0');
                    statusMessage.classList.add('opacity-100');
                }, 10);
            }
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        } else {
            if (statusMessage) {
                statusMessage.classList.add('opacity-0');
            }
            setTimeout(() => {
                statusContainer.classList.add('hidden');
            }, 300);
        }
    }
};

const shouldIgnoreFile = (filePath) => {
    const excludePatternsTextarea = document.getElementById('exclude-patterns');
    const useGitignore = document.getElementById('use-gitignore')?.checked;
    
    if (!filePath) return false;
    
    // Check custom exclude patterns
    if (excludePatternsTextarea) {
        const patterns = excludePatternsTextarea.value
            .split('\n')
            .map(p => p.trim())
            .filter(p => p && !p.startsWith('#'));
            
        for (const pattern of patterns) {
            if (filePath.includes(pattern)) {
                return true;
            }
        }
    }
    
    // Check gitignore patterns
    if (useGitignore && window.gitignorePatterns) {
        for (const pattern of window.gitignorePatterns) {
            if (filePath.includes(pattern)) {
                return true;
            }
        }
    }
    
    return false;
};

const processFile = async (file, filePath) => {
    if (window.isProcessingCancelled) return;

    const shouldIncludeBinary = document.getElementById('include-binary')?.checked;
    if (shouldIgnoreFile(filePath)) {
        console.log('Ignoring file:', filePath);
        return;
    }

    try {
        if (isTextFile(file.name)) {
            const content = await file.text();
            const shouldStripComments = document.getElementById('strip-comments')?.checked;
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            let processedContent = shouldStripComments ? stripComments(content, ext) : content;
            
            if (processedContent.trim()) {
                const formatPattern = document.getElementById('format-pattern')?.value || 
                    '// File: {path}{filename}{newline}{content}{newline}{newline}';
                
                const formattedContent = formatPattern
                    .replace('{path}', filePath.substring(0, filePath.lastIndexOf('/') + 1))
                    .replace('{filename}', filePath.substring(filePath.lastIndexOf('/') + 1))
                    .replace('{content}', processedContent)
                    .replace(/{newline}/g, '\n');

                window.processedText += formattedContent;
                console.log('Added content for file:', filePath, 'Current length:', window.processedText.length);
            }
        } else if (shouldIncludeBinary) {
            window.processedText += `Binary File: ${filePath}\n\n`;
        } else {
            console.log('Skipping binary file:', filePath);
        }
    } catch (error) {
        console.error('Error processing file:', filePath, error);
    }
};

const processFiles = async (files) => {
    console.log('Processing files:', files.length);
    window.isProcessingCancelled = false;
    window.processedText = '';
    window.processedFilesCount = 0;
    window.totalFilesToProcess = files.length;

    const loader = document.querySelector('.loader');
    const resultContainer = document.querySelector('.result-container');
    const currentFile = document.getElementById('current-file');

    toggleStatus(true, 'Beginning File Processing...');
    if (loader) loader.classList.remove('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');

    try {
        for (const file of files) {
            if (window.isProcessingCancelled) break;
            
            const filePath = file.webkitRelativePath || file.name;
            if (currentFile) {
                currentFile.textContent = `Processing: ${filePath}`;
            }
            
            await processFile(file, filePath);
            window.processedFilesCount++;
            updateProgress(window.processedFilesCount, window.totalFilesToProcess);
        }

        if (!window.isProcessingCancelled) {
            toggleStatus(true, 'Processing Complete!');
            displayResult();
            updateStats();
        } else {
            toggleStatus(true, 'Processing Cancelled');
        }
    } catch (error) {
        console.error('Error processing files:', error);
        toggleStatus(true, 'Error processing files');
    } finally {
        if (loader) loader.classList.add('hidden');
        if (resultContainer) resultContainer.classList.remove('hidden');
        setTimeout(() => toggleStatus(false), 3000);
    }
};

const displayResult = () => {
    const resultTextarea = document.getElementById('result');
    if (resultTextarea && window.processedText) {
        console.log('Displaying result, text length:', window.processedText.length);
        resultTextarea.value = window.processedText;
    }
};

const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
};

const getModelLimits = () => {
    const modelSelect = document.getElementById('model-select');
    const tokenLimit = parseInt(modelSelect?.value || '128000');
    const charLimit = tokenLimit * 3.5; // Using 3.5 characters per token as an average
    return { tokenLimit, charLimit };
};

const updateStats = () => {
    console.log('Updating stats');
    const charCountElement = document.getElementById('char-count');
    const wordCountElement = document.getElementById('word-count');
    const tokenCountElement = document.getElementById('token-count');
    const filesCounterElement = document.getElementById('files-counter');

    if (!window.processedText) {
        console.log('No processed text available');
        return;
    }

    const { tokenLimit, charLimit } = getModelLimits();
    const text = window.processedText;
    const chars = text.length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const tokens = Math.ceil(chars / 3.5); // Using 3.5 characters per token as an average

    console.log('Stats:', { chars, words, tokens, files: window.processedFilesCount, tokenLimit, charLimit });

    if (charCountElement) charCountElement.textContent = `${chars.toLocaleString()} / ${charLimit.toLocaleString()}`;
    if (wordCountElement) wordCountElement.textContent = words.toLocaleString();
    if (tokenCountElement) tokenCountElement.textContent = `${formatNumber(tokens)} / ${formatNumber(tokenLimit)}`;
    if (filesCounterElement) filesCounterElement.textContent = window.processedFilesCount.toLocaleString();

    // Show warning if limits are exceeded
    const sizeWarning = document.getElementById('size-warning');
    const warningTitle = document.getElementById('warning-title');
    const warningMessage = document.getElementById('warning-message');

    if (sizeWarning && warningTitle && warningMessage) {
        if (tokens > tokenLimit) {
            sizeWarning.classList.remove('hidden');
            warningTitle.textContent = 'Token Limit Exceeded';
            warningMessage.textContent = `The processed text exceeds the selected model's token limit by ${formatNumber(tokens - tokenLimit)} tokens.`;
        } else {
            sizeWarning.classList.add('hidden');
        }
    }
};

// Default exclude patterns
const defaultExcludePatterns = `node_modules/
.git/
.svn/
.hg/
.idea/
.vscode/
.vs/
__pycache__/
*.pyc
*.pyo
*.pyd
*.so
*.dll
*.dylib
*.class
*.exe
*.obj
*.o
*.a
*.lib
*.egg
*.egg-info/
dist/
build/
coverage/
.coverage
.env
.env.*
*.log
*.lock
package-lock.json
yarn.lock
*.min.js
*.min.css
*.map
vendor/
.DS_Store
Thumbs.db
*.tmp
*.temp
*.swp
*.swo
*.bak
*.cache
*.sqlite
*.sqlite3
*.db`;

// Theme Toggle Functionality
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
    document.documentElement.classList.add('dark');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
    document.documentElement.classList.remove('dark');
}

const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', function() {
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');
    
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
});

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing file handlers');

    // Initialize global state
    window.processedText = '';
    window.processedFilesCount = 0;
    window.totalFilesToProcess = 0;
    window.isProcessingCancelled = false;
    window.gitignorePatterns = [];

    // Get DOM elements for file handling
    const fileInput = document.getElementById('fileInput');
    const dirInput = document.getElementById('dirInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const selectDirBtn = document.getElementById('selectDirBtn');
    const dropZone = document.querySelector('.drop-zone');
    const copyBtn = document.getElementById('copy-btn');
    const modelSelect = document.getElementById('model-select');
    const gitignoreCheckbox = document.getElementById('use-gitignore');
    const gitignoreUpload = document.getElementById('gitignore-upload');
    const gitignoreInput = document.getElementById('gitignore-input');
    const gitignoreDropZone = document.querySelector('.gitignore-drop-zone');
    const clearGitignoreBtn = document.getElementById('clear-gitignore');
    const gitignoreStatus = document.getElementById('gitignore-status');

    // Verify elements are found
    console.log('File input found:', !!fileInput);
    console.log('Dir input found:', !!dirInput);
    console.log('Select files button found:', !!selectFilesBtn);
    console.log('Select dir button found:', !!selectDirBtn);
    console.log('Copy button found:', !!copyBtn);

    // File Selection Event Handlers
    if (selectFilesBtn) {
        selectFilesBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clicking file input');
            fileInput?.click();
        };
    }

    if (selectDirBtn) {
        selectDirBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clicking directory input');
            dirInput?.click();
        };
    }

    if (fileInput) {
        fileInput.onchange = function(e) {
            console.log('Files selected:', e.target.files.length);
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                processFiles(files);
            }
            this.value = '';
        };
    }

    if (dirInput) {
        dirInput.onchange = function(e) {
            console.log('Directory selected:', e.target.files.length);
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                processFiles(files);
            }
            this.value = '';
        };
    }

    // Drag and drop handling
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const items = Array.from(e.dataTransfer.files);
        processFiles(items);
    });

    // Copy button functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const resultTextarea = document.getElementById('result');
            if (resultTextarea) {
                navigator.clipboard.writeText(resultTextarea.value);
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        });
    }

    // Add model selection change handler
    if (modelSelect) {
        modelSelect.addEventListener('change', updateStats);
    }

    // Initialize gitignore functionality
    if (gitignoreCheckbox && gitignoreUpload) {
        gitignoreCheckbox.addEventListener('change', function() {
            if (this.checked) {
                gitignoreUpload.classList.remove('hidden');
            } else {
                gitignoreUpload.classList.add('hidden');
                if (clearGitignoreBtn) {
                    clearGitignoreBtn.click(); // Clear any existing gitignore
                }
            }
        });
    }

    // Gitignore file handling
    if (gitignoreDropZone) {
        gitignoreDropZone.addEventListener('click', () => {
            gitignoreInput?.click();
        });

        gitignoreDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            gitignoreDropZone.classList.add('border-gray-400', 'dark:border-gray-500');
        });

        gitignoreDropZone.addEventListener('dragleave', () => {
            gitignoreDropZone.classList.remove('border-gray-400', 'dark:border-gray-500');
        });

        gitignoreDropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            gitignoreDropZone.classList.remove('border-gray-400', 'dark:border-gray-500');
            const file = e.dataTransfer.files[0];
            if (file) {
                await handleGitignoreFile(file);
            }
        });
    }

    if (gitignoreInput) {
        gitignoreInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleGitignoreFile(file);
            }
            gitignoreInput.value = ''; // Reset input
        });
    }

    if (clearGitignoreBtn) {
        clearGitignoreBtn.addEventListener('click', () => {
            window.gitignorePatterns = [];
            clearGitignoreBtn.classList.add('hidden');
            
            // Reset exclude patterns textarea to default patterns
            const excludePatternsTextarea = document.getElementById('exclude-patterns');
            if (excludePatternsTextarea) {
                excludePatternsTextarea.value = defaultExcludePatterns;
            }
            
            if (gitignoreStatus) {
                gitignoreStatus.textContent = '';
            }
        });
    }

    // Handle gitignore file upload
    async function handleGitignoreFile(file) {
        try {
            const content = await file.text();
            const patterns = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            
            window.gitignorePatterns = patterns;
            
            // Update exclude patterns textarea
            const excludePatternsTextarea = document.getElementById('exclude-patterns');
            if (excludePatternsTextarea) {
                // Get existing patterns
                const existingPatterns = excludePatternsTextarea.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean);
                
                // Combine existing and new patterns, remove duplicates
                const combinedPatterns = [...new Set([...existingPatterns, ...patterns])];
                
                // Update textarea
                excludePatternsTextarea.value = combinedPatterns.join('\n');
            }
            
            if (clearGitignoreBtn) {
                clearGitignoreBtn.classList.remove('hidden');
            }
            if (gitignoreStatus) {
                gitignoreStatus.textContent = `Loaded ${patterns.length} patterns from .gitignore`;
            }
        } catch (error) {
            console.error('Error reading .gitignore file:', error);
            if (gitignoreStatus) {
                gitignoreStatus.textContent = 'Error reading .gitignore file';
            }
        }
    }
});