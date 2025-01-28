// Utility Functions
const isTextFile = (filename) => {
    const textExtensions = [
      // C/C++ and Related
      '.c', '.cpp', '.h', '.hpp', '.cc', '.hh', '.cxx', '.hxx', '.c++', '.h++',
      '.cp', '.cpp', '.i', '.ii', '.tcc', '.inl', '.inc', '.ixx', '.ipp', 
      '.tpp', '.cuh', '.cu', '.cl', // CUDA and OpenCL
      // Fortran and Legacy Scientific
      '.f', '.for', '.f77', '.f90', '.f95', '.f03', '.f08', '.ftn', '.fpp',
      '.F', '.FOR', '.F77', '.F90', '.F95', '.F03', '.F08',
      '.cob', '.cbl', '.cpy', '.cobs', // COBOL
      '.ada', '.adb', '.ads', // Ada
      '.pas', '.pp', '.inc', // Pascal
      '.prg', '.frm', '.bas', '.cls', '.vbs', // BASIC variants
      // Modern Languages
      '.txt', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte',
      '.py', '.pyw', '.pyc', '.pyo', '.pyd', '.pyi', '.ipynb', '.rpy',
      '.java', '.class', '.jar', '.war', '.ear', '.jsp', '.jspx',
      '.cs', '.vb', '.fs', '.fsx', '.fsi', '.fsscript',
      '.go', '.mod', '.sum',
      '.rb', '.rbw', '.rake', '.gemspec', '.rbx', '.ru',
      '.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.php8', '.phps', '.inc',
      '.pl', '.pm', '.t', '.pod',
      '.swift', '.m', '.mm',
      '.rs', '.rlib',
      '.scala', '.sc',
      '.groovy', '.gvy', '.gy', '.gsh',
      '.kt', '.kts',
      '.lua', '.luac',
      '.r', '.rdata', '.rds',
      '.matlab', '.m', '.mat',
      '.f', '.for', '.f90', '.f95',
      '.hs', '.lhs', '.hsc',
      '.clj', '.cljs', '.cljc', '.edn',
      '.dart',
      '.ex', '.exs',
      '.erl', '.hrl',
      // Web Technologies
      '.html', '.htm', '.xhtml', '.shtml', '.asp', '.aspx', '.jsp', '.css', '.scss', '.sass', '.less',
      '.xml', '.xsl', '.xslt', '.svg', '.wsdl', '.dtd',
      // Shell and Scripts
      '.sh', '.bash', '.zsh', '.fish', '.ksh', '.tcsh', '.csh',
      '.bat', '.cmd', '.ps1', '.psm1', '.psd1',
      // Config Files
      '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.properties',
      '.env', '.rc', '.reg',
      // Documentation
      '.md', '.markdown', '.rst', '.asciidoc', '.adoc', '.tex',
      // Build and Version Control
      '.gradle', '.maven', '.pom', '.ivy', '.ant',
      '.dockerfile', '.dockerignore',
      '.gitignore', '.gitattributes', '.hgignore',
      // Others
      '.log', '.sql', '.ddl', '.dml'];
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return textExtensions.includes(ext);
    };
    
    const stripComments = (content, extension) => {
        // Convert extension to lowercase for case-insensitive comparison
        extension = extension.toLowerCase();
        
        // Split content into lines for processing
        const lines = content.split('\n');
        const result = [];
        let inBlockComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Handle C-style languages
            if (['.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.cpp', '.cs', '.go', '.php'].includes(extension)) {
                if (inBlockComment) {
                    if (line.includes('*/')) {
                        line = line.substring(line.indexOf('*/') + 2);
                        inBlockComment = false;
                    } else {
                        continue;
                    }
                }
                
                // Check for block comment start
                if (line.includes('/*')) {
                    if (line.includes('*/')) {
                        // Block comment starts and ends on same line
                        line = line.substring(0, line.indexOf('/*')) + 
                              line.substring(line.indexOf('*/') + 2);
                    } else {
                        // Block comment starts but doesn't end
                        line = line.substring(0, line.indexOf('/*'));
                        inBlockComment = true;
                    }
                }
                
                // Handle line comments
                if (!inBlockComment && line.includes('//')) {
                    line = line.substring(0, line.indexOf('//'));
                }
            }
            
            // Handle Python/Ruby style
            else if (['.py', '.rb'].includes(extension)) {
                if (line.trim().startsWith('#')) {
                    continue;
                }
            }
            
            // Handle shell scripts and YAML
            else if (['.sh', '.bash', '.yaml', '.yml'].includes(extension)) {
                if (line.trim().startsWith('#')) {
                    continue;
                }
            }
            
            // Handle HTML/XML
            else if (['.html', '.xml', '.svg'].includes(extension)) {
                if (inBlockComment) {
                    if (line.includes('-->')) {
                        line = line.substring(line.indexOf('-->') + 3);
                        inBlockComment = false;
                    } else {
                        continue;
                    }
                }
                if (line.includes('<!--')) {
                    if (line.includes('-->')) {
                        line = line.substring(0, line.indexOf('<!--')) + 
                              line.substring(line.indexOf('-->') + 3);
                    } else {
                        line = line.substring(0, line.indexOf('<!--'));
                        inBlockComment = true;
                    }
                }
            }
            
            // Only add non-empty lines after processing
            if (line.trim()) {
                result.push(line);
            }
        }
        
        return result.join('\n');
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

