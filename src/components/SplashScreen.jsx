import { getAssetUrl } from '../utils/assets.js';

const maimonetLogo = getAssetUrl('logo_maimonet.png');

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Cargando votación">
      <div className="splash-content">
        <img src={maimonetLogo} alt="Maimonet" className="splash-logo" />
        <div className="splash-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p><strong>Maimonet</strong> te está redirigiendo a la votación del concurso...</p>
      </div>
    </main>
  );
}
