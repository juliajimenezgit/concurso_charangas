export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={onToggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
    >
      <span className="theme-icon theme-icon-sun" aria-hidden="true">
        ☀
      </span>
      <span className="theme-icon theme-icon-moon" aria-hidden="true">
        ☾
      </span>
    </button>
  );
}