class FileNode {
    constructor(name, isDirectory = false) {
        this.name = name;
        this.isDirectory = isDirectory;
        this.children = new Map();
    }
}

const createFileTree = (files) => {
    const root = new FileNode('root', true);
    
    for (const file of files) {
        const path = file.webkitRelativePath || file.name;
        const parts = path.split('/');
        let currentNode = root;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            
            if (!currentNode.children.has(part)) {
                currentNode.children.set(part, new FileNode(part, !isLast));
            }
            currentNode = currentNode.children.get(part);
        }
    }
    
    return root;
};

const generateTreeHTML = (node, prefix = '', isLast = true, isRoot = true) => {
    if (isRoot) {
        return Array.from(node.children.values())
            .map((child, index, array) => 
                generateTreeHTML(child, '', index === array.length - 1, false))
            .join('');
    }

    const marker = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    
    let html = `<div class="tree-line">${prefix}${marker}${node.name}</div>`;
    
    if (node.isDirectory) {
        const children = Array.from(node.children.values());
        const childrenHTML = children
            .map((child, index) => 
                generateTreeHTML(child, prefix + childPrefix, index === children.length - 1, false))
            .join('');
        html += childrenHTML;
    }
    
    return html;
};

const displayFileTree = (files) => {
    const treeContainer = document.getElementById('file-tree');
    if (!treeContainer) {
        const container = document.createElement('div');
        container.id = 'file-tree';
        container.className = 'mt-4 p-4 bg-gray-800 rounded-lg overflow-x-auto';
        
        const header = document.createElement('div');
        header.className = 'text-white font-semibold mb-2';
        header.textContent = 'This is the tree structure of the code:';
        
        const tree = document.createElement('pre');
        tree.className = 'text-gray-300 font-mono text-sm';
        
        const root = createFileTree(files);
        tree.innerHTML = generateTreeHTML(root);
        
        container.appendChild(header);
        container.appendChild(tree);
        
        // Insert after the drop zone
        const dropZone = document.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.parentNode.insertBefore(container, dropZone.nextSibling);
        }
    } else {
        const root = createFileTree(files);
        const tree = treeContainer.querySelector('pre');
        if (tree) {
            tree.innerHTML = generateTreeHTML(root);
        }
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
        // Generate and display the file tree
        displayFileTree(files);
        
        // Generate tree structure for the output
        const root = createFileTree(files);
        const treeStructure = '// This is the tree structure of the code:\n' + 
                            generateTreeHTML(root)
                                .replace(/<div class="tree-line">/g, '')
                                .replace(/<\/div>/g, '\n') +
                            '\n// End of tree structure\n\n';
        
        // Store the tree structure
        window.processedText = treeStructure;
        
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
        
        // Ensure the tree structure is at the beginning of the text
        const treeEndMarker = '// End of tree structure\n\n';
        const hasTree = window.processedText.includes(treeEndMarker);
        
        if (!hasTree && window.processedText.trim()) {
            // If there's no tree structure but we have content, 
            // this might be from a single file upload
            resultTextarea.value = window.processedText;
        } else {
            // Tree structure is already included
            resultTextarea.value = window.processedText;
        }
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