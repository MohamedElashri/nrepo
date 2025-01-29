document.addEventListener('DOMContentLoaded', async function() {
    // Get base URL for the site
    const baseUrl = window.location.pathname.includes('/nrepo/') ? '/nrepo' : '';

    // Load header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const response = await fetch(`${baseUrl}/components/header.html`);
            if (!response.ok) throw new Error(`Failed to load header`);
            headerContainer.innerHTML = await response.text();
        } catch (error) {
            console.error('Error loading header:', error);
            headerContainer.innerHTML = `
                <header class="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
                    <div class="container mx-auto px-4 py-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-baseline gap-3">
                                <a href="${baseUrl}/index.html" class="text-2xl font-bold text-[#24292f] dark:text-[#c9d1d9] hover:underline">nrepo</a>
                            </div>
                        </div>
                    </div>
                </header>`;
        }
    }

    // Load footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        try {
            const response = await fetch(`${baseUrl}/components/footer.html`);
            if (!response.ok) throw new Error(`Failed to load footer`);
            footerContainer.innerHTML = await response.text();
        } catch (error) {
            console.error('Error loading footer:', error);
            footerContainer.innerHTML = `
                <footer class="bg-[#f6f8fa] dark:bg-[#161b22] py-4">
                    <div class="container mx-auto px-4 text-center text-[#24292f] dark:text-[#c9d1d9]">
                        <p>&copy; ${new Date().getFullYear()} nrepo. All rights reserved.</p>
                    </div>
                </footer>`;
        }
    }
});
