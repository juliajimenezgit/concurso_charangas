import { useEffect, useState } from 'react';
import CharangaCard from '../components/CharangaCard.jsx';
import Header from '../components/Header.jsx';
import { charangas } from '../data/charangas.js';
import { voteService } from '../services/voteService.js';

export default function VotePage({ theme, onToggleTheme }) {
  const [deviceVote, setDeviceVote] = useState(null);
  const [message, setMessage] = useState('');
  const [locationAccess, setLocationAccess] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTestMode = voteService.isTestMode();

  useEffect(() => {
    let isActive = true;

    const loadDeviceVote = async () => {
      const storedVote = await voteService.getDeviceVote();

      if (!isActive) {
        return;
      }

      setDeviceVote(storedVote);
      if (!isTestMode && storedVote) {
        setMessage('Ya has votado en este concurso.');
      }
    };

    loadDeviceVote();

    return () => {
      isActive = false;
    };
  }, [isTestMode]);

  useEffect(() => {
    let isActive = true;

    const checkLocation = async () => {
      setLocationStatus('checking');
      const access = await voteService.getVotingAccess();

      if (!isActive) {
        return;
      }

      setLocationAccess(access);
      setLocationStatus(access.allowed ? 'allowed' : 'blocked');
    };

    checkLocation();

    return () => {
      isActive = false;
    };
  }, []);

  const handleVote = async (charangaId) => {
    if (!isTestMode && locationStatus !== 'allowed') {
      setMessage('');
      return;
    }

    setIsSubmitting(true);
    const response = await voteService.vote(charangaId, locationAccess);
    setIsSubmitting(false);

    if (response.ok) {
      const storedVote = await voteService.getDeviceVote();
      setDeviceVote(storedVote);
      setMessage(
        isTestMode
          ? 'Modo test activo: voto registrado. Puedes votar de nuevo.'
          : '¡Gracias por votar! Tu voto ha sido registrado.'
      );
      return;
    }

    if (response.reason === 'already-voted') {
      setDeviceVote(await voteService.getDeviceVote());
      setMessage('Ya has votado en este concurso.');
      return;
    }

    if (
      response.reason === 'outside-allowed-area' ||
      response.reason === 'location-required' ||
      response.reason === 'location-accuracy-too-low'
    ) {
      setMessage('');
      return;
    }

    if (response.reason === 'vote-service-unavailable') {
      setMessage('No se ha podido registrar el voto. Inténtalo de nuevo en unos segundos.');
    }
  };

  const locationNotice = (() => {
    if (isTestMode) {
      return null;
    }

    if (locationStatus === 'checking') {
      return {
        className: 'location-status-text',
        text: 'Permite la ubicación para comprobar que estás en Quintanar del Rey, CP 16220.'
      };
    }

    if (locationStatus === 'blocked') {
      const blockedMessages = {
        'location-permission-denied':
          'Necesitamos permiso de ubicación para permitir el voto desde Quintanar del Rey.',
        'location-unsupported': 'Este navegador no permite comprobar la ubicación.',
        'location-timeout': 'No se ha podido obtener tu ubicación a tiempo. Recarga e inténtalo de nuevo.',
        'location-accuracy-too-low':
          'La ubicación recibida no tiene precisión suficiente para validar el voto.',
        'location-check-failed':
          'No se ha podido comprobar tu ubicación. Por seguridad, la votación queda bloqueada.'
      };

      return {
        className: 'location-status-text',
        text:
          blockedMessages[locationAccess?.reason] ||
          'La votación solo está disponible desde Quintanar del Rey, CP 16220.'
      };
    }

    return null;
  })();

  const votingDisabled =
    isSubmitting ||
    (!isTestMode && (Boolean(deviceVote) || locationStatus !== 'allowed' || !locationAccess?.allowed));

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
          {locationNotice && (
            <div className={locationNotice.className} role="status">
              {locationNotice.text}
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
              disabled={votingDisabled}
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
