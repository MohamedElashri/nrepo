document.addEventListener('DOMContentLoaded', function() {
    const repoUrlInput = document.getElementById('gitlabRepoUrl');
    const instanceUrlInput = document.getElementById('gitlabInstanceUrl');
    const showInstanceUrlCheckbox = document.getElementById('showInstanceUrl');
    const instanceUrlContainer = document.getElementById('instanceUrlContainer');
    const processRepoButton = document.getElementById('processGitlabRepo');
    const progressSection = document.getElementById('gitlab-progress');
    const progressBar = document.getElementById('gitlab-progressBar');
    const resultsSection = document.getElementById('gitlab-results');
    const resultStats = document.getElementById('gitlab-resultStats');
    const resultTextarea = document.getElementById('gitlab-result');
    const stripCommentsCheckbox = document.getElementById('gitlab-stripComments');
    const modelSelect = document.getElementById('gitlab-modelSelect');
    const currentFile = document.getElementById('gitlab-current-file');
    const sizeWarning = document.getElementById('gitlab-size-warning');
    const tokenWarning = document.getElementById('gitlab-token-warning');
    const tokenWarningStats = document.getElementById('gitlab-token-warning-stats');
    const tokenWarningContinue = document.getElementById('gitlab-token-warning-continue');
    const tokenWarningCancel = document.getElementById('gitlab-token-warning-cancel');

    // Global state
    window.processedText = '';
    window.processedFilesCount = 0;
    window.totalFilesToProcess = 0;
    window.isProcessingCancelled = false;

    // Handle instance URL toggle
    showInstanceUrlCheckbox.addEventListener('change', function() {
        instanceUrlContainer.classList.toggle('hidden', !this.checked);
        if (!this.checked) {
            instanceUrlInput.value = '';
        }
    });

    class FileNode {
        constructor(name, isDirectory = false) {
            this.name = name;
            this.isDirectory = isDirectory;
            this.children = new Map();
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

    function isValidGitlabUrl(url, instanceUrl = '') {
        try {
            const urlObj = new URL(url);
            if (instanceUrl) {
                // For self-hosted instances
                const instanceUrlObj = new URL(instanceUrl);
                return url.startsWith(instanceUrl);
            } else {
                // For gitlab.com
                return urlObj.hostname === 'gitlab.com';
            }
        } catch (e) {
            return false;
        }
    }

    function parseGitlabUrl(url, instanceUrl = '') {
        const baseUrl = instanceUrl || 'https://gitlab.com';
        const urlWithoutBase = url.replace(baseUrl, '').replace(/^\//, '');
        const [owner, repo] = urlWithoutBase.split('/');
        return { owner, repo: repo.replace('.git', '') };
    }

    async function fetchFileContent(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }
        const data = await response.text();
        return data;
    }

    function processFileContent(content, filepath) {
        if (stripCommentsCheckbox.checked) {
            content = stripComments(content, '.' + filepath.split('.').pop());
        }
        return content;
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
                // Handle block comments
                if (inBlockComment) {
                    if (line.includes('*/')) {
                        inBlockComment = false;
                        line = line.split('*/')[1];
                    } else {
                        continue;
                    }
                }
                
                if (line.includes('/*')) {
                    inBlockComment = true;
                    line = line.split('/*')[0];
                }
                
                // Remove single-line comments
                line = line.split('//')[0];
            } else if (['.py', '.rb'].includes(extension)) {
                line = line.split('#')[0];
            } else if (extension === '.sql') {
                line = line.split('--')[0];
            }
            
            if (line.trim()) {
                result.push(line);
            }
        }
        
        return result.join('\n');
    }

    function updateProgress(current, total) {
        const percentage = (current / total) * 100;
        progressBar.style.width = percentage + '%';
    }

    function displayResult() {
        resultTextarea.value = window.processedText;
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function updateStats() {
        const totalChars = window.processedText.length;
        const totalWords = window.processedText.split(/\s+/).length;
        const totalLines = window.processedText.split('\n').length;
        const estimatedTokens = Math.ceil(totalWords * 1.3);
        
        resultStats.innerHTML = `
            <p>Processed ${formatNumber(window.processedFilesCount)} files</p>
            <p>Total Characters: ${formatNumber(totalChars)}</p>
            <p>Total Words: ${formatNumber(totalWords)}</p>
            <p>Total Lines: ${formatNumber(totalLines)}</p>
            <p>Estimated Tokens: ${formatNumber(estimatedTokens)}</p>
        `;
    }

    async function processGitlabRepo(owner, repo, instanceUrl = '') {
        const baseUrl = instanceUrl || 'https://gitlab.com';
        const apiUrl = `${baseUrl}/api/v4/projects/${encodeURIComponent(owner + '/' + repo)}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Repository not found');
            const repoData = await response.json();
            
            // Get repository tree
            const treeUrl = `${apiUrl}/repository/tree?recursive=true`;
            const treeResponse = await fetch(treeUrl);
            if (!treeResponse.ok) throw new Error('Failed to fetch repository tree');
            const files = await treeResponse.json();
            
            // Process files
            const root = createFileTree(files);
            const treeStructure = '// This is the tree structure of the code:\n' + 
                                generateTreeHTML(root)
                                    .replace(/<div class="tree-line">/g, '')
                                    .replace(/<\/div>/g, '\n') +
                                '\n// End of tree structure\n\n';
            
            // Store the tree structure
            window.processedText = treeStructure;
            window.totalFilesToProcess = files.filter(f => f.type === 'blob').length;
            window.processedFilesCount = 0;
            
            for (const file of files) {
                if (file.type === 'tree') continue;
                if (window.isProcessingCancelled) break;
                
                if (isTextFile(file.path)) {
                    currentFile.textContent = file.path;
                    try {
                        const content = await fetchFileContent(`${apiUrl}/repository/files/${encodeURIComponent(file.path)}/raw`);
                        const processedContent = processFileContent(content, file.path);
                        if (processedContent) {
                            window.processedText += `\nFile: ${file.path}\n${'='.repeat(file.path.length + 6)}\n${processedContent}\n`;
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
            alert('Error processing repository: ' + error.message);
            progressSection.classList.add('hidden');
        }
    }

    processRepoButton.addEventListener('click', async () => {
        const repoUrl = repoUrlInput.value.trim();
        const instanceUrl = instanceUrlInput.value.trim();
        
        if (!isValidGitlabUrl(repoUrl, instanceUrl)) {
            alert('Please enter a valid GitLab repository URL' + 
                  (instanceUrl ? ' for the specified instance' : ''));
            return;
        }

        // Reset state
        window.processedText = '';
        window.processedFilesCount = 0;
        window.totalFilesToProcess = 0;
        window.isProcessingCancelled = false;

        // Show progress
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        resultTextarea.value = '';
        progressBar.style.width = '0%';

        const { owner, repo } = parseGitlabUrl(repoUrl, instanceUrl);
        await processGitlabRepo(owner, repo, instanceUrl);
    });

    // Set default instance URL
    instanceUrlInput.placeholder = 'https://gitlab.cern.ch';
});
