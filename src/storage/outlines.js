import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pregacao.outlines.v1';

export async function getAllOutlines() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) : [];
  } catch {
    return [];
  }
}

export async function getOutlineById(id) {
  const all = await getAllOutlines();
  return all.find((o) => String(o.id) === String(id));
}

export async function upsertOutline(outline) {
  const all = await getAllOutlines();
  let next;
  if (outline.id) {
    next = all.map((o) => (String(o.id) === String(outline.id) ? { ...o, topics: o.topics || [], ...outline } : o));
  } else {
    const newId = Date.now();
    next = [{ id: newId, createdAt: Date.now(), topics: [], ...outline }, ...all];
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function deleteOutline(id) {
  const all = await getAllOutlines();
  const next = all.filter((o) => String(o.id) !== String(id));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function seedIfEmpty() {
  const current = await getAllOutlines();
  if (current.length) return;
  const sample = [
    {
      id: Date.now(),
      title: 'Deus amou o mundo',
      passage: 'João 3:16',
      tags: ['amor', 'evangelho'],
      notes:
        '1) A origem do amor\n2) A prova do amor (dar)\n3) O propósito (salvação)\n\nAplicações: confie, receba, compartilhe.',
      topics: [
        {
          reference: 'João 3:16',
          book: 'john',
          chapter: 3,
          verse: 16,
          text: 'Porque Deus amou o mundo de tal maneira... (trecho)',
          translation: 'almeida',
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  await AsyncStorage.setItem(KEY, JSON.stringify(sample));
}

export async function addTopicToOutline(outlineId, topic) {
  const all = await getAllOutlines();
  const next = all.map((o) => {
    if (String(o.id) !== String(outlineId)) return o;
    const topics = Array.isArray(o.topics) ? o.topics.slice() : [];
    topics.unshift(topic);
    return { ...o, topics, updatedAt: Date.now() };
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function removeTopicFromOutline(outlineId, topicIndex) {
  const all = await getAllOutlines();
  const next = all.map((o) => {
    if (String(o.id) !== String(outlineId)) return o;
    const topics = Array.isArray(o.topics) ? o.topics.slice() : [];
    if (topicIndex >= 0 && topicIndex < topics.length) {
      topics.splice(topicIndex, 1);
    }
    return { ...o, topics, updatedAt: Date.now() };
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}


