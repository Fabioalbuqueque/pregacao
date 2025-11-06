import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllOutlines, seedIfEmpty } from '../storage/outlines';

export default function HomeScreen({ navigation }) {
  const [outlines, setOutlines] = useState([]);

  const load = async () => {
    await seedIfEmpty();
    const data = await getAllOutlines();
    setOutlines(data);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detalhes', { id: item.id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      {item.passage ? <Text style={styles.sub}>{item.passage}</Text> : null}
      {item.tags?.length ? (
        <Text style={styles.tags}>{item.tags.map((t) => `#${t}`).join(' ')}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={outlines}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum esboço ainda.</Text>}
        contentContainerStyle={outlines.length ? undefined : { flex: 1, justifyContent: 'center' }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Editar', { id: null })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sub: { color: '#666' },
  tags: { marginTop: 6, color: '#888' },
  empty: { textAlign: 'center', color: '#666' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },
});


