// Load header component
document.addEventListener('DOMContentLoaded', async function() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    try {
        const response = await fetch('../components/header.html');
        if (!response.ok) throw new Error(`Failed to load header`);
        headerContainer.innerHTML = await response.text();
    } catch (error) {
        console.error('Error loading header:', error);
        headerContainer.innerHTML = `
            <header class="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-baseline gap-3">
                            <a href="index.html" class="text-2xl font-bold text-[#24292f] dark:text-[#c9d1d9] hover:underline">nrepo</a>
                            <span class="text-[#57606a] dark:text-[#8b949e]">Prepare source code for LLMs</span>
                        </div>
                        <div class="flex items-center gap-6">
                            <a href="index.html" class="text-[#24292f] dark:text-[#c9d1d9] hover:text-[#2da44e] dark:hover:text-[#2da44e]">Upload Files</a>
                            <a href="repo.html" class="text-[#24292f] dark:text-[#c9d1d9] hover:text-[#2da44e] dark:hover:text-[#2da44e]">GitHub Repo</a>
                            <a href="privacy.html" class="text-[#24292f] dark:text-[#c9d1d9] hover:text-[#2da44e] dark:hover:text-[#2da44e]">Privacy</a>
                            <button onclick="toggleTheme()" class="theme-toggle p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] hover:bg-gray-200 dark:hover:bg-[#30363d] focus:outline-none focus:ring-2 focus:ring-[#2da44e]">
                                <svg class="dark-icon w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                                </svg>
                                <svg class="light-icon w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>`;
    }
});
