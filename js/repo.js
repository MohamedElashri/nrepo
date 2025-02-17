document.addEventListener('DOMContentLoaded', function() {
    const repoUrlInput = document.getElementById('repoUrl');
    const processRepoButton = document.getElementById('processRepo');
    const progressSection = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const resultsSection = document.getElementById('results');
    const resultStats = document.getElementById('resultStats');
    const resultTextarea = document.getElementById('result');
    const stripCommentsCheckbox = document.getElementById('stripComments');
    const modelSelect = document.getElementById('modelSelect');
    const currentFile = document.getElementById('current-file');
    const sizeWarning = document.getElementById('size-warning');
    const tokenWarning = document.getElementById('token-warning');
    const warningTitle = document.getElementById('warning-title');
    const warningMessage = document.getElementById('warning-message');
    const tokenWarningStats = document.getElementById('token-warning-stats');
    const tokenWarningContinue = document.getElementById('token-warning-continue');
    const tokenWarningCancel = document.getElementById('token-warning-cancel');

    // Global state
    window.processedText = '';
    window.processedFilesCount = 0;
    window.totalFilesToProcess = 0;
    window.isProcessingCancelled = false;
    window.gitignorePatterns = [];

    class FileNode {
        constructor(name, isDirectory = false) {
            this.name = name;
            this.isDirectory = isDirectory;
            this.children = new Map();
        }
    }

    async function fetchGitignore(owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.gitignore`);
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                return content.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .map(line => line.trim());
            }
            return [];
        } catch {
            return [];
        }
    }

    function shouldIgnoreFile(filePath, gitignorePatterns, customPatterns) {
        const patterns = [...gitignorePatterns, ...customPatterns];
        for (const pattern of patterns) {
            if (!pattern) continue;
            const regex = new RegExp(pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.'));
            if (regex.test(filePath)) return true;
        }
        return false;
    }

    processRepoButton.addEventListener('click', async () => {
        const repoUrl = repoUrlInput.value.trim();
        if (!isValidGithubUrl(repoUrl)) {
            alert('Please enter a valid GitHub repository URL');
            return;
        }

        // Reset state
        window.processedText = '';
        window.processedFilesCount = 0;
        window.totalFilesToProcess = 0;
        window.isProcessingCancelled = false;
        window.gitignorePatterns = [];

        // Show progress
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        resultTextarea.value = '';
        progressBar.style.width = '0%';

        try {
            const { owner, repo } = parseGithubUrl(repoUrl);
            await processGithubRepo(owner, repo);
        } catch (error) {
            console.error('Error processing repository:', error);
            alert('Error processing repository. Please check the URL and try again.');
            progressSection.classList.add('hidden');
        }
    });

    function isValidGithubUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname === 'github.com' && parsedUrl.pathname.split('/').length >= 3;
        } catch {
            return false;
        }
    }

    function parseGithubUrl(url) {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        return {
            owner: parts[0],
            repo: parts[1]
        };
    }

    async function processGithubRepo(owner, repo) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
        
        try {
            // Get gitignore patterns if enabled
            const respectGitignore = document.getElementById('respectGitignore').checked;
            const gitignorePatterns = respectGitignore ? await fetchGitignore(owner, repo) : [];
            
            // Get custom ignore patterns
            const customPatterns = document.getElementById('ignorePatterns').value
                .split('\n')
                .map(p => p.trim())
                .filter(p => p);

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const data = await response.json();
            const files = data.tree
                .filter(item => item.type === 'blob')
                .filter(item => !shouldIgnoreFile(item.path, gitignorePatterns, customPatterns));

            window.totalFilesToProcess = files.length;

            // Generate tree structure
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

                if (isTextFile(file.path)) {
                    try {
                        const content = await fetchFileContent(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`);
                        const processedContent = processFileContent(content, file.path);
                        if (processedContent) {
                            window.processedText += processedContent;
                        }
                    } catch (error) {
                        console.error(`Error processing file ${file.path}:`, error);
                    }
                }
                window.processedFilesCount++;
                updateProgress(window.processedFilesCount, window.totalFilesToProcess);
            }

            displayResult();
            updateStats();
            progressSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');

        } catch (error) {
            throw new Error('Failed to fetch repository contents: ' + error.message);
        }
    }

    function createFileTree(files) {
        const root = new FileNode('root', true);
        files.forEach(file => {
            const parts = file.path.split('/');
            let current = root;
            parts.forEach((part, index) => {
                if (!current.children.has(part)) {
                    current.children.set(part, new FileNode(part, index < parts.length - 1));
                }
                current = current.children.get(part);
            });
        });
        return root;
    }

    function generateTreeHTML(node, prefix = '', isLast = true) {
        let result = '';
        if (node.name !== 'root') {
            result = prefix + (isLast ? '└── ' : '├── ') + node.name + '\n';
        }
        
        const entries = Array.from(node.children.entries());
        entries.forEach(([name, childNode], index) => {
            const newPrefix = prefix + (node.name === 'root' ? '' : (isLast ? '    ' : '│   '));
            result += generateTreeHTML(childNode, newPrefix, index === entries.length - 1);
        });
        
        return result;
    }

    async function fetchFileContent(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }
        const data = await response.json();
        return atob(data.content);
    }

    function processFileContent(content, filepath) {
        if (stripCommentsCheckbox.checked) {
            content = stripComments(content, '.' + filepath.split('.').pop());
        }
        
        // Get the output pattern and replace variables
        const outputPattern = document.getElementById('outputPattern').value;
        const filename = filepath.split('/').pop();
        const path = filepath.substring(0, filepath.length - filename.length);
        
        return outputPattern
            .replace(/{path}/g, path)
            .replace(/{filename}/g, filename)
            .replace(/{content}/g, content)
            .replace(/{newline}/g, '\n');
    }

    function isTextFile(filename) {
        const textExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
            '.html', '.css', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
            '.scala', '.sh', '.bash', '.sql', '.r', '.m', '.h', '.hpp',
            '.vue', '.xml', '.yaml', '.yml', '.json', '.md', '.txt', '.svg'
        ];
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return textExtensions.includes(ext);
    }

    function stripComments(content, extension) {
        extension = extension.toLowerCase();
        const lines = content.split('\n');
        const result = [];
        let inBlockComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            if (!line.trim()) continue;
            
            if (['.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.cpp', '.cs', '.go', '.php'].includes(extension)) {
                if (inBlockComment) {
                    if (line.includes('*/')) {
                        line = line.substring(line.indexOf('*/') + 2);
                        inBlockComment = false;
                    } else {
                        continue;
                    }
                }
                
                if (line.includes('/*')) {
                    if (line.includes('*/')) {
                        line = line.substring(0, line.indexOf('/*')) + 
                              line.substring(line.indexOf('*/') + 2);
                    } else {
                        line = line.substring(0, line.indexOf('/*'));
                        inBlockComment = true;
                    }
                }
                
                if (!inBlockComment && line.includes('//')) {
                    line = line.substring(0, line.indexOf('//'));
                }
            } else if (extension === '.py') {
                if (line.includes('#')) {
                    line = line.substring(0, line.indexOf('#'));
                }
            } else if (['.html', '.xml', '.svg'].includes(extension)) {
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
            
            if (line.trim()) result.push(line);
        }
        
        return result.join('\n');
    }

    function updateProgress(current, total) {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    function displayResult() {
        if (window.processedText) {
            resultTextarea.value = window.processedText;
        }
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    function getModelLimits() {
        const tokenLimit = parseInt(modelSelect?.value || '128000');
        const charLimit = tokenLimit * 3.5; // Using 3.5 characters per token as an average
        return { tokenLimit, charLimit };
    }

    function updateStats() {
        const text = window.processedText;
        const charCount = text.length;
        const wordCount = text.trim().split(/\s+/).length;
        const estimatedTokens = Math.ceil(charCount / 3.5); // Using 3.5 characters per token as an average
        
        const { tokenLimit, charLimit } = getModelLimits();
        
        resultStats.innerHTML = `
            <div class="grid grid-cols-3 gap-8">
                <div>
                    <div class="text-sm font-medium mb-1">Characters</div>
                    <div class="text-2xl font-bold">${formatNumber(charCount)} / ${formatNumber(charLimit)}</div>
                </div>
                <div>
                    <div class="text-sm font-medium mb-1">Words</div>
                    <div class="text-2xl font-bold">${formatNumber(wordCount)}</div>
                </div>
                <div>
                    <div class="text-sm font-medium mb-1">Estimated Tokens</div>
                    <div class="text-2xl font-bold">${formatNumber(estimatedTokens)} / ${formatNumber(tokenLimit)}</div>
                </div>
            </div>
        `;

        // Show warnings if limits are exceeded
        if (charCount > charLimit || estimatedTokens > tokenLimit) {
            tokenWarning.classList.remove('hidden');
            tokenWarningStats.textContent = `
                Characters: ${formatNumber(charCount)} / ${formatNumber(charLimit)}
                Tokens: ${formatNumber(estimatedTokens)} / ${formatNumber(tokenLimit)}
            `;
        }
    }
});
