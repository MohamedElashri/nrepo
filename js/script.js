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
    if (!filePath) return false;
    
    // Always ignore .git directory and other common unwanted files
    if (filePath.includes('/.git/') || 
        filePath.endsWith('.DS_Store') || 
        filePath.endsWith('Thumbs.db')) {
        return true;
    }
    
    // Skip non-text files by file extension detection
    const ext = '.' + filePath.split('.').pop().toLowerCase();
    const binaryExtensions = [
        '.zip', '.gz', '.tar', '.rar', '.7z', 
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico',
        '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.wav', '.flac',
        '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite', '.sqlite3',
        '.o', '.obj', '.class', '.pyc', '.pyd', '.pyo',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.ttf', '.otf', '.woff', '.woff2'
    ];
    
    if (binaryExtensions.includes(ext)) {
        return true;
    }
    
    // Check gitignore rules
    const useGitignore = document.getElementById('use-gitignore')?.checked || document.getElementById('respectGitignore')?.checked || false;
    if (useGitignore && window.gitignorePatterns && window.gitignorePatterns.length > 0) {
        for (const pattern of window.gitignorePatterns) {
            if (minimatch(filePath, pattern)) {
                return true;
            }
        }
    }
    
    // Get the current page type to determine which ID to use
    const pageType = document.body.dataset.pageType;
    let excludePatternsInput;
    
    if (pageType === 'github' || pageType === 'gitlab') {
        excludePatternsInput = document.getElementById('ignorePatterns');
    } else {
        // Default to index page ID format
        excludePatternsInput = document.getElementById('exclude-patterns');
    }
    
    // If we can't find the element with the expected ID, try the other format as fallback
    if (!excludePatternsInput) {
        excludePatternsInput = document.getElementById('exclude-patterns') || document.getElementById('ignorePatterns');
    }
    
    if (excludePatternsInput && excludePatternsInput.value.trim()) {
        const customPatterns = excludePatternsInput.value.trim().split('\n').filter(Boolean);
        
        for (const pattern of customPatterns) {
            const trimmedPattern = pattern.trim();
            if (!trimmedPattern || trimmedPattern.startsWith('#')) continue;
            
            try {
                // Try both the pattern as-is and with **/ prefix for matching anywhere in path
                if (minimatch(filePath, trimmedPattern) || minimatch(filePath, `**/${trimmedPattern}`)) {
                    console.log(`File ${filePath} matched ignore pattern: ${trimmedPattern}`);
                    return true;
                }
            } catch (err) {
                console.warn(`Invalid pattern: ${trimmedPattern}`, err);
            }
        }
    }
    
    return false;
};

