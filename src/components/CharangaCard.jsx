export default function CharangaCard({ charanga, disabled, selected, onVote }) {
  return (
    <article className={`charanga-card ${selected ? 'is-selected' : ''}`}>
      <div className="logo-frame">
        <img
          src={charanga.logo}
          alt={`Logo de ${charanga.name}`}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            event.currentTarget.nextElementSibling.hidden = false;
          }}
        />
        <span className="logo-fallback" hidden>
          {charanga.shortName}
        </span>
      </div>

      <div className="card-content">
        <div className="card-copy">
          <h2>{charanga.name}</h2>
          {charanga.instagram && (
            <a
              className="instagram-link"
              href={charanga.instagram.url}
              target="_blank"
              rel="noreferrer"
            >
              {charanga.instagram.handle}
            </a>
          )}
        </div>
        <button type="button" onClick={() => onVote(charanga.id)} disabled={disabled}>
          {selected ? 'Votada' : 'Votar'}
        </button>
      </div>
    </article>
  );
}
