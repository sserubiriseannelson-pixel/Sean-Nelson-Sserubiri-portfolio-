const root = document.documentElement;
const themeButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

// Start in dark mode; remember the visitor's choice in this browser.
const savedTheme = localStorage.getItem("sean-portfolio-theme");
if (savedTheme === "light") root.classList.add("light");
updateThemeButton();

function updateThemeButton() {
  const isLight = root.classList.contains("light");
  themeIcon.textContent = isLight ? "☾" : "☼";
  themeButton.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
}
themeButton.addEventListener("click", () => {
  root.classList.toggle("light");
  localStorage.setItem("sean-portfolio-theme", root.classList.contains("light") ? "light" : "dark");
  updateThemeButton();
});

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});
navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

// Reveal sections gently as they enter view, while respecting reduced-motion settings.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}
