import { getAssetUrl } from '../utils/assets.js';
import ThemeToggle from './ThemeToggle.jsx';

const mascotPath = getAssetUrl('champi_logo.png');
const staffPath = getAssetUrl('fondo_pentagrama.png');
const whiteStaffPath = getAssetUrl('fondo_pentagrama_blanco.png');
const organizerLogos = [
  {
    src: getAssetUrl('eresmas_logo.png'),
    alt: 'Logo Charanga Eresmas',
    name: 'Charanga Eresmas',
    instagram: {
      handle: '@charangaeresmas',
      url: 'https://www.instagram.com/charangaeresmas/'
    }
  },
  {
    src: getAssetUrl('qtt_logo.png'),
    alt: 'Logo Charanga Qué te toco',
    name: 'Charanga Qué te toco',
    instagram: {
      handle: '@charangaquetetoco',
      url: 'https://www.instagram.com/charangaquetetoco/'
    }
  },
  {
    src: getAssetUrl('quintanar_logo.png'),
    alt: 'Escudo del Ayuntamiento de Quintanar del Rey',
    name: 'Ayuntamiento',
    wide: true,
    instagram: {
      handle: '@ayto_quintanardelrey',
      url: 'https://www.instagram.com/ayto_quintanardelrey/'
    }
  }
];

export default function Header({ theme, onToggleTheme }) {
  const staffBackground = theme === 'dark' ? whiteStaffPath : staffPath;

  return (
    <header className="site-header" style={{ '--staff-bg': `url(${staffBackground})` }}>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <div className="header-copy">
        <div className="header-topline">
          <p className="eyebrow">Concurso Charangas Quintanar del Rey</p>
        </div>
        <h1>II Concurso Nacional de Charangas</h1>
        <div className="organizer-block">
          <p className="subtitle">
            Organizado por Charanga Eresmas, Charanga Qué te toco y Ayuntamiento de Quintanar
            del Rey
          </p>
          <div className="organizer-logos" aria-label="Contacto de entidades organizadoras">
            {organizerLogos.map((logo) => (
              <div
                className={`organizer-card${logo.wide ? ' organizer-card-wide' : ''}`}
                key={logo.alt}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <span>{logo.name}</span>
                  {logo.instagram && (
                    <a href={logo.instagram.url} target="_blank" rel="noreferrer">
                      {logo.instagram.handle}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mascot-card" aria-label="Mascota del concurso">
        <img
          src={mascotPath}
          alt="Mascota champiñón del concurso"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            event.currentTarget.nextElementSibling.hidden = false;
          }}
        />
        <span className="mascot-fallback" hidden>
          CH
        </span>
      </div>
    </header>
  );
}
