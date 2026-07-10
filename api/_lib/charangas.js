export const charangas = [
  {
    id: 'escalafit',
    name: "Xaranga l'Esclafit",
    shortName: 'Esclafit'
  },
  {
    id: 'terreta',
    name: 'Xaranga La Terreta',
    shortName: 'La Terreta'
  },
  {
    id: 'tocapum',
    name: 'Xaranga TocaPum',
    shortName: 'TocaPum'
  },
  {
    id: 'cabezones',
    name: 'Charanga Los Cabezones',
    shortName: 'Los Cabezones'
  }
];

export const charangaIds = charangas.map((charanga) => charanga.id);

export const emptyVoteMap = () =>
  charangaIds.reduce((votes, charangaId) => {
    votes[charangaId] = 0;
    return votes;
  }, {});

export const isValidCharangaId = (charangaId) => charangaIds.includes(charangaId);
