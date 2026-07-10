import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import adminConfig from '../config/adminConfig.json';
import { charangas } from '../data/charangas.js';
import { voteService } from '../services/voteService.js';

const REFRESH_INTERVAL_MS = 4000;

export default function AdminPage({ theme, onToggleTheme }) {
  const adminPassword = adminConfig.adminPassword;
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [results, setResults] = useState(() => voteService.getInitialResults());
  const [auditEntries, setAuditEntries] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [adminNotice, setAdminNotice] = useState('');
  const isTestMode = voteService.isTestMode();

  const passwordConfigured = isTestMode ? Boolean(adminPassword) : true;

  const winnerText = useMemo(() => {
    if (!results.provisionalWinner) {
      return 'Sin votos todavía';
    }

    return `${results.provisionalWinner.name} (${results.provisionalWinner.votes} votos)`;
  }, [results.provisionalWinner]);

  const refreshResults = async (adminPasswordOverride = password) => {
    const [nextResults, nextAuditEntries] = await Promise.all([
      voteService.getResults(),
      voteService.getAuditEntries(adminPasswordOverride)
    ]);

    setResults(nextResults);
    setAuditEntries(nextAuditEntries);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshResults();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!passwordConfigured) {
      setAuthError('Configura adminPassword en src/config/adminConfig.json.');
      return;
    }

    const passwordIsValid = isTestMode
      ? password === adminPassword
      : await voteService.verifyAdminPassword(password);

    if (passwordIsValid) {
      setIsAuthenticated(true);
      setAuthError('');
      setAdminNotice('');
      await refreshResults(password);
      return;
    }

    setAuthError('Contraseña incorrecta.');
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    setResults(await voteService.resetVotes(password));
    setAuditEntries(await voteService.getAuditEntries(password));
    setLastUpdated(new Date());
    setShowResetModal(false);
    setAdminNotice('Votos reseteados correctamente.');
  };

  const getCharangaName = (charangaId) => {
    return charangas.find((charanga) => charanga.id === charangaId)?.name || charangaId;
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-login-page">
        <div className="login-theme-action">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <section className="admin-login-panel">
          <p className="eyebrow">Administración</p>
          <h1>Resultados del concurso</h1>
          <form onSubmit={handleSubmit} className="admin-form">
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Introduce la contraseña"
            />
            <button type="submit">Entrar</button>
          </form>
          {authError && (
            <div className="notice notice-warning" role="alert">
              {authError}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-title-block">
          <p className="eyebrow">Panel privado</p>
          <h1>Resultados de votación</h1>
          <p className="admin-updated">Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}</p>
        </div>
        <div className="admin-header-side">
          <div className="admin-theme-action">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
          <div className="admin-actions">
            <button type="button" className="secondary-button" onClick={() => refreshResults()}>
              Refrescar
            </button>
            <button type="button" className="danger-button" onClick={handleReset}>
              Resetear votos
            </button>
          </div>
        </div>
      </header>

      {adminNotice && (
        <div className="notice notice-success" role="status">
          {adminNotice}
        </div>
      )}

      <section className="stats-grid" aria-label="Resumen de resultados">
        <article className="stat-card">
          <div className="stat-card-heading">
            <span>Total de votos</span>
            <button
              type="button"
              className="info-button"
              onClick={() => setShowAudit((isVisible) => !isVisible)}
              aria-expanded={showAudit}
            >
              i
            </button>
          </div>
          <strong>{results.totalVotes}</strong>
          <small>{auditEntries.length} registros de auditoría</small>
        </article>
        <article className="stat-card stat-card-wide">
          <span>Ganadora provisional</span>
          <strong>{winnerText}</strong>
        </article>
      </section>

      {showAudit && (
        <section className="audit-panel" aria-labelledby="audit-title">
          <div className="section-heading">
            <h2 id="audit-title">Auditoría de votos</h2>
            <span>Datos disponibles del dispositivo</span>
          </div>
          <p className="audit-note">
            Los votos se validan en backend con ubicación GPS y se guardan en la base de datos
            configurada para la API.
          </p>
          <div className="audit-list">
            {auditEntries.length === 0 ? (
              <p className="audit-empty">Aún no hay registros de auditoría.</p>
            ) : (
              auditEntries.slice(0, 20).map((entry) => (
                <article className="audit-row" key={entry.id}>
                  <div>
                    <strong>{getCharangaName(entry.charangaId)}</strong>
                    <span>{new Date(entry.votedAt).toLocaleString('es-ES')}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>IP</dt>
                      <dd>{entry.ip || 'IP no disponible'}</dd>
                    </div>
                    <div>
                      <dt>Zona</dt>
                      <dd>Quintanar del Rey</dd>
                    </div>
                    <div>
                      <dt>Pantalla</dt>
                      <dd>{entry.screen}</dd>
                    </div>
                    <div>
                      <dt>Idioma</dt>
                      <dd>{entry.language}</dd>
                    </div>
                    <div>
                      <dt>Dispositivo</dt>
                      <dd>{entry.platform}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      <section className="ranking-panel" aria-labelledby="ranking-title">
        <div className="section-heading">
          <h2 id="ranking-title">Ranking</h2>
          <span>Mayor a menor</span>
        </div>

        <div className="ranking-list">
          {results.ranking.map((charanga, index) => (
            <article className="ranking-row" key={charanga.id}>
              <div className="ranking-position">{index + 1}</div>
              <div className="ranking-main">
                <div className="ranking-copy">
                  <h3>{charanga.name}</h3>
                  <p>
                    {charanga.votes} votos · {charanga.percentage}%
                  </p>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${charanga.percentage}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showResetModal && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            <p className="eyebrow">Acción peligrosa</p>
            <h2 id="reset-modal-title">Resetear votos</h2>
            <p>
              Cuidado: vas a borrar todos los votos y los registros de auditoría. No podrás
              recuperar estos datos después.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResetModal(false)}
              >
                Cancelar
              </button>
              <button type="button" className="danger-button" onClick={confirmReset}>
                Sí, resetear
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
