document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const repoUrlInput = document.getElementById('repoUrl');
    const instanceUrlInput = document.getElementById('instanceUrl');
    const showInstanceUrlCheckbox = document.getElementById('showInstanceUrl');
    const instanceUrlContainer = document.getElementById('instanceUrlContainer');
    const processRepoButton = document.getElementById('processRepo');
    const branchNameInput = document.getElementById('branchName');
    const privateRepoCheckbox = document.getElementById('privateRepo');
    const tokenInput = document.getElementById('tokenInput');
    const progressSection = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const currentFile = document.getElementById('current-file');
    const resultsSection = document.getElementById('results');
    const resultStats = document.getElementById('resultStats');
    const resultTextarea = document.getElementById('result');
    const copyResultButton = document.getElementById('copyResult');
    const outputPatternInput = document.getElementById('outputPattern');
    const stripCommentsCheckbox = document.getElementById('stripComments');
    const respectGitignoreCheckbox = document.getElementById('respectGitignore');
    const ignorePatternInput = document.getElementById('ignorePatterns');
    const modelSelect = document.getElementById('modelSelect');
    const sizeWarning = document.getElementById('size-warning');
    const tokenWarning = document.getElementById('token-warning');
    const tokenWarningStats = document.getElementById('token-warning-stats');
    const tokenWarningContinue = document.getElementById('token-warning-continue');
    const tokenWarningCancel = document.getElementById('token-warning-cancel');

    // Determine if we're on GitHub or GitLab page
    const isGitLabPage = document.title.includes('GitLab');

    // Handle instance URL toggle for GitLab
    if (showInstanceUrlCheckbox) {
        showInstanceUrlCheckbox.addEventListener('change', function() {
            instanceUrlContainer.classList.toggle('hidden', !this.checked);
            if (!this.checked) {
                instanceUrlInput.value = '';
            }
        });
    }

    // Toggle token input visibility based on private repo checkbox
    if (privateRepoCheckbox) {
        privateRepoCheckbox.addEventListener('change', function() {
            tokenInput.style.display = this.checked ? 'block' : 'none';
        });
    }

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

    // URL validation functions
    function isValidUrl(url, type = 'github', instanceUrl = '') {
        try {
            const urlObj = new URL(url);
            if (type === 'gitlab') {
                if (instanceUrl) {
                    return url.startsWith(instanceUrl);
                }
                return urlObj.hostname === 'gitlab.com';
            } else {
                return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
            }
        } catch {
            return false;
        }
    }

    function parseRepoUrl(url, type = 'github', instanceUrl = '') {
        if (type === 'gitlab') {
            const baseUrl = instanceUrl || 'https://gitlab.com';
            const urlWithoutBase = url.replace(baseUrl, '').replace(/^\//, '');
            const [owner, repo] = urlWithoutBase.split('/');
            return { owner, repo: repo.replace('.git', '') };
        } else {
            const parts = new URL(url).pathname.split('/').filter(Boolean);
            return {
                owner: parts[0],
                repo: parts[1]
            };
        }
    }

    async function fetchGitignore(owner, repo, headers, type = 'github', instanceUrl = '') {
        try {
            let response;
            if (type === 'github') {
                response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.gitignore`, { headers });
            } else {
                const baseUrl = instanceUrl || 'https://gitlab.com';
                const projectId = encodeURIComponent(`${owner}/${repo}`);
                response = await fetch(`${baseUrl}/api/v4/projects/${projectId}/repository/files/.gitignore/raw`, { headers });
            }

            if (response.ok) {
                const content = type === 'github' ? 
                    atob((await response.json()).content) : 
                    await response.text();
                
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
        const instanceUrl = instanceUrlInput ? instanceUrlInput.value.trim() : '';
        const repoType = (isGitLabPage || repoUrl.includes('gitlab')) ? 'gitlab' : 'github';

        if (!isValidUrl(repoUrl, repoType, instanceUrl)) {
            alert(`Please enter a valid ${repoType === 'gitlab' ? 'GitLab' : 'GitHub'} repository URL`);
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
            const { owner, repo } = parseRepoUrl(repoUrl, repoType, instanceUrl);
            await processRepository(repoType, {
                owner, 
                repo,
                instanceUrl
            });
        } catch (error) {
            console.error('Error processing repository:', error);
            alert('Error processing repository. Please check the URL and try again.');
            progressSection.classList.add('hidden');
        }
    });

    async function processRepository(type, config) {
        const { owner, repo, instanceUrl } = config;
        const branchName = branchNameInput ? branchNameInput.value.trim() : 'main';
        const isPrivate = privateRepoCheckbox ? privateRepoCheckbox.checked : false;
        
        // Get token based on type
        let token = '';
        if (isPrivate) {
            token = document.getElementById(type === 'github' ? 'githubToken' : 'gitlabToken')?.value.trim() || '';
        }
        
        // Prepare headers
        const headers = new Headers();
        if (type === 'github') {
            headers.set('Accept', 'application/vnd.github.v3+json');
            if (token) {
                headers.set('Authorization', `token ${token}`);
            }
        } else {
            // GitLab API
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        try {
            let targetBranch = branchName || 'main';
            let files = [];

            // First check if the repository exists
            if (type === 'github') {
                const repoCheckUrl = `https://api.github.com/repos/${owner}/${repo}`;
                const repoCheckResponse = await fetch(repoCheckUrl, { headers });
                
                if (!repoCheckResponse.ok) {
                    handleApiError(repoCheckResponse, type);
                    return;
                }

                const repoData = await repoCheckResponse.json();
                targetBranch = branchName || repoData.default_branch;
                
                if (branchNameInput) {
                    branchNameInput.placeholder = repoData.default_branch;
                    if (!branchName) {
                        branchNameInput.value = repoData.default_branch;
                    }
                }

                // Get the files recursively
                const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`;
                const treeResponse = await fetch(treeUrl, { headers });
                
                if (!treeResponse.ok) {
                    handleApiError(treeResponse, type);
                    return;
                }
                
                const treeData = await treeResponse.json();
                files = treeData.tree.filter(item => item.type === 'blob');
            } else {
                // GitLab API
                const baseUrl = instanceUrl || 'https://gitlab.com';
                const projectId = encodeURIComponent(`${owner}/${repo}`);
                const projectUrl = `${baseUrl}/api/v4/projects/${projectId}`;
                
                const projectResponse = await fetch(projectUrl, { headers });
                
                if (!projectResponse.ok) {
                    handleApiError(projectResponse, type);
                    return;
                }
                
                const projectData = await projectResponse.json();
                targetBranch = branchName || projectData.default_branch;
                
                if (branchNameInput) {
                    branchNameInput.placeholder = projectData.default_branch;
                    if (!branchName) {
                        branchNameInput.value = projectData.default_branch;
                    }
                }
                
                // Get the files recursively
                const treeUrl = `${baseUrl}/api/v4/projects/${projectId}/repository/tree?recursive=true&ref=${targetBranch}&per_page=100`;
                const treeResponse = await fetch(treeUrl, { headers });
                
                if (!treeResponse.ok) {
                    handleApiError(treeResponse, type);
                    return;
                }
                
                const treeData = await treeResponse.json();
                files = treeData.filter(item => item.type === 'blob').map(item => ({
                    path: item.path,
                    type: 'blob',
                    url: `${baseUrl}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(item.path)}/raw?ref=${targetBranch}`
                }));
            }

            if (files.length === 0) {
                alert('No files found in the repository');
                progressSection.classList.add('hidden');
                return;
            }

            window.totalFilesToProcess = files.length;
            
            // Fetch .gitignore if option is enabled
            if (respectGitignoreCheckbox && respectGitignoreCheckbox.checked) {
                window.gitignorePatterns = await fetchGitignore(owner, repo, headers, type, instanceUrl);
            }
            
            // Parse custom ignore patterns
            const customIgnorePatterns = ignorePatternInput && ignorePatternInput.value ? 
                ignorePatternInput.value.split('\n').filter(pattern => pattern.trim()) : [];
            
            // Create a tree for visualization
            const root = createFileTree(files);
            const treeHTML = generateTreeHTML(root);
            
            // Process each file
            const outputPattern = outputPatternInput ? 
                outputPatternInput.value : 
                "// File: {path}{filename}{newline}{content}{newline}{newline}";
            
            for (let i = 0; i < files.length; i++) {
                if (window.isProcessingCancelled) break;
                
                const file = files[i];
                const filePath = file.path;
                
                // Update progress UI
                if (currentFile) currentFile.textContent = filePath;
                updateProgress(i + 1, files.length);
                
                // Skip non-text files or files matching ignore patterns
                if (!isTextFile(filePath) || shouldIgnoreFile(filePath, window.gitignorePatterns, customIgnorePatterns)) {
                    continue;
                }
                
                try {
                    let contentUrl;
                    if (type === 'github') {
                        contentUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${targetBranch}/${filePath}`;
                    } else {
                        contentUrl = file.url;
                    }
                    
                    const content = await fetchFileContent(contentUrl, headers);
                    if (content) {
                        const processedContent = processFileContent(content, filePath);
                        const path = filePath.split('/').slice(0, -1).join('/');
                        const filename = filePath.split('/').pop();
                        
                        const formattedOutput = outputPattern
                            .replace('{path}', path ? path + '/' : '')
                            .replace('{filename}', filename)
                            .replace('{content}', processedContent)
                            .replace(/\{newline\}/g, '\n');
                        
                        window.processedText += formattedOutput;
                        window.processedFilesCount++;
                        
                        // Check if we're approaching token limits
                        updateStats();
                    }
                } catch (error) {
                    console.error(`Error processing file ${filePath}:`, error);
                }
            }
            
            // Show results
            displayResult();
            
            // Update file tree if element exists
            const fileTreeElement = document.getElementById('file-tree');
            if (fileTreeElement) {
                fileTreeElement.innerHTML = `<pre>${treeHTML}</pre>`;
            }
            
            progressSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing repository:', error);
            alert('Error processing repository. Please check the URL and try again.');
            progressSection.classList.add('hidden');
        }
    }

    function handleApiError(response, type) {
        if (response.status === 404) {
            alert(`Repository not found. Please check the URL and ensure the repository exists.`);
        } else if (response.status === 401 || response.status === 403) {
            alert(`Authentication error. ${type === 'github' ? 'GitHub' : 'GitLab'} API access denied. If this is a private repository, please provide a valid token.`);
        } else {
            alert(`Error accessing ${type === 'github' ? 'GitHub' : 'GitLab'} API: ${response.status} ${response.statusText}`);
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

    async function fetchFileContent(url, headers) {
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                return await response.text();
            }
            return null;
        } catch {
            return null;
        }
    }

    function processFileContent(content, filepath) {
        if (stripCommentsCheckbox && stripCommentsCheckbox.checked) {
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

    function getModelLimits() {
        const modelValue = modelSelect ? parseInt(modelSelect.value) : 128000;
        return {
            maxTokens: modelValue
        };
    }

    function updateStats() {
        const totalChars = window.processedText.length;
        const totalWords = window.processedText.split(/\s+/).length;
        const totalLines = window.processedText.split('\n').length;
        const estimatedTokens = Math.ceil(totalWords * 1.3);
        
        if (resultStats) {
            resultStats.innerHTML = `
                <p>Processed ${formatNumber(window.processedFilesCount)} files</p>
                <p>Total Characters: ${formatNumber(totalChars)}</p>
                <p>Total Words: ${formatNumber(totalWords)}</p>
                <p>Total Lines: ${formatNumber(totalLines)}</p>
                <p>Estimated Tokens: ${formatNumber(estimatedTokens)}</p>
            `;
        }

        // Check token limits
        const { maxTokens } = getModelLimits();
        if (estimatedTokens > maxTokens && !tokenWarning.classList.contains('active')) {
            if (tokenWarningStats) {
                tokenWarningStats.textContent = `Estimated ${formatNumber(estimatedTokens)} tokens exceeds the model limit of ${formatNumber(maxTokens)} tokens.`;
            }
            tokenWarning.classList.remove('hidden');
            tokenWarning.classList.add('active');
            window.isProcessingCancelled = true;
        }
    }

    // Add copy to clipboard functionality
    if (copyResultButton) {
        copyResultButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(resultTextarea.value);
                const originalText = copyResultButton.innerHTML;
                copyResultButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyResultButton.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard');
            }
        });
    }

    // Token warning handlers
    if (tokenWarningContinue) {
        tokenWarningContinue.addEventListener('click', () => {
            tokenWarning.classList.add('hidden');
            tokenWarning.classList.remove('active');
            window.isProcessingCancelled = false;
            resultsSection.classList.remove('hidden');
        });
    }

    if (tokenWarningCancel) {
        tokenWarningCancel.addEventListener('click', () => {
            tokenWarning.classList.add('hidden');
            tokenWarning.classList.remove('active');
            progressSection.classList.add('hidden');
        });
    }
});
