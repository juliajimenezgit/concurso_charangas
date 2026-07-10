const assetUrls = import.meta.glob(
  [
    '../assets/champi_logo.png',
    '../assets/logo_maimonet.png',
    '../assets/fondo_pentagrama.png',
    '../assets/fondo_pentagrama_blanco.png',
    '../assets/eresmas_logo.png',
    '../assets/qtt_logo.png',
    '../assets/quintanar_logo.png',
    '../assets/escalafit_logo.png',
    '../assets/terreta_logo.png',
    '../assets/tocapum_logo.png',
    '../assets/cabezones_logo.png'
  ],
  {
    eager: true,
    query: '?url',
    import: 'default'
  }
);

export const getAssetUrl = (filename) => assetUrls[`../assets/${filename}`] || `/src/assets/${filename}`;
