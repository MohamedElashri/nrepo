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

document.addEventListener('DOMContentLoaded', () => {
    // Gitignore handling
    let gitignorePatterns = [];
    const useGitignoreCheckbox = document.getElementById('use-gitignore');
    const gitignoreUpload = document.getElementById('gitignore-upload');
    const gitignoreDropZone = document.querySelector('.gitignore-drop-zone');
    const gitignoreInput = document.getElementById('gitignore-input');
    const gitignoreStatus = document.getElementById('gitignore-status');
    const clearGitignoreBtn = document.getElementById('clear-gitignore');

    // Main file handling elements
    const dropZone = document.querySelector('.drop-zone');
    const loader = document.querySelector('.loader');
    const resultContainer = document.querySelector('.result-container');
    const resultTextarea = document.getElementById('result');
    const stripCommentsCheckbox = document.getElementById('strip-comments');
    const includeBinaryCheckbox = document.getElementById('include-binary');
    const excludePatternsTextarea = document.getElementById('exclude-patterns');
    const formatPatternInput = document.getElementById('format-pattern');
    const selectDirBtn = document.getElementById('selectDirBtn');
    const fallbackInput = document.getElementById('fallbackInput');
    const dropStatus = document.getElementById('drop-status');
    const copyBtn = document.getElementById('copy-btn');
    
    // Progress elements
    const statusContainer = document.getElementById('status-container');
    const statusMessage = document.getElementById('status-message');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Token warning elements
    const tokenWarning = document.getElementById('token-warning');
    const tokenWarningStats = document.getElementById('token-warning-stats');
    const tokenWarningContinue = document.getElementById('token-warning-continue');
    const tokenWarningCancel = document.getElementById('token-warning-cancel');
    
    let processedText = '';
    let processedFilesCount = 0;
    let totalFilesToProcess = 0;
    let isProcessingCancelled = false;
    const CHARS_PER_TOKEN = 4;
    
    // Get token limit from model select
    function getMaxTokens() {
        const modelSelect = document.getElementById('model-select');
        return parseInt(modelSelect.value, 10);
    }

    // Function to update progress UI
    function updateProgress(processed, total, message) {
        const percentage = Math.min(Math.round((processed / total) * 100), 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${processed} of ${total} files processed (${percentage}%)`;
        if (message) {
            statusMessage.textContent = message;
        }
    }

    // Function to show/hide status container with animation
    function toggleStatus(show, message = '') {
        statusContainer.classList.toggle('hidden', !show);
        if (show) {
            statusMessage.textContent = message;
            // Add fade-in effect
            statusMessage.style.opacity = '0';
            setTimeout(() => {
                statusMessage.style.opacity = '1';
            }, 10);
        }
    }

    // Function to count total files in a directory entry
    async function countFiles(entry, path = '') {
        let count = 0;
        if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise((resolve, reject) => {
                reader.readEntries(
                    entries => resolve(entries),
                    error => reject(error)
                );
            });
            
            for (const childEntry of entries) {
                const fullPath = path ? `${path}/${childEntry.name}` : childEntry.name;
                if (!shouldIgnoreFile(fullPath)) {
                    count += await countFiles(childEntry, fullPath);
                }
            }
        } else if (entry.isFile) {
            const fullPath = path ? `${path}/${entry.name}` : entry.name;
            if (!shouldIgnoreFile(fullPath)) {
                count = 1;
            }
        }
        return count;
    }

    // Function to parse .gitignore content
    function parseGitignore(content) {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(pattern => {
                if (pattern.startsWith('/')) {
                    pattern = pattern.slice(1);
                }
                if (pattern.endsWith('/')) {
                    pattern = pattern.slice(0, -1);
                }
                return pattern;
            });
    }

    // Function to clear gitignore
    function clearGitignore() {
        gitignorePatterns = [];
        gitignoreStatus.textContent = '';
        clearGitignoreBtn.classList.add('hidden');
        gitignoreInput.value = '';
    }

    // Function to handle gitignore file
    async function handleGitignoreFile(file) {
        try {
            const content = await file.text();
            gitignorePatterns = parseGitignore(content);
            gitignoreStatus.textContent = `Loaded ${gitignorePatterns.length} patterns from .gitignore`;
            clearGitignoreBtn.classList.remove('hidden');
            
            // Update exclude patterns textarea
            const currentPatterns = new Set(excludePatternsTextarea.value.split('\n').map(p => p.trim()).filter(p => p));
            gitignorePatterns.forEach(pattern => currentPatterns.add(pattern));
            excludePatternsTextarea.value = Array.from(currentPatterns).join('\n');
        } catch (error) {
            console.error('Error reading .gitignore file:', error);
            gitignoreStatus.textContent = 'Error reading .gitignore file';
        }
    }

    // File Selection Event Handlers
    selectDirBtn.addEventListener('click', () => {
        fallbackInput.click();
    });

    // Main file drop zone event listeners
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
        
        const items = Array.from(e.dataTransfer.items);
        if (items.length === 0) {
            dropStatus.textContent = 'No files dropped';
            return;
        }

        // Reset status
        processedText = '';
        processedFilesCount = 0;
        isProcessingCancelled = false;
        totalFilesToProcess = 0;
        
        toggleStatus(true, 'Analyzing Files...');
        loader.classList.remove('hidden');
        resultContainer.classList.add('hidden');

        try {
            await processItems(items);
            if (isProcessingCancelled) {
                toggleStatus(true, 'Processing Cancelled');
            } else {
                toggleStatus(true, 'Processing Complete!');
            }
            setTimeout(() => {
                toggleStatus(false);
            }, 2000);
        } catch (error) {
            console.error('Error processing dropped items:', error);
            toggleStatus(true, 'Error Processing Files');
            setTimeout(() => {
                toggleStatus(false);
            }, 2000);
        } finally {
            loader.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            displayResult();
            updateStats();
        }
    });

    // Handle directory/file selection via button
    fallbackInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            dropStatus.textContent = 'No files selected';
            return;
        }

        // Reset status
        processedText = '';
        processedFilesCount = 0;
        isProcessingCancelled = false;
        totalFilesToProcess = files.filter(file => !shouldIgnoreFile(file.webkitRelativePath || file.name)).length;
        
        toggleStatus(true, 'Beginning File Processing...');
        loader.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        
        try {
            await processFiles(files);
            if (isProcessingCancelled) {
                toggleStatus(true, 'Processing Cancelled');
            } else {
                toggleStatus(true, 'Processing Complete!');
            }
            setTimeout(() => {
                toggleStatus(false);
            }, 2000);
        } catch (error) {
            console.error('Error processing selected files:', error);
            toggleStatus(true, 'Error Processing Files');
            setTimeout(() => {
                toggleStatus(false);
            }, 2000);
        } finally {
            loader.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            displayResult();
            updateStats();
        }
    });

    // Process dropped items (handles both files and directories)
    async function processItems(items) {
        isProcessingCancelled = false;
        processedText = '';
        processedFilesCount = 0;
        
        try {
            // Count total files first
            totalFilesToProcess = 0;
            for (const item of items) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    totalFilesToProcess += await countFiles(entry);
                }
            }
            
            if (totalFilesToProcess === 0) {
                dropStatus.textContent = 'No valid files to process';
                return;
            }

            toggleStatus(true, 'Beginning File Processing...');
            loader.classList.remove('hidden');
            resultContainer.classList.add('hidden');
            
            // Process all items
            for (const item of items) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    await processEntry(entry);
                    if (isProcessingCancelled) {
                        break;
                    }
                }
            }

            // Check token limit after processing all files
            const currentTokens = Math.ceil(processedText.length / CHARS_PER_TOKEN);
            if (currentTokens > getMaxTokens()) {
                const shouldContinue = await showTokenWarning(currentTokens);
                if (!shouldContinue) {
                    isProcessingCancelled = true;
                }
            }

            if (isProcessingCancelled) {
                toggleStatus(true, 'Processing Cancelled');
            } else {
                toggleStatus(true, 'Processing Complete!');
            }
            
            displayResult();
            updateStats();
            loader.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing items:', error);
            dropStatus.textContent = 'Error processing files';
            loader.classList.add('hidden');
        }
    }

    // Process selected files
    async function processFiles(files) {
        isProcessingCancelled = false;
        processedText = '';
        processedFilesCount = 0;
        totalFilesToProcess = files.length;
        
        try {
            toggleStatus(true, 'Beginning File Processing...');
            loader.classList.remove('hidden');
            resultContainer.classList.add('hidden');
            
            for (const file of files) {
                if (!shouldIgnoreFile(file.name)) {
                    await processFile(file, file.name);
                    if (isProcessingCancelled) {
                        break;
                    }
                }
            }

            // Check token limit after processing all files
            const currentTokens = Math.ceil(processedText.length / CHARS_PER_TOKEN);
            if (currentTokens > getMaxTokens()) {
                const shouldContinue = await showTokenWarning(currentTokens);
                if (!shouldContinue) {
                    isProcessingCancelled = true;
                }
            }

            if (isProcessingCancelled) {
                toggleStatus(true, 'Processing Cancelled');
            } else {
                toggleStatus(true, 'Processing Complete!');
            }
            
            displayResult();
            updateStats();
            loader.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing files:', error);
            dropStatus.textContent = 'Error processing files';
            loader.classList.add('hidden');
        }
    }

    // Process a single entry (file or directory)
    async function processEntry(entry, path = '') {
        if (isProcessingCancelled) {
            return;
        }

        if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise((resolve, reject) => {
                reader.readEntries(
                    entries => resolve(entries),
                    error => reject(error)
                );
            });
            
            for (const childEntry of entries) {
                const fullPath = path ? `${path}/${childEntry.name}` : childEntry.name;
                if (!shouldIgnoreFile(fullPath)) {
                    await processEntry(childEntry, fullPath);
                }
            }
        } else if (entry.isFile) {
            const fullPath = path ? `${path}/${entry.name}` : entry.name;
            if (!shouldIgnoreFile(fullPath)) {
                const file = await new Promise((resolve, reject) => {
                    entry.file(
                        file => resolve(file),
                        error => reject(error)
                    );
                });
                await processFile(file, fullPath);
            }
        }
    }

    // Process a single file
    async function processFile(file, filePath) {
        if (isProcessingCancelled) {
            return;
        }

        try {
            let content = await file.text();
            if (stripCommentsCheckbox.checked) {
                content = stripComments(content, file.name.split('.').pop());
            }
            
            const pattern = formatPatternInput.value;
            const formattedContent = pattern
                .replace('{path}', filePath.substring(0, filePath.lastIndexOf('/') + 1))
                .replace('{filename}', filePath.substring(filePath.lastIndexOf('/') + 1))
                .replace('{content}', content)
                .replace(/{newline}/g, '\n');
            
            processedText += formattedContent;
            processedFilesCount++;
            updateProgress(processedFilesCount, totalFilesToProcess);
            
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            if (!includeBinaryCheckbox.checked) {
                console.log('Skipping binary file:', filePath);
            }
        }
    }

    // Function to show token warning and get user decision
    function formatTokenCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toLocaleString();
    }

    function showTokenWarning(currentTokens) {
        return new Promise((resolve) => {
            tokenWarningStats.textContent = `Current tokens: ${formatTokenCount(currentTokens)} / ${formatTokenCount(getMaxTokens())}`;
            tokenWarning.classList.remove('hidden');
            
            const handleContinue = () => {
                tokenWarning.classList.add('hidden');
                cleanup();
                resolve(true);
            };
            
            const handleCancel = () => {
                tokenWarning.classList.add('hidden');
                cleanup();
                resolve(false);
            };
            
            const cleanup = () => {
                tokenWarningContinue.removeEventListener('click', handleContinue);
                tokenWarningCancel.removeEventListener('click', handleCancel);
            };
            
            tokenWarningContinue.addEventListener('click', handleContinue);
            tokenWarningCancel.addEventListener('click', handleCancel);
        });
    }

    // Check if a file should be ignored based on patterns and gitignore
    function shouldIgnoreFile(filePath) {
        // Check exclude patterns
        const excludePatterns = excludePatternsTextarea.value
            .split('\n')
            .filter(pattern => pattern.trim())
            .map(pattern => new RegExp(pattern.trim()
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.')));

        if (excludePatterns.some(pattern => pattern.test(filePath))) {
            return true;
        }

        // Check gitignore patterns if enabled
        if (useGitignoreCheckbox.checked && gitignorePatterns.length > 0) {
            return gitignorePatterns.some(pattern => {
                const regexPattern = pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.');
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(filePath);
            });
        }

        return false;
    }

    // Gitignore event listeners
    useGitignoreCheckbox.addEventListener('change', () => {
        gitignoreUpload.classList.toggle('hidden', !useGitignoreCheckbox.checked);
        if (!useGitignoreCheckbox.checked) {
            clearGitignore();
        }
    });

    gitignoreDropZone.addEventListener('click', () => gitignoreInput.click());
    gitignoreDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        gitignoreDropZone.classList.add('dragover');
    });
    gitignoreDropZone.addEventListener('dragleave', () => {
        gitignoreDropZone.classList.remove('dragover');
    });
    gitignoreDropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        gitignoreDropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && (file.name === '.gitignore' || file.name.endsWith('.gitignore'))) {
            await handleGitignoreFile(file);
        } else {
            gitignoreStatus.textContent = 'Please upload a .gitignore file';
        }
    });

    gitignoreInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleGitignoreFile(file);
        }
    });

    clearGitignoreBtn.addEventListener('click', clearGitignore);

    const COMMENT_PATTERNS = {
        '.js': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.jsx': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.ts': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.tsx': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.py': [/#.*$/gm, /'''[\s\S]*?'''/g, /"""[\s\S]*?"""/g],
        '.php': [/\/\/.*$/gm, /#.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.java': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.c': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.cpp': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.h': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.hpp': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.cs': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.rb': [/#.*$/gm, /=begin[\s\S]*?=end/g],
        '.sh': [/#.*$/gm],
        '.bash': [/#.*$/gm],
        '.go': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
        '.rs': [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    };

    const TEXT_FILE_EXTENSIONS = new Set([
        '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.svg', '.md', '.mdx',
        '.env', '.yml', '.yaml', '.toml', '.ini', '.conf', '.config',
        '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
        '.kt', '.kts', '.scala', '.sh', '.bash', '.pl', '.pm', '.r', '.lua', '.sql',
        '.txt', '.rtf', '.csv', '.log', '.readme',
        '.gitignore', '.dockerignore', '.editorconfig'
    ]);

    function isTextFile(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return TEXT_FILE_EXTENSIONS.has(ext);
    }

    function stripComments(content, extension) {
        const patterns = COMMENT_PATTERNS[extension];
        if (!patterns) return content;

        let result = content;
        for (const pattern of patterns) {
            result = result.replace(pattern, '');
        }
        
        return result
            .split('\n')
            .filter(line => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n');
    }

    function updateStats() {
        const text = processedText;
        const chars = text.length;
        const words = text.split(/\s+/).filter(Boolean).length;
        const tokens = Math.ceil(chars / CHARS_PER_TOKEN);
        
        document.getElementById('char-count').textContent = `${chars.toLocaleString()} / ${(getMaxTokens() * CHARS_PER_TOKEN).toLocaleString()}`;
        document.getElementById('word-count').textContent = words.toLocaleString();
        document.getElementById('token-count').textContent = `${formatTokenCount(tokens)} / ${formatTokenCount(getMaxTokens())}`;
        
        const tokenCount = document.getElementById('token-count');
        if (tokens > getMaxTokens() * 0.9) {
            tokenCount.classList.add('text-red-500');
        } else if (tokens > getMaxTokens() * 0.75) {
            tokenCount.classList.add('text-yellow-500');
        } else {
            tokenCount.classList.remove('text-red-500', 'text-yellow-500');
        }
    }

    // Function to display the result in the textarea
    function displayResult() {
        resultTextarea.value = processedText;
    }

    // Copy button functionality
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(processedText);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
});