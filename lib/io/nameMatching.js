// Emparejamiento de nombres de un archivo importado con los jugadores de la plantilla.
// Sin alias '@/' para poder probarlo con `node --test`.
import { slugify, playerFullName } from '../utils.js';

export function normalizeName(value) {
  return slugify(value, ' ');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}

// Dos palabras de un nombre se consideran la misma si son iguales, si una abrevia a la otra
// ("Javi"/"Javier") o si solo difieren en una errata ("Elliot"/"Elliott", "Dimitresky"/"Dimitrevski").
function tokensMatch(a, b) {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = shorter === a ? b : a;
  if (shorter.length >= 4 && longer.startsWith(shorter)) return true;
  if (shorter.length < 5) return false;
  return levenshtein(a, b) <= (shorter.length >= 8 ? 2 : 1);
}

export function partialCandidates(groupName, players) {
  const groupTokens = String(groupName || '').split(' ').filter((token) => token.length > 2);
  if (!groupTokens.length) return [];

  const has = (tokens, token) => tokens.some((other) => tokensMatch(token, other));

  return players
    .map((player) => {
      const playerTokens = normalizeName(playerFullName(player)).split(' ').filter((token) => token.length > 2);
      if (!playerTokens.length) return null;
      const groupInsidePlayer = groupTokens.every((token) => has(playerTokens, token));
      const playerInsideGroup = playerTokens.every((token) => has(groupTokens, token));
      const sharedTokens = groupTokens.filter((token) => has(playerTokens, token)).length;
      const matches = groupInsidePlayer || playerInsideGroup || sharedTokens >= Math.min(2, groupTokens.length);
      return matches ? { player, sharedTokens, exactShared: groupTokens.filter((t) => playerTokens.includes(t)).length } : null;
    })
    .filter(Boolean)
    // Primero los que comparten más palabras (y más palabras idénticas, no aproximadas).
    .sort((a, b) => b.sharedTokens - a.sharedTokens || b.exactShared - a.exactShared)
    .slice(0, 8)
    .map(({ player }) => player);
}
