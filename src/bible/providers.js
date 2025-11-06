import { Platform } from 'react-native';

async function fetchWithCorsFallback(url) {
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (_) {}
  // Fallback via simple CORS proxy for Web only
  if (Platform.OS === 'web') {
    try {
      const proxied = 'https://cors.isomorphic-git.org/' + url;
      const res2 = await fetch(proxied);
      if (res2.ok) return await res2.json();
    } catch (_) {}
  }
  throw new Error('fetch failed');
}
function normalizeVerses(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => {
      const verseNum = v.verse || v.number || v.verseNumber || v.verse_id || v.verseId;
      const text = (v.text || v.content || '').toString();
      if (!verseNum || !text) return null;
      return { verse: Number(verseNum), text };
    })
    .filter(Boolean)
    .sort((a, b) => a.verse - b.verse);
}

function mapTranslationForProvider(provider, code) {
  const c = (code || '').toLowerCase();
  // Map for deno provider
  const denoMap = {
    almeida: 'ra', // Almeida Revista e Atualizada
    ara: 'ra',
    acf: 'acf',
    nvi: 'nvi',
    ntlh: 'ntlh',
    naa: 'naa',
    web: 'web',
    kjv: 'kjv',
  };
  // Map for bible-api.com (limited support; default to 'almeida')
  const bibleApiMap = {
    almeida: 'almeida',
    ara: 'almeida',
    acf: 'almeida',
    nvi: 'almeida',
    ntlh: 'almeida',
    naa: 'almeida',
    web: 'web',
    kjv: 'kjv',
  };
  if (provider === 'deno') return denoMap[c] || 'web';
  return bibleApiMap[c] || 'web';
}

export async function fetchFromBibleApiDotCom(slug, chapter, translation) {
  const tr = mapTranslationForProvider('bible-api', translation);
  const url = `https://bible-api.com/${slug}+${chapter}?translation=${tr}`;
  const json = await fetchWithCorsFallback(url);
  const verses = normalizeVerses(json.verses);
  return verses;
}

export async function fetchFromDenoBible(slug, chapter, translation) {
  // deno api expects path segments without spaces, lowercase
  const bookPath = decodeURIComponent(slug).replace(/\s+/g, '').toLowerCase();
  const candidateList = getDenoCandidates(translation);
  for (const trans of candidateList) {
    try {
      const url = `https://bible-api.deno.dev/api/verses/${trans}/${bookPath}/${chapter}`;
      const json = await fetchWithCorsFallback(url);
      const verses = normalizeVerses(json?.verses || json);
      if (verses.length) return verses;
    } catch (_) {}
  }
  return [];
}

function getDenoCandidates(code) {
  const c = (code || '').toLowerCase();
  // Try most likely PT-BR codes first for each family
  const byFamily = {
    almeida: ['naa', 'aa', 'ra', 'acf'],
    ara: ['ra', 'aa', 'naa', 'acf'],
    naa: ['naa', 'aa', 'ra'],
    acf: ['acf', 'aa', 'ra'],
    nvi: ['nvi'],
    ntlh: ['ntlh'],
  };
  if (byFamily[c]) return byFamily[c];
  // default fallbacks still PT first, then english only as last resort if explicitly requested
  return ['naa', 'aa', 'ra', 'acf'];
}

export async function fetchChapterNormalized(slug, chapter, translation) {
  // Strict PT-BR preference: try Deno PT-BR codes first, then bible-api Almeida
  const ptbrSet = ['almeida', 'ara', 'naa', 'acf', 'nvi', 'ntlh'];
  const ordered = Array.from(new Set([translation, ...ptbrSet]));
  for (const tr of ordered) {
    // Prefer Deno (mais coleções PT-BR)
    try {
      const v2 = await fetchFromDenoBible(slug, chapter, tr);
      if (Array.isArray(v2) && v2.length) return v2;
    } catch (_) {}
    // bible-api.com com Almeida quando aplicável
    try {
      const v1 = await fetchFromBibleApiDotCom(slug, chapter, tr);
      if (Array.isArray(v1) && v1.length) return v1;
    } catch (_) {}
  }
  return [];
}


