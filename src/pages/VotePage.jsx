import { useEffect, useState } from 'react';
import CharangaCard from '../components/CharangaCard.jsx';
import Header from '../components/Header.jsx';
import { charangas } from '../data/charangas.js';
import { voteService } from '../services/voteService.js';

export default function VotePage({ theme, onToggleTheme }) {
  const [deviceVote, setDeviceVote] = useState(null);
  const [message, setMessage] = useState('');
  const isTestMode = voteService.isTestMode();

  useEffect(() => {
    const storedVote = voteService.getDeviceVote();
    setDeviceVote(storedVote);
    if (!isTestMode && storedVote) {
      setMessage('Ya has votado en este concurso.');
    }
  }, [isTestMode]);

  const handleVote = (charangaId) => {
    const response = voteService.vote(charangaId);

    if (response.ok) {
      const storedVote = voteService.getDeviceVote();
      setDeviceVote(storedVote);
      setMessage(
        isTestMode
          ? 'Modo test activo: voto registrado. Puedes votar de nuevo.'
          : '¡Gracias por votar! Tu voto ha sido registrado.'
      );
      return;
    }

    if (response.reason === 'already-voted') {
      setDeviceVote(voteService.getDeviceVote());
      setMessage('Ya has votado en este concurso.');
    }
  };

  return (
    <div className="app-shell">
      <main className="page">
        <Header theme={theme} onToggleTheme={onToggleTheme} />

        <section className="intro-section" aria-labelledby="vote-intro">
          <p id="vote-intro">Vota tu charanga favorita. Solo se permite un voto por persona.</p>
          {isTestMode && (
            <div className="notice notice-test" role="status">
              Modo test activo: los votos se suman, pero este dispositivo no queda bloqueado.
            </div>
          )}
          {message && (
            <div className={`notice ${deviceVote ? 'notice-success' : ''}`} role="status">
              {message}
            </div>
          )}
        </section>

        <section className="cards-grid" aria-label="Charangas participantes">
          {charangas.map((charanga) => (
            <CharangaCard
              key={charanga.id}
              charanga={charanga}
              disabled={!isTestMode && Boolean(deviceVote)}
              selected={!isTestMode && deviceVote?.charangaId === charanga.id}
              onVote={handleVote}
            />
          ))}
        </section>
      </main>

      <footer className="site-footer">
        <span>Desarrollado por </span>
        <a href="https://www.maimonet.es" target="_blank" rel="noreferrer">
          Maimonet
        </a>
        <span>. © {new Date().getFullYear()} Maimonet. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}
