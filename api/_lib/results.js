import { charangas, emptyVoteMap } from './charangas.js';

export const buildResults = (votes) => {
  const normalizedVotes = {
    ...emptyVoteMap(),
    ...(votes || {})
  };
  const totalVotes = Object.values(normalizedVotes).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );
  const ranking = charangas
    .map((charanga) => {
      const voteCount = Number(normalizedVotes[charanga.id] || 0);
      return {
        ...charanga,
        votes: voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0
      };
    })
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

  return {
    totalVotes,
    votes: normalizedVotes,
    ranking,
    provisionalWinner: totalVotes > 0 ? ranking[0] : null
  };
};