// Minimatch function for gitignore-style pattern matching (simplified version)
function minimatch(filePath, pattern) {
    // Normalize paths to use forward slashes
    filePath = filePath.replace(/\\/g, '/');
    pattern = pattern.trim().replace(/\\/g, '/');
    
    // Remove leading slash if present
    filePath = filePath.replace(/^\//, '');
    pattern = pattern.replace(/^\//, '');
    
    // Handle negation
    if (pattern.startsWith('!')) {
        return !minimatch(filePath, pattern.slice(1));
    }
    
    // Handle directory-specific patterns (ending with /)
    if (pattern.endsWith('/')) {
        pattern = pattern.slice(0, -1);
        // Only match directories
        if (!filePath.includes('/')) return false;
    }
    
    // Convert gitignore globs to RegExp
    let regexPattern = pattern
        // Escape special regex chars except * and ?
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        // Convert gitignore globs to regex patterns
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    
    // Handle double asterisk (match any directory depth)
    regexPattern = regexPattern.replace(/\.\*\.\*/g, '.*');
    
    // Create regexes for different pattern matching strategies
    const exactMatch = new RegExp(`^${regexPattern}$`);
    const startsWith = new RegExp(`^${regexPattern}/`);
    const endsWith = new RegExp(`/${regexPattern}$`);
    const contains = new RegExp(`/${regexPattern}/`);
    
    // Check all pattern variations
    return exactMatch.test(filePath) || 
           startsWith.test(filePath) || 
           endsWith.test(filePath) || 
           contains.test(filePath);
}

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
            
            // Special handling for Jupyter notebooks
            let processedContent;
            if (ext === '.ipynb') {
                processedContent = parseJupyterNotebook(content);
            } else {
                processedContent = shouldStripComments ? stripComments(content, ext) : content;
            }
            
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

const parseJupyterNotebook = (content) => {
    try {
        const notebook = JSON.parse(content);
        if (!notebook.cells) {
            return content; // Not a valid notebook format, return original content
        }

        let parsedContent = '';
        notebook.cells.forEach((cell, index) => {
            // Only process markdown and code cells
            if (cell.cell_type === 'markdown' || cell.cell_type === 'code') {
                parsedContent += `// Cell ${index + 1} (${cell.cell_type})\n`;
                
                // Join the source lines and add them to parsed content
                if (Array.isArray(cell.source)) {
                    parsedContent += cell.source.join('');
                } else if (typeof cell.source === 'string') {
                    parsedContent += cell.source;
                }
                parsedContent += '\n\n';
            }
        });

        return parsedContent.trim();
    } catch (error) {
        console.error('Error parsing Jupyter notebook:', error);
        return content; // Return original content if parsing fails
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
        
        // Skip files that should be ignored
        if (shouldIgnoreFile(path)) {
            continue;
        }
        
        const parts = path.split('/');
        let currentNode = root;
        
        // Skip if the first part is ignored (e.g., .git directory)
        if (shouldIgnoreFile(parts[0])) {
            continue;
        }
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const currentPath = parts.slice(0, i + 1).join('/');
            
            // Skip if any parent directory should be ignored
            if (shouldIgnoreFile(currentPath)) {
                break;
            }
            
            if (!currentNode.children.has(part)) {
                currentNode.children.set(part, new FileNode(part, !isLast));
            }
            currentNode = currentNode.children.get(part);
        }
    }
    
    return root;
};

// Sort function that puts directories first
const sortNodes = (a, b) => {
    if (a[1].isDirectory === b[1].isDirectory) {
        return a[0].localeCompare(b[0]);
    }
    return a[1].isDirectory ? -1 : 1;
};

const generateHTML = (node, prefix = '', isLast = true, isRoot = true) => {
    if (isRoot) {
        return Array.from(node.children.entries())
            .sort(sortNodes)
            .map(([name, childNode], index, array) => 
                generateHTML(childNode, '', index === array.length - 1, false))
            .join('');
    }
    
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    
    let html = `${prefix}${connector}${node.name}\n`;
    
    if (node.isDirectory) {
        const sortedChildren = Array.from(node.children.entries()).sort(sortNodes);
        html += sortedChildren
            .map(([name, childNode], index) => 
                generateHTML(childNode, prefix + childPrefix, index === sortedChildren.length - 1, false))
            .join('');
    }
    
    return html;
};

const displayFileTree = (files) => {
    const treeContainer = document.getElementById('file-tree');
    if (!treeContainer) return;
    
    const root = createFileTree(files);
    
    const treeHTML = generateHTML(root)
        .split('\n')
        .map(line => `<div class="tree-line">${line}</div>`)
        .join('');
    
    treeContainer.innerHTML = `<pre class="file-tree-pre">${treeHTML}</pre>`;
    
    // Update stats after tree is displayed
    updateStats();
};

const processFiles = async (files) => {
    console.log('Processing files:', files.length);
    window.isProcessingCancelled = false;
    window.processedText = '';
    window.processedFilesCount = 0;
    window.totalFilesToProcess = files.length;
    
    // Store the original files for later reprocessing with different settings
    window.originalFiles = Array.from(files);

    const loader = document.querySelector('.loader');
    const resultContainer = document.querySelector('.result-container');
    const currentFile = document.getElementById('current-file');
    const filesCounter = document.getElementById('files-counter');
    
    toggleStatus(true, 'Beginning File Processing...');
    if (loader) loader.classList.remove('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');

    try {
        // Generate and display the file tree
        displayFileTree(files);
        
        // Generate tree structure for the output
        const root = createFileTree(files);
        const treeStructure = '// This is the tree structure of the code:\n' + 
                            generateHTML(root)
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

// Expose formatNumber to global scope
window.formatNumber = formatNumber;

const getModelLimits = () => {
    const modelSelect = document.getElementById('model-select');
    if (!modelSelect) return { tokenLimit: 128000, charLimit: 448000 };

    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    const tokenLimit = parseInt(selectedOption.dataset.tokens || '128000');
    const charLimit = parseInt(selectedOption.dataset.chars || '448000');
    
    return { tokenLimit, charLimit };
};

// Expose getModelLimits to global scope
window.getModelLimits = getModelLimits;

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

// Expose updateStats to global scope
window.updateStats = updateStats;

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

// Theme toggle is now handled by theme.js

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
    const dropStatus = document.getElementById('drop-status');
    const resultsSection = document.getElementById('results');
    const resultStats = document.getElementById('resultStats');
    const resultTextarea = document.getElementById('result');
    const copyResultButton = document.getElementById('copyResult');

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
    const copyButtonHandler = async () => {
        try {
            await navigator.clipboard.writeText(resultTextarea.value);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.remove('bg-[#2da44e]', 'hover:bg-[#2c974b]');
            copyBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                copyBtn.classList.add('bg-[#2da44e]', 'hover:bg-[#2c974b]');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
            alert('Failed to copy text to clipboard');
        }
    };

    if (copyBtn) {
        copyBtn.addEventListener('click', copyButtonHandler);
    }

    if (copyResultButton) {
        copyResultButton.addEventListener('click', copyButtonHandler);
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

const processFilesWithSettings = async (files) => {
    if (!files || files.length === 0) {
        console.error('No files to process');
        return;
    }
    
    const formatPattern = document.getElementById('format-pattern')?.value || '// File: {path}{filename}{newline}{content}{newline}{newline}';
    const shouldStripComments = document.getElementById('strip-comments')?.checked || document.getElementById('stripComments')?.checked || false;
    const excludePatternsInput = document.getElementById('exclude-patterns') || document.getElementById('ignorePatterns');
    
    const totalFiles = files.length;
    let processedCount = 0;
    let allText = '';
    window.processedFilesCount = 0;
    
    console.log('Reprocessing files with updated settings:', {
        totalFiles, 
        stripComments: shouldStripComments, 
        useGitignore: document.getElementById('use-gitignore')?.checked || document.getElementById('respectGitignore')?.checked,
        excludePatterns: excludePatternsInput?.value || 'none'
    });
    
    // Show status and loader
    toggleStatus(true, 'Applying new settings...');
    const loader = document.querySelector('.loader');
    if (loader) loader.classList.remove('hidden');
    
    // Filter files first to only process those that shouldn't be ignored with current settings
    const filesToProcess = Array.from(files).filter(file => {
        const filePath = file.webkitRelativePath || file.name;
        return !shouldIgnoreFile(filePath);
    });
    
    console.log(`After filtering: Processing ${filesToProcess.length} out of ${files.length} files`);
    
    // Generate and display the file tree first
    const root = createFileTree(filesToProcess);
    
    // Add tree structure to the beginning of the processed text
    const treeStructure = '// This is the tree structure of the code:\n' + 
                        generateHTML(root)
                            .split('\n')
                            .filter(line => line.trim())
                            .map(line => '// ' + line)
                            .join('\n') + 
                        '\n\n// ======== FILE CONTENTS ========\n\n';
    
    // Start with the tree structure
    allText = treeStructure;
    
    const promises = filesToProcess.map(file => {
        return new Promise((resolve) => {
            processedCount++;
            updateProgress(processedCount, filesToProcess.length);
            
            const filePath = file.webkitRelativePath || file.name;
            const fileName = file.name;
            
            // Skip non-text files unless it's a Jupyter notebook
            const isJupyter = fileName.endsWith('.ipynb');
            if (!isTextFile(fileName) && !isJupyter) {
                console.log(`Skipping non-text file: ${filePath}`);
                resolve();
                return;
            }
            
            // We already have the file's content in the file object from the original processing
            const reader = new FileReader();
            
            reader.onload = function(e) {
                let content = e.target.result;
                
                // Handle Jupyter notebooks
                if (isJupyter) {
                    try {
                        content = parseJupyterNotebook(content);
                    } catch (error) {
                        console.error(`Error parsing Jupyter notebook ${filePath}:`, error);
                        resolve();
                        return;
                    }
                }
                
                // Strip comments if enabled - apply the current setting
                if (shouldStripComments && isTextFile(fileName)) {
                    const extension = '.' + fileName.split('.').pop();
                    content = stripComments(content, extension);
                }
                
                // Show current file in the UI
                document.getElementById('current-file').textContent = filePath;
                
                // Format with the pattern
                const formatted = formatPattern
                    .replace(/{path}/g, filePath.substring(0, filePath.lastIndexOf('/') + 1))
                    .replace(/{filename}/g, fileName)
                    .replace(/{content}/g, content)
                    .replace(/{newline}/g, '\n');
                
                allText += formatted;
                window.processedFilesCount++;
                resolve();
            };
            
            reader.onerror = function() {
                console.error(`Error reading file ${file.name}`);
                resolve();
            };
            
            reader.readAsText(file);
        });
    });
    
    // Handle completion of all file processing
    Promise.all(promises).then(() => {
        // Hide the loader and status
        if (loader) loader.classList.add('hidden');
        toggleStatus(false);
        
        // Store the processed text
        window.processedText = allText;
        
        // Update the result display
        const resultTextarea = document.getElementById('result');
        if (resultTextarea) {
            resultTextarea.value = allText;
        }
        
        // Create and display the file tree with current ignore settings
        displayFileTree(filesToProcess);
        
        // Update stats
        updateStats();
        
        // Check if we exceed token limits
        const { tokenLimit } = getModelLimits();
        const tokens = Math.ceil((window.processedText || '').length / 3.5);
        
        if (tokens > tokenLimit) {
            const tokenWarning = document.getElementById('token-warning');
            const tokenWarningStats = document.getElementById('token-warning-stats');
            
            if (tokenWarning && tokenWarningStats) {
                tokenWarningStats.textContent = `Estimated: ${formatNumber(tokens)} tokens / Model limit: ${formatNumber(tokenLimit)} tokens`;
                tokenWarning.classList.remove('hidden');
                
                // Set up the warning buttons
                const continueBtn = document.getElementById('token-warning-continue');
                const cancelBtn = document.getElementById('token-warning-cancel');
                
                if (continueBtn) {
                    continueBtn.onclick = function() {
                        tokenWarning.classList.add('hidden');
                    };
                }
                
                if (cancelBtn) {
                    cancelBtn.onclick = function() {
                        tokenWarning.classList.add('hidden');
                    };
                }
            }
        } else {
            // Hide the token warning if it's visible
            const tokenWarning = document.getElementById('token-warning');
            if (tokenWarning) {
                tokenWarning.classList.add('hidden');
            }
        }
    });
};

// Expose the function to the global scope
window.processFilesWithSettings = processFilesWithSettings;