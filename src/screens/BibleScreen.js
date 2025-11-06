import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import { BOOKS } from '../bible/books_full';
import { getChapterCachedOrFetch } from '../bible/offline';
import { TRANSLATIONS } from '../bible/translations';
import { getAllOutlines, addTopicToOutline } from '../storage/outlines';
import { getMappedMeaning } from '../strong';

async function fetchChapter(slug, chapter, translation) {
  return await getChapterCachedOrFetch(slug, chapter, translation);
}

export default function BibleScreen({ route, navigation }) {
  const outlineId = route.params?.outlineId ?? null;
  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [translationIdx, setTranslationIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [outlines, setOutlines] = useState([]);
  const [wordModal, setWordModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordMeaning, setWordMeaning] = useState(null);
  const [wordOrigin, setWordOrigin] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);

  const selectedBook = BOOKS[bookIdx];

  const load = async () => {
    try {
      setLoading(true);
      let data = await fetchChapter(selectedBook.slug, chapter, TRANSLATIONS[translationIdx].code);
      setVerses(Array.isArray(data) ? data : []);
    } catch (e) {
      // keep UI responsive
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookIdx, chapter, translationIdx]);

  const onSelectVerse = async (v) => {
    setSelected({
      verse: v.verse,
      text: v.text?.trim?.() || '',
    });
    try {
      const list = await getAllOutlines();
      setOutlines(list);
    } catch (_) {
      setOutlines([]);
    }
    setPickerVisible(true);
  };

  const onEdit = async () => {
    if (!selected) return;
    const ref = `${selectedBook.name} ${chapter}:${selected.verse} (${TRANSLATIONS[translationIdx].name})`;
    if (outlineId) {
      await addTopicToOutline(outlineId, {
        reference: ref,
        book: selectedBook.slug,
        chapter,
        verse: selected.verse,
        text: selected.text,
        translation: TRANSLATIONS[translationIdx].code,
        createdAt: Date.now(),
      });
      navigation.navigate('Editar', { id: outlineId });
      return;
    }
    navigation.navigate('Editar', {
      id: null,
      initial: {
        title: ref,
        passage: ref,
        tags: '',
        notes: selected.text,
      },
    });
  };

  const openPicker = async () => {
    try {
      const list = await getAllOutlines();
      setOutlines(list);
    } catch (_) {
      setOutlines([]);
    }
    setPickerVisible(true);
  };

  const addToExisting = async (outlineId) => {
    if (!selected) return;
    const ref = `${selectedBook.name} ${chapter}:${selected.verse} (${TRANSLATIONS[translationIdx].name})`;
    await addTopicToOutline(outlineId, {
      reference: ref,
      book: selectedBook.slug,
      chapter,
      verse: selected.verse,
      text: selected.text,
      translation: TRANSLATIONS[translationIdx].code,
      createdAt: Date.now(),
    });
    setPickerVisible(false);
    navigation.navigate('Editar', { id: outlineId });
  };

  const normalizeToken = (t) => {
    const base = (t || '').toString().trim().toLowerCase().replace(/[.,;:!?()\[\]"'“”‘’]/g, '');
    return base.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
  };

  const openWord = async (word) => {
    const baseWord = normalizeToken(word);
    setSelectedWord(baseWord || word);
    setWordMeaning(null);
    setWordOrigin(null);
    setWordModal(true);
    setWordLoading(true);
    try {
      // Try offline mapped origin (hebraico/aramaico/greco → PT)
      const mapped = await getMappedMeaning(baseWord || word);
      if (mapped) {
        setWordOrigin(mapped);
      }

      let res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/pt/${encodeURIComponent((baseWord || word).toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        const first = Array.isArray(json) && json[0];
        const defs = first?.meanings?.[0]?.definitions?.map((d) => d.definition) || [];
        if (defs.length) {
          setWordMeaning(defs.slice(0, 3));
          setWordLoading(false);
          return;
        }
      }
      // fallback to EN if PT empty
      res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent((baseWord || word).toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        const first = Array.isArray(json) && json[0];
        const defs = first?.meanings?.[0]?.definitions?.map((d) => d.definition) || [];
        if (defs.length) setWordMeaning(defs.slice(0, 3));
      }
    } catch (_) {
      // ignore
    }
    setWordLoading(false);
  };

  // Removed external search links: meanings appear directly on click in the modal

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Esboços')} style={{ paddingHorizontal: 8 }}>
          <Text style={{ color: '#0a7ea4', fontWeight: '700' }}>Ver Esboços</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FlatList
          data={TRANSLATIONS}
          horizontal
          keyExtractor={(t) => t.code}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.chip, index === translationIdx && styles.chipActive]}
              onPress={() => setTranslationIdx(index)}
            >
              <Text style={[styles.chipText, index === translationIdx && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={{ marginBottom: 6 }}
        />
        <FlatList
          data={BOOKS}
          horizontal
          keyExtractor={(item) => item.slug}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.chip, index === bookIdx && styles.chipActive]}
              onPress={() => {
                setBookIdx(index);
                setChapter(1);
              }}
            >
              <Text style={[styles.chipText, index === bookIdx && styles.chipTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.chapters}>
        <FlatList
          data={Array.from({ length: selectedBook.chapters }, (_, i) => i + 1)}
          keyExtractor={(i) => String(i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chapterBtn, item === chapter && styles.chapterBtnActive]}
              onPress={() => setChapter(item)}
            >
              <Text style={[styles.chapterText, item === chapter && styles.chapterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={verses}
            keyExtractor={(v) => String(v.verse)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.verse, selected?.verse === item.verse && styles.verseSelected]}
                onPress={() => onSelectVerse(item)}
              >
                <Text style={styles.verseNum}>{item.verse}</Text>
                <Text style={styles.verseText}>
                  {(item.text || item.content || '').trim().split(/(\s+)/).map((token, i) => {
                    if (/^\s+$/.test(token)) return token;
                    return (
                      <Text key={i} onPress={() => openWord(token)} style={styles.word}>
                        {token}
                      </Text>
                    );
                  })}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={!loading ? (
              <View style={{ padding: 16 }}>
                <Text style={{ textAlign: 'center', color: '#666' }}>Nenhum versículo encontrado.</Text>
                <Text style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>Tente outra tradução no topo ou outro capítulo.</Text>
              </View>
            ) : null}
          />
        )}
      </View>
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar versículo</Text>
            <Text style={styles.modalSub}>{selected ? `${selectedBook.name} ${chapter}:${selected.verse}` : ''}</Text>
            <TouchableOpacity style={[styles.modalBtn, styles.primary]} onPress={() => { setPickerVisible(false); onEdit(); }}>
              <Text style={styles.modalBtnText}>Criar novo esboço</Text>
            </TouchableOpacity>
            <FlatList
              data={outlines}
              keyExtractor={(o) => String(o.id)}
              style={{ maxHeight: 260, marginTop: 10 }}
              ListHeaderComponent={<Text style={{ fontWeight: '700', marginBottom: 6 }}>Adicionar a um esboço existente</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.outlineItem} onPress={() => addToExisting(item.id)}>
                  <Text numberOfLines={1} style={styles.outlineTitle}>{item.title || 'Sem título'}</Text>
                  {item.passage ? <Text numberOfLines={1} style={styles.outlinePassage}>{item.passage}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: '#666' }}>Nenhum esboço ainda.</Text>}
            />
            <TouchableOpacity style={[styles.modalBtn, styles.secondary]} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={wordModal} transparent animationType="fade" onRequestClose={() => setWordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Palavra</Text>
            <Text style={styles.modalSub}>{selectedWord}</Text>
            {/* Strong input removed: show meanings directly */}
            {wordLoading ? (
              <ActivityIndicator style={{ marginTop: 10 }} />
            ) : (
              <View style={{ marginTop: 10 }}>
                {wordMeaning?.length ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontWeight: '700', marginBottom: 6 }}>Português</Text>
                    {wordMeaning.map((m, idx) => (
                      <Text key={idx} style={{ marginBottom: 6 }}>• {m}</Text>
                    ))}
                  </View>
                ) : null}
                {wordOrigin ? (
                  <View>
                    <Text style={{ fontWeight: '700', marginBottom: 6 }}>Original ({wordOrigin.lang})</Text>
                    <Text style={{ marginBottom: 6 }}>{wordOrigin.lemma}</Text>
                    <Text style={{ marginBottom: 6 }}>{wordOrigin.sense}</Text>
                  </View>
                ) : null}
                {!wordMeaning?.length && !wordOrigin ? (
                  <Text style={{ color: '#666' }}>Sem definição encontrada.</Text>
                ) : null}
              </View>
            )}
            <TouchableOpacity style={[styles.modalBtn, styles.secondary, { marginTop: 12 }]} onPress={() => setWordModal(false)}>
              <Text style={styles.modalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0a7ea4' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  chapters: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  chapterBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#f5f5f5', marginRight: 6 },
  chapterBtnActive: { backgroundColor: '#0a7ea4' },
  chapterText: { color: '#333' },
  chapterTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  verse: { flexDirection: 'row', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  verseSelected: { backgroundColor: '#eef7fa' },
  verseNum: { width: 26, color: '#0a7ea4', fontWeight: '700', textAlign: 'right' },
  verseText: { flex: 1, color: '#222' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { color: '#666', marginTop: 4 },
  modalBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
  outlineItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  outlineTitle: { fontWeight: '600' },
  outlinePassage: { color: '#666' },
  word: { textDecorationLine: 'underline' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
});


