import * as FileSystem from 'expo-file-system';
import { fetchChapterNormalized } from './providers';

const ROOT = FileSystem.documentDirectory + 'bible-cache/';

async function ensureDirAsync(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function getChapterCachedOrFetch(slug, chapter, translation = 'almeida') {
  const base = ROOT + `${translation}/`;
  const dir = base + `${slug}/`;
  const file = dir + `${chapter}.json`;
  try {
    await ensureDirAsync(dir);
    const info = await FileSystem.getInfoAsync(file);
    if (info.exists) {
      const txt = await FileSystem.readAsStringAsync(file);
      try {
        const json = JSON.parse(txt);
        return json.verses || json || [];
      } catch {
        // fallthrough to refetch
      }
    }
  } catch (_) {
    // FileSystem unavailable; continue with network only
  }
  const verses = await fetchChapterNormalized(slug, chapter, translation);
  try {
    const payload = { verses };
    await FileSystem.writeAsStringAsync(file, JSON.stringify(payload));
  } catch (_) {
    // ignore write errors
  }
  return verses;
}


