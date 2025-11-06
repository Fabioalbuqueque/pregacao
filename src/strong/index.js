import AsyncStorage from '@react-native-async-storage/async-storage';
import strongPT from './pt/strong_pt.json';

const MAP_KEY = 'pregacao.strong.wordmap.v1';

export function lookupStrongPT(code) {
  const key = (code || '').toUpperCase();
  const entry = strongPT[key] || null;
  return entry ? { code: key, ...entry } : null;
}

export async function getWordStrongMapping() {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setWordStrongMapping(word, code) {
  const map = await getWordStrongMapping();
  const w = (word || '').toLowerCase();
  const c = (code || '').toUpperCase();
  if (!w || !c) return;
  map[w] = c;
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export async function getMappedMeaning(word) {
  const map = await getWordStrongMapping();
  const w = (word || '').toLowerCase();
  const code = map[w];
  if (!code) return null;
  return lookupStrongPT(code);
}

export async function getWordStrongCode(word) {
  const map = await getWordStrongMapping();
  const w = (word || '').toLowerCase();
  return map[w] || null;
}


