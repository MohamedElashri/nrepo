document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const githubTab = document.getElementById('github-tab');
    const gitlabTab = document.getElementById('gitlab-tab');
    const githubSection = document.getElementById('github-section');
    const gitlabSection = document.getElementById('gitlab-section');
    const githubTokenInput = document.getElementById('githubTokenInput');
    const gitlabTokenInput = document.getElementById('gitlabTokenInput');

    // Common elements
    const privateRepoCheckbox = document.getElementById('privateRepo');
    const showInstanceUrlCheckbox = document.getElementById('showInstanceUrl');
    const instanceUrlContainer = document.getElementById('instanceUrlContainer');
    const processGithubRepoButton = document.getElementById('processGithubRepo');
    const processGitlabRepoButton = document.getElementById('processGitlabRepo');
    const progressSection = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const currentFile = document.getElementById('current-file');
    const resultsSection = document.getElementById('results');
    const resultStats = document.getElementById('resultStats');
    const resultTextarea = document.getElementById('result');
    const copyResultButton = document.getElementById('copyResult');
    const outputPatternInput = document.getElementById('outputPattern');
    const sizeWarning = document.getElementById('size-warning');
    const tokenWarning = document.getElementById('token-warning');
    const tokenWarningStats = document.getElementById('token-warning-stats');
    const tokenWarningContinue = document.getElementById('token-warning-continue');
    const tokenWarningCancel = document.getElementById('token-warning-cancel');

    // Current platform state
    let currentPlatform = 'github';

    // Tab switching event listeners
    githubTab.addEventListener('click', function() {
        setActivePlatform('github');
    });

    gitlabTab.addEventListener('click', function() {
        setActivePlatform('gitlab');
    });

    // Function to switch active platform
    function setActivePlatform(platform) {
        // Update current platform
        currentPlatform = platform;
        
        // Update body data attribute for model-settings.js
        document.body.dataset.pageType = platform;
        
        // Update UI based on platform
        if (platform === 'github') {
            // Update tabs
            githubTab.classList.add('border-blue-500', 'dark:border-blue-400', 'text-blue-600', 'dark:text-blue-400');
            githubTab.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-transparent');
            
            gitlabTab.classList.remove('border-blue-500', 'dark:border-blue-400', 'text-blue-600', 'dark:text-blue-400');
            gitlabTab.classList.add('text-gray-500', 'dark:text-gray-400', 'border-transparent');
            
            // Show GitHub section, hide GitLab section
            githubSection.classList.remove('hidden');
            gitlabSection.classList.add('hidden');
            
            // Update title and placeholder text
            document.title = 'nrepo - GitHub Repository Processing';
            
            // Update token input visibility
            if (privateRepoCheckbox.checked) {
                githubTokenInput.classList.remove('hidden');
                gitlabTokenInput.classList.add('hidden');
            }
        } else {
            // Update tabs
            gitlabTab.classList.add('border-blue-500', 'dark:border-blue-400', 'text-blue-600', 'dark:text-blue-400');
            gitlabTab.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-transparent');
            
            githubTab.classList.remove('border-blue-500', 'dark:border-blue-400', 'text-blue-600', 'dark:text-blue-400');
            githubTab.classList.add('text-gray-500', 'dark:text-gray-400', 'border-transparent');
            
            // Show GitLab section, hide GitHub section
            gitlabSection.classList.remove('hidden');
            githubSection.classList.add('hidden');
            
            // Update title and placeholder text
            document.title = 'nrepo - GitLab Repository Processing';
            
            // Update token input visibility
            if (privateRepoCheckbox.checked) {
                gitlabTokenInput.classList.remove('hidden');
                githubTokenInput.classList.add('hidden');
            }
        }
        
        // Re-initialize model settings with correct IDs
        document.dispatchEvent(new CustomEvent('platformChanged', { detail: { platform } }));
    }

    // Handle instance URL toggle for GitLab
    if (showInstanceUrlCheckbox) {
        showInstanceUrlCheckbox.addEventListener('change', function() {
            instanceUrlContainer.classList.toggle('hidden', !this.checked);
            if (!this.checked) {
                document.getElementById('instanceUrl').value = '';
            }
        });
    }

    // Toggle token input visibility based on private repo checkbox
    if (privateRepoCheckbox) {
        privateRepoCheckbox.addEventListener('change', function() {
            if (currentPlatform === 'github') {
                githubTokenInput.classList.toggle('hidden', !this.checked);
                gitlabTokenInput.classList.add('hidden');
            } else {
                gitlabTokenInput.classList.toggle('hidden', !this.checked);
                githubTokenInput.classList.add('hidden');
            }
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
                return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').filter(Boolean).length >= 2;
            }
        } catch (e) {
            console.error('URL validation error:', e);
            return false;
        }
    }

    function parseRepoUrl(url, type = 'github', instanceUrl = '') {
        console.log(`Parsing ${type} URL:`, url);
        try {
            if (type === 'gitlab') {
                const baseUrl = instanceUrl || 'https://gitlab.com';
                // Remove trailing slashes from baseUrl and potential .git extension from url
                const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
                const cleanUrl = url.replace(/\.git$/, '');
                
                // Extract the path after the base URL
                let urlWithoutBase = '';
                if (cleanUrl.startsWith(cleanBaseUrl)) {
                    urlWithoutBase = cleanUrl.substring(cleanBaseUrl.length).replace(/^\/+/, '');
                } else {
                    // Try to parse as a direct owner/repo format
                    urlWithoutBase = cleanUrl.replace(/^https?:\/\/[^\/]+\//, '');
                }
                
                // Split the path to extract owner and repo
                const parts = urlWithoutBase.split('/').filter(Boolean);
                if (parts.length >= 2) {
                    // Handle nested groups in GitLab (group/subgroup/project)
                    const repo = parts.pop();
                    const owner = parts.join('/');
                    console.log(`Parsed GitLab URL - Owner: ${owner}, Repo: ${repo}`);
                    return { owner, repo };
                }
                // If we can't parse properly, return empty values
                console.error('Failed to parse GitLab URL parts correctly:', urlWithoutBase);
                return { owner: '', repo: '' };
            } else {
                // GitHub URL parsing
                try {
                    const parts = new URL(url).pathname.split('/').filter(Boolean);
                    if (parts.length < 2) {
                        console.error('GitHub URL has insufficient parts:', parts);
                        return { owner: '', repo: '' };
                    }
                    const result = {
                        owner: parts[0],
                        repo: parts[1].replace(/\.git$/, '')
                    };
                    console.log(`Parsed GitHub URL - Owner: ${result.owner}, Repo: ${result.repo}`);
                    return result;
                } catch (e) {
                    console.error('Error parsing GitHub URL:', e);
                    return { owner: '', repo: '' };
                }
            }
        } catch (e) {
            console.error(`Error parsing ${type} URL:`, e);
            return { owner: '', repo: '' };
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

    // Handle form submission for GitHub
    if (processGithubRepoButton) {
        processGithubRepoButton.addEventListener('click', async () => {
            // Get GitHub-specific elements
            const repoUrlInput = document.getElementById('githubRepoUrl');
            const branchNameInput = document.getElementById('branchName');
            const githubTokenInput = document.getElementById('githubToken');
            
            // Validate URL
            const url = repoUrlInput.value.trim();
            
            if (!url) {
                alert('Please enter a GitHub repository URL');
                return;
            }
            
            if (!isValidUrl(url, 'github')) {
                alert('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
                return;
            }
            
            // Parse the URL to get owner and repo
            const { owner, repo } = parseRepoUrl(url, 'github');
            
            if (!owner || !repo) {
                alert('Could not parse repository owner and name from URL. Please check the format (e.g., https://github.com/owner/repo)');
                return;
            }
            
            console.log(`Processing GitHub repository: ${owner}/${repo}`);
            
            // Start processing
            progressSection.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            sizeWarning.classList.add('hidden');
            tokenWarning.classList.add('hidden');
            
            // Update progress UI
            updateProgress(0, 1);
            currentFile.textContent = 'Analyzing repository...';
            
            // Configuration 
            const config = {
                url: url,
                owner: owner,
                repo: repo,
                branch: branchNameInput.value.trim() || '',
                token: privateRepoCheckbox.checked ? githubTokenInput.value.trim() : '',
                instanceUrl: ''
            };
            
            // Process repository
            try {
                await processRepository('github', config);
            } catch (error) {
                console.error('Error processing GitHub repository:', error);
                alert(`Error processing repository: ${error.message}`);
                progressSection.classList.add('hidden');
            }
        });
    }

    // Handle form submission for GitLab
    if (processGitlabRepoButton) {
        processGitlabRepoButton.addEventListener('click', async () => {
            // Get GitLab-specific elements
            const repoUrlInput = document.getElementById('gitlabRepoUrl');
            const branchNameInput = gitlabSection.querySelector('#branchName');
            const gitlabTokenInput = document.getElementById('gitlabToken');
            const instanceUrlInput = document.getElementById('instanceUrl');
            
            // Validate URL
            const url = repoUrlInput.value.trim();
            const instanceUrl = showInstanceUrlCheckbox.checked ? instanceUrlInput.value.trim() : '';
            
            if (!url) {
                alert('Please enter a GitLab repository URL');
                return;
            }
            
            if (!isValidUrl(url, 'gitlab', instanceUrl)) {
                alert('Please enter a valid GitLab repository URL');
                return;
            }
            
            // Parse the URL to get owner and repo
            const { owner, repo } = parseRepoUrl(url, 'gitlab', instanceUrl);
            
            if (!owner || !repo) {
                alert('Could not parse repository owner and name from URL. Please check the format.');
                return;
            }
            
            console.log(`Processing GitLab repository: ${owner}/${repo}`);
            
            // Start processing
            progressSection.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            sizeWarning.classList.add('hidden');
            tokenWarning.classList.add('hidden');
            
            // Update progress UI
            updateProgress(0, 1);
            currentFile.textContent = 'Analyzing repository...';
            
            // Configuration
            const config = {
                url: url,
                owner: owner,
                repo: repo,
                branch: branchNameInput.value.trim() || '',
                token: privateRepoCheckbox.checked ? gitlabTokenInput.value.trim() : '',
                instanceUrl: instanceUrl
            };
            
            // Process repository
            try {
                await processRepository('gitlab', config);
            } catch (error) {
                console.error('Error processing GitLab repository:', error);
                alert(`Error processing repository: ${error.message}`);
                progressSection.classList.add('hidden');
            }
        });
    }

    async function processRepository(type, config) {
        const { owner, repo, instanceUrl } = config;
        const branchName = config.branch;
        const isPrivate = privateRepoCheckbox ? privateRepoCheckbox.checked : false;
        
        // Get token based on type
        const token = isPrivate ? (type === 'github' ? 
            document.getElementById('githubToken')?.value.trim() : 
            document.getElementById('gitlabToken')?.value.trim()) : '';
        
        // Reset state
        window.processedText = '';
        window.processedFilesCount = 0;
        window.totalFilesToProcess = 0;
        window.isProcessingCancelled = false;
        window.gitignorePatterns = [];
        
        // Initialize API variables
        let apiBaseUrl, apiRepoUrl, apiTreeUrl;
        let repoInfo = null; // Store repository info for use throughout this function
        const headers = new Headers();

        // GitLab requires special handling for project IDs that contain slashes
        let numericProjectId = '';

        // Configure API endpoints and headers based on repository type
        if (type === 'github') {
            apiBaseUrl = 'https://api.github.com';
            apiRepoUrl = `${apiBaseUrl}/repos/${owner}/${repo}`;
            apiTreeUrl = `${apiRepoUrl}/git/trees/${branchName || 'main'}?recursive=1`;
            
            if (token) {
                headers.append('Authorization', `token ${token}`);
            }
        } else {
            // For GitLab
            apiBaseUrl = instanceUrl || 'https://gitlab.com';
            const encodedOwnerRepo = encodeURIComponent(`${owner}/${repo}`);
            
            // Set up headers
            headers.append('Accept', 'application/json');
            if (token) {
                headers.append('PRIVATE-TOKEN', token);
            }
            
            try {
                // First try to get the project by path
                const searchUrl = `${apiBaseUrl}/api/v4/projects?search=${repo}`;
                console.log('Searching GitLab projects:', searchUrl);
                
                const searchResponse = await fetch(searchUrl, { headers });
                
                if (!searchResponse.ok) {
                    throw new Error(`GitLab API error: ${searchResponse.status}`);
                }
                
                const projects = await searchResponse.json();
                console.log('GitLab projects found:', projects.length);
                
                // Find the matching project
                const fullPath = `${owner}/${repo}`;
                const project = projects.find(p => {
                    return p.path_with_namespace.toLowerCase() === fullPath.toLowerCase();
                });
                
                if (!project) {
                    // Try alternative search using the repository name only
                    console.log('Project not found by exact path, searching by name only');
                    const altProject = projects.find(p => {
                        return p.path.toLowerCase() === repo.toLowerCase() || 
                               p.name.toLowerCase() === repo.toLowerCase();
                    });
                    
                    if (!altProject) {
                        throw new Error('GitLab project not found. Please check the URL and try again.');
                    }
                    
                    numericProjectId = altProject.id;
                    console.log(`Found project by name: ${altProject.path_with_namespace} (ID: ${numericProjectId})`);
                } else {
                    numericProjectId = project.id;
                    console.log(`Found project by path: ${project.path_with_namespace} (ID: ${numericProjectId})`);
                }
                
                // Use numeric ID for all subsequent API calls
                apiRepoUrl = `${apiBaseUrl}/api/v4/projects/${numericProjectId}`;
                
                // Get repository information to determine the default branch
                const repoInfoResponse = await fetch(apiRepoUrl, { headers });
                if (!repoInfoResponse.ok) {
                    throw new Error(`Failed to fetch GitLab project info: ${repoInfoResponse.status}`);
                }
                
                // Store repository information for later use
                repoInfo = await repoInfoResponse.json();
                console.log('GitLab repository info:', repoInfo);
                
                // Check if repository is empty
                if (repoInfo.empty_repo) {
                    throw new Error('This GitLab repository is empty. There are no files to process.');
                }
                
                // Check if we have proper access
                if (repoInfo.visibility === 'private' && !token) {
                    throw new Error('This is a private GitLab repository. You need to provide a Personal Access Token to access it.');
                }
                
                // Determine the correct branch to use
                const actualBranch = branchName || repoInfo.default_branch || 'main';
                console.log(`Using branch: ${actualBranch} for GitLab project`);
                
                // Set up the URL for the files API endpoint
                apiTreeUrl = `${apiRepoUrl}/repository/files?ref=${actualBranch}&per_page=100`;
                
            } catch (error) {
                console.error('Error finding GitLab project:', error);
                throw error;
            }
        }

        // Fetch repository info for GitHub (already done for GitLab)
        if (type === 'github') {
            const repoResponse = await fetch(apiRepoUrl, { headers });
            
            if (!repoResponse.ok) {
                handleApiError(repoResponse, type);
                return;
            }
            
            repoInfo = await repoResponse.json();
        }
        
        // Check repository size
        const repoSizeInMB = type === 'github' ? 
            repoInfo.size / 1024 : 
            repoInfo.statistics?.repository_size / 1024 / 1024;
        
        if (repoSizeInMB > 100) {
            sizeWarning.classList.remove('hidden');
            document.getElementById('warning-title').textContent = 'Large Repository Detected';
            document.getElementById('warning-message').textContent = 
                `This repository is ${repoSizeInMB.toFixed(1)} MB in size, which exceeds recommended limits. Processing may take longer than usual.`;
        }

        // Get custom ignore patterns
        const ignorePatterns = document.getElementById('ignorePatterns')?.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            || [];

        // Fetch .gitignore if option is selected
        const respectGitignore = document.getElementById('respectGitignore')?.checked || false;
        if (respectGitignore) {
            window.gitignorePatterns = await fetchGitignore(owner, repo, headers, type, instanceUrl);
        }

        // Initial files array
        let files = [];

        // Fetch files based on repository type
        if (type === 'github') {
            // GitHub: Use the Git Trees API for better performance
            const treeResponse = await fetch(apiTreeUrl, { headers });
            
            if (!treeResponse.ok) {
                handleApiError(treeResponse, type);
                return;
            }
            
            const data = await treeResponse.json();
            
            // Filter out directories and only get files
            files = data.tree
                .filter(item => item.type === 'blob')
                .map(item => ({
                    path: item.path,
                    type: item.type,
                    size: item.size || 0
                }));
        } else {
            // GitLab: Fetch files using pagination, as the API might limit results
            let page = 1;
            let moreFiles = true;
            
            if (apiTreeUrl.includes('/repository/files')) {
                // Using the files API endpoint
                while (moreFiles) {
                    const fileListUrl = `${apiTreeUrl}&page=${page}`;
                    console.log(`Fetching GitLab files page ${page}:`, fileListUrl);
                    
                    const filesResponse = await fetch(fileListUrl, { headers });
                    
                    if (!filesResponse.ok) {
                        if (filesResponse.status === 404 && page === 1) {
                            // Try the tree endpoint as a fallback
                            // Always use the default branch from repository info if available
                            const actualBranch = branchName || (repoInfo && repoInfo.default_branch) || 'main';
                            console.log(`Trying GitLab tree endpoint with branch: ${actualBranch}`);
                            
                            const treeUrl = `${apiRepoUrl}/repository/tree?recursive=true&ref=${actualBranch}&per_page=100`;
                            console.log('Falling back to tree endpoint:', treeUrl);
                            
                            const treeResponse = await fetch(treeUrl, { headers });
                            
                            if (!treeResponse.ok) {
                                handleApiError(treeResponse, type);
                                return;
                            }
                            
                            const treeItems = await treeResponse.json();
                            files = treeItems
                                .filter(item => item.type === 'blob')
                                .map(item => item.path);
                            
                            window.totalFilesToProcess = files.length;
                            break;
                        } else {
                            handleApiError(filesResponse, type);
                            return;
                        }
                    }
                    
                    const filesList = await filesResponse.json();
                    
                    if (filesList.length === 0) {
                        moreFiles = false;
                    } else {
                        // Extract file paths from response
                        filesList.forEach(file => {
                            files.push(file.path);
                        });
                        
                        page++;
                    }
                }
            } else {
                // Using the tree API endpoint
                while (moreFiles) {
                    const treeUrl = `${apiTreeUrl}&page=${page}`;
                    const treeResponse = await fetch(treeUrl, { headers });
                    
                    if (!treeResponse.ok) {
                        handleApiError(treeResponse, type);
                        return;
                    }
                    
                    const treeItems = await treeResponse.json();
                    
                    if (treeItems.length === 0) {
                        moreFiles = false;
                    } else {
                        // Only include files (type: blob), not directories
                        treeItems
                            .filter(item => item.type === 'blob')
                            .forEach(item => {
                                files.push(item.path);
                            });
                        
                        page++;
                    }
                }
            }
            
            window.totalFilesToProcess = files.length;
        }

        // Filter and process files
        window.totalFilesToProcess = files.length;
        let processedFiles = [];
        let processedSize = 0;
        window.originalFiles = [...files]; // Store original files for filtering

        // Ensure all files are represented as strings (paths)
        const filePathsToProcess = files.map(file => {
            // If the file is already a string, use it directly
            if (typeof file === 'string') {
                return file;
            }
            // If it's an object with a path property (GitHub format), use the path
            else if (file && file.path) {
                return file.path;
            }
            // Fallback - this should not happen but just in case
            console.error('Unknown file format:', file);
            return null;
        }).filter(Boolean); // Remove any nulls

        // Exclude unwanted files
        const filesToProcess = filePathsToProcess.filter(file => {
            return isTextFile(file) && !shouldIgnoreFile(file, window.gitignorePatterns, ignorePatterns);
        });

        window.totalFilesToProcess = filesToProcess.length;
        
        // Update UI with total files
        document.getElementById('resultStats').textContent = `Total files: ${filesToProcess.length}`;

        // Process each file
        for (let i = 0; i < filesToProcess.length && !window.isProcessingCancelled; i++) {
            const file = filesToProcess[i];
            
            // Update progress
            updateProgress(i + 1, filesToProcess.length);
            currentFile.textContent = `Processing: ${file}`;
            
            // Skip binary files and files matched by ignore patterns
            if (!isTextFile(file) || shouldIgnoreFile(file, window.gitignorePatterns, ignorePatterns)) {
                continue;
            }
            
            // Get file content URL
            let fileUrl = '';
            
            if (type === 'github') {
                // For GitHub, we need to use the raw content URL and ensure proper branch name
                const actualBranch = branchName || (repoInfo && repoInfo.default_branch) || 'main';
                fileUrl = `${apiRepoUrl}/contents/${encodeURIComponent(file)}?ref=${actualBranch}`;
                console.log(`Fetching GitHub file: ${file} from branch: ${actualBranch}`);
            } else {
                // Use numeric ID for GitLab API calls and make sure to use the correct branch
                const actualBranch = branchName || (repoInfo && repoInfo.default_branch) || 'main';
                fileUrl = `${apiBaseUrl}/api/v4/projects/${numericProjectId}/repository/files/${encodeURIComponent(file)}/raw?ref=${actualBranch}`;
                console.log(`Fetching GitLab file: ${file} from branch: ${actualBranch}`);
            }
            
            try {
                // Get file content
                const content = await fetchFileContent(fileUrl, headers);
                
                if (content !== null) {
                    const fileInfo = {
                        path: file,
                        content: content,
                        size: content.length
                    };
                    processedFiles.push(fileInfo);
                    processedSize += content.length;
                    window.processedFilesCount++;
                    
                    // Format the processed text
                    const processedText = processFileContent(content, file);
                    window.processedText += processedText;
                }
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }

        // Hide progress and show results
        progressSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Check if we hit token limit
        const checkModel = getModelLimits();
        if (checkModel.tokenCount > checkModel.tokenLimit) {
            tokenWarning.classList.remove('hidden');
            tokenWarningStats.textContent = `Estimated tokens: ${formatNumber(checkModel.tokenCount)} / Model limit: ${formatNumber(checkModel.tokenLimit)}`;
            
            // Handle token warning interactions
            tokenWarningContinue.onclick = function() {
                tokenWarning.classList.add('hidden');
                displayResult();
            };
            
            tokenWarningCancel.onclick = function() {
                tokenWarning.classList.add('hidden');
            };
        } else {
            displayResult();
        }
        
        // Update statistics
        updateStats();
    }

    async function fetchFileContent(url, headers) {
        try {
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.warn(`Failed to fetch content from ${url}, status: ${response.status}`);
                return null;
            }
            
            // Check if response is GitHub API (JSON) or raw file content (GitLab)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                // GitHub API response
                try {
                    const data = await response.json();
                    
                    // Check if the file is too large or binary (GitHub API returns different data structure)
                    if (data.encoding === 'base64' && data.content) {
                        // GitHub content is base64 encoded
                        return atob(data.content.replace(/\n/g, ''));
                    } else if (data.message && data.message.includes('too large')) {
                        console.warn('File is too large for GitHub API:', url);
                        return `[File content too large to fetch via API]`;
                    } else if (data.message && data.message.includes('This file is binary')) {
                        console.warn('Binary file detected:', url);
                        return null;
                    } else {
                        console.warn('Unexpected GitHub API response:', data);
                        return null;
                    }
                } catch (error) {
                    console.error('Error parsing GitHub JSON response:', error);
                    return null;
                }
            } else {
                // Raw file content (GitLab)
                return await response.text();
            }
        } catch (error) {
            console.error('Error fetching file content:', error);
            return null;
        }
    }

    function processFileContent(content, filepath) {
        const pattern = outputPatternInput.value || '// File: {path}{filename}{newline}{content}{newline}{newline}';
        const filename = filepath.split('/').pop();
        const path = filepath.split('/').slice(0, -1).join('/');
        const pathWithSlash = path ? path + '/' : '';
        const stripComments = document.getElementById('stripComments')?.checked || false;
        
        // Get file extension
        const extension = filepath.split('.').pop().toLowerCase();
        
        // Process content (strip comments if enabled)
        let processedContent = content;
        if (stripComments) {
            processedContent = window.stripComments(content, extension);
        }
        
        return pattern
            .replace(/{path}/g, pathWithSlash)
            .replace(/{filename}/g, filename)
            .replace(/{content}/g, processedContent)
            .replace(/{newline}/g, '\n');
    }

    function isTextFile(filename) {
        // Common binary file extensions
        const binaryExtensions = [
            'apk', 'app', 'bin', 'class', 'com', 'dat', 'db', 'dbf', 'dll', 'dmg', 'dmp', 'ear', 'exe', 
            'gif', 'gzip', 'jar', 'jpg', 'jpeg', 'o', 'obj', 'pdf', 'png', 'pyc', 'pyd', 'so', 'tar', 
            'war', 'zip', 'ico', 'bmp', 'mp3', 'mp4', 'avi', 'mov', 'flv', 'wmv', 'wma', 'webm', 'webp', 
            'woff', 'woff2', 'ttf', 'eot', 'otf', 'gz', 'tgz', '7z', 'rar', 'svg', 'iso'
        ];

        // Defensive programming - make sure filename is a string
        if (!filename || typeof filename !== 'string') {
            console.error('Invalid filename provided to isTextFile:', filename);
            return true; // Default to treating as text file if unsure
        }

        // Get file extension
        const parts = filename.split('.');
        const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
        
        return !binaryExtensions.includes(extension);
    }

    // Function to strip comments from code (to save tokens)
    window.stripComments = function(content, extension) {
        if (!extension) return content;
        
        // Language-specific comment patterns
        const commentPatterns = {
            // Single line, multi-line start, multi-line end
            'js': ['//', '/*', '*/'],
            'py': ['#', '"""', '"""'],
            'rb': ['#', '=begin', '=end'],
            'java': ['//', '/*', '*/'],
            'c': ['//', '/*', '*/'],
            'cpp': ['//', '/*', '*/'],
            'cs': ['//', '/*', '*/'],
            'php': ['//', '/*', '*/'],
            'swift': ['//', '/*', '*/'],
            'go': ['//', '/*', '*/'],
            'ts': ['//', '/*', '*/'],
            'jsx': ['//', '/*', '*/'],
            'tsx': ['//', '/*', '*/'],
            'html': ['<!--', '<!--', '-->'],
            'xml': ['<!--', '<!--', '-->'],
            'css': ['', '/*', '*/'],
            'scss': ['//', '/*', '*/'],
            'less': ['//', '/*', '*/'],
            'sh': ['#', '', ''],
            'bash': ['#', '', ''],
            'zsh': ['#', '', ''],
            'ps1': ['#', '<#', '#>'],
            'sql': ['--', '/*', '*/'],
            'rust': ['//', '/*', '*/'],
            'kotlin': ['//', '/*', '*/'],
            'dart': ['//', '/*', '*/'],
            'r': ['#', '', '']
        };
        
        // Map file extensions to language
        const extensionMap = {
            'js': 'js', 'jsx': 'jsx', 'ts': 'ts', 'tsx': 'tsx',
            'py': 'py', 'pyc': 'py',
            'rb': 'rb',
            'java': 'java',
            'c': 'c', 'h': 'c',
            'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'hpp': 'cpp',
            'cs': 'cs',
            'php': 'php',
            'swift': 'swift',
            'go': 'go',
            'html': 'html', 'htm': 'html',
            'xml': 'xml',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'sh': 'sh', 'bash': 'bash', 'zsh': 'zsh',
            'ps1': 'ps1',
            'sql': 'sql',
            'rs': 'rust',
            'kt': 'kotlin',
            'dart': 'dart',
            'r': 'r'
        };
        
        const lang = extensionMap[extension.toLowerCase()];
        if (!lang || !commentPatterns[lang]) {
            return content; // Unknown language, return original content
        }
        
        const [singleLine, multiStart, multiEnd] = commentPatterns[lang];
        
        // Simple comment stripping (not perfect but good enough for most cases)
        let stripped = content;
        
        // Remove single-line comments
        if (singleLine) {
            const singleLineRegex = new RegExp(`${singleLine}.*?$`, 'gm');
            stripped = stripped.replace(singleLineRegex, '');
        }
        
        // Remove multi-line comments
        if (multiStart && multiEnd) {
            const multiLineRegex = new RegExp(`${multiStart}[\\s\\S]*?${multiEnd}`, 'g');
            stripped = stripped.replace(multiLineRegex, '');
        }
        
        // Remove empty lines
        stripped = stripped.replace(/^\s*[\r\n]/gm, '');
        
        return stripped;
    };

    function updateProgress(current, total) {
        if (progressBar) {
            const percentage = Math.round((current / total) * 100);
            progressBar.style.width = `${percentage}%`;
        }
    }

    function displayResult() {
        resultTextarea.value = window.processedText;
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function getModelLimits() {
        const modelSelect = document.getElementById('model-select');
        if (!modelSelect) return { tokenLimit: 128000, charLimit: 448000 };

        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const tokenLimit = parseInt(selectedOption.dataset.tokens || '128000');
        const charLimit = parseInt(selectedOption.dataset.chars || '448000');
        
        return { tokenLimit, charLimit };
    }

    function updateStats() {
        if (!resultStats) return;
        
        const fileCount = window.processedFilesCount;
        const charCount = window.processedText.length;
        const tokenEstimate = Math.ceil(charCount / 4);  // Rough approximation
        
        // Get model-specific limits
        const { model, tokenCount, tokenLimit } = getModelLimits();
        
        // Format numbers for display
        const formattedFileCount = formatNumber(fileCount);
        const formattedCharCount = formatNumber(charCount);
        const formattedTokenCount = formatNumber(tokenEstimate);
        const formattedTokenLimit = formatNumber(tokenLimit);
        
        // Calculate percentage of token limit used
        const tokenPercentage = Math.round((tokenEstimate / tokenLimit) * 100);
        
        // Create color-coded token count based on percentage used
        let tokenClass = 'text-green-500 dark:text-green-400';
        if (tokenPercentage > 90) {
            tokenClass = 'text-red-500 dark:text-red-400 font-bold';
        } else if (tokenPercentage > 75) {
            tokenClass = 'text-orange-500 dark:text-orange-400';
        } else if (tokenPercentage > 50) {
            tokenClass = 'text-yellow-500 dark:text-yellow-400';
        }
        
        // Always use "Claude 3.7 Sonnet" as the model name regardless of what's selected
        const displayModelName = "Claude 3.7 Sonnet (200K tokens)";
        
        // Update stats HTML
        resultStats.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><span class="font-semibold">Files processed:</span> ${formattedFileCount}</p>
                    <p><span class="font-semibold">Characters:</span> ${formattedCharCount}</p>
                </div>
                <div>
                    <p><span class="font-semibold">Model:</span> ${displayModelName}</p>
                    <p>
                        <span class="font-semibold">Token estimate:</span> 
                        <span class="${tokenClass}">${formattedTokenCount} / ${formattedTokenLimit} (${tokenPercentage}%)</span>
                    </p>
                </div>
            </div>
        `;
        
        // Check if we need to show token warning
        if (tokenCount > tokenLimit && !tokenWarning.classList.contains('flex')) {
            tokenWarningStats.textContent = `Estimated tokens: ${formattedTokenCount} / Model limit: ${formattedTokenLimit}`;
        }
    }

    // Add copy to clipboard functionality
    if (copyResultButton) {
        copyResultButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(resultTextarea.value);
                
                // Provide visual feedback
                const originalText = copyResultButton.innerHTML;
                copyResultButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(() => {
                    copyResultButton.innerHTML = originalText;
                }, 2000);
            } catch (error) {
                console.error('Failed to copy text:', error);
                alert('Failed to copy text to clipboard');
            }
        });
    }

    // Listen for model settings loaded event
    document.addEventListener('modelSettingsLoaded', function() {
        console.log('Model settings loaded, rechecking platform');
        // Make sure the UI is synchronized with the current platform
        setActivePlatform(currentPlatform);
    });

    function handleApiError(response, type) {
        if (response.status === 404) {
            if (type === 'gitlab') {
                alert(`GitLab repository not found. This could be because:\n- The repository doesn't exist\n- The branch name is incorrect\n- You need authentication to access this repository\n\nPlease check your URL, branch name, and consider using a personal access token.`);
            } else {
                alert(`Repository not found. Please check the URL and make sure the repository exists.`);
            }
        } else if (response.status === 401 || response.status === 403) {
            alert(`Authentication error. Please check your ${type === 'gitlab' ? 'GitLab' : 'GitHub'} token.`);
        } else {
            alert(`API Error: ${response.status}. Please try again later.`);
        }
        
        progressSection.classList.add('hidden');
        throw new Error(`API Error: ${response.status}`);
    }

    function createFileTree(files) {
        const root = new FileNode('root', true);
        
        for (const file of files) {
            const pathParts = file.split('/');
            let current = root;
            
            // Build tree structure
            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!current.children.has(part)) {
                    current.children.set(part, new FileNode(part, true));
                }
                current = current.children.get(part);
            }
            
            // Add file node
            const fileName = pathParts[pathParts.length - 1];
            current.children.set(fileName, new FileNode(fileName, false));
        }
        
        return root;
    }

    function generateTreeHTML(node, prefix = '', isLast = true) {
        let html = '';
        
        if (node.name !== 'root') {
            html += `<div>`;
            html += `${prefix}${isLast ? '└── ' : '├── '}`;
            html += node.isDirectory ? 
                `<span class="font-semibold">${node.name}/</span>` : 
                `<span>${node.name}</span>`;
            html += `</div>`;
        }
        
        prefix += isLast ? '    ' : '│   ';
        
        const childEntries = [...node.children.entries()];
        childEntries.sort((a, b) => {
            // Sort directories before files
            if (a[1].isDirectory !== b[1].isDirectory) {
                return a[1].isDirectory ? -1 : 1;
            }
            // Then sort by name
            return a[0].localeCompare(b[0]);
        });
        
        for (let i = 0; i < childEntries.length; i++) {
            const [, childNode] = childEntries[i];
            const isLastChild = i === childEntries.length - 1;
            html += generateTreeHTML(childNode, prefix, isLastChild);
        }
        
        return html;
    }
});
