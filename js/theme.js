// Add theme-specific styles
const style = document.createElement('style');
style.textContent = `
  .dark-icon { display: var(--dark-icon-display, block); }
  .light-icon { display: var(--light-icon-display, none); }
  .dark .dark-icon { display: var(--dark-icon-display, none); }
  .dark .light-icon { display: var(--light-icon-display, block); }
`;
document.head.appendChild(style);

// Initialize theme
if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// Theme toggle function
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}
