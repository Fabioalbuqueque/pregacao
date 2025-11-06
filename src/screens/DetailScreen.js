import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { getOutlineById, deleteOutline, removeTopicFromOutline } from '../storage/outlines';

export default function DetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [outline, setOutline] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await getOutlineById(id);
      setOutline(data);
    })();
  }, [id]);

  const reload = async () => {
    const data = await getOutlineById(id);
    setOutline(data);
  };

  if (!outline) {
    return (
      <View style={styles.center}> 
        <Text>Carregando...</Text>
      </View>
    );
  }

  const onDelete = async () => {
    if (Platform.OS === 'web') {
      // Simple confirm for web
      // eslint-disable-next-line no-alert
      const ok = window.confirm('Deseja excluir este esboço?');
      if (ok) {
        await deleteOutline(id);
        navigation.goBack();
      }
      return;
    }
    Alert.alert('Excluir', 'Deseja excluir este esboço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteOutline(id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{outline.title}</Text>
        {outline.passage ? <Text style={styles.passage}>{outline.passage}</Text> : null}
        {outline.tags?.length ? (
          <Text style={styles.tags}>{outline.tags.map((t) => `#${t}`).join(' ')}</Text>
        ) : null}
        {outline.notes ? <Text style={styles.notes}>{outline.notes}</Text> : null}
        {Array.isArray(outline.topics) && outline.topics.length ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Tópicos</Text>
            {outline.topics.map((tp, idx) => (
              <View key={`${tp.reference}-${idx}`} style={styles.topic}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.topicRef}>{tp.reference}</Text>
                  <TouchableOpacity
                    style={styles.topicDelete}
                    onPress={() => {
                      const doDelete = async () => {
                        await removeTopicFromOutline(id, idx);
                        reload();
                      };
                      if (Platform.OS === 'web') {
                        // eslint-disable-next-line no-alert
                        if (window.confirm('Excluir este tópico?')) doDelete();
                      } else {
                        Alert.alert('Excluir tópico', 'Deseja excluir este tópico?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Excluir', style: 'destructive', onPress: doDelete },
                        ]);
                      }
                    }}
                  >
                    <Text style={styles.topicDeleteText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                {tp.text ? <Text style={styles.topicText}>{tp.text}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => navigation.navigate('Editar', { id })}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => navigation.navigate('Bíblia', { outlineId: id })}>
          <Text style={styles.btnText}>Adicionar verso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.danger]} onPress={onDelete}>
          <Text style={styles.btnText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  passage: { color: '#666', marginBottom: 8 },
  tags: { color: '#888', marginBottom: 12 },
  notes: { fontSize: 16, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#0a7ea4' },
  secondary: { backgroundColor: '#2c3e50' },
  danger: { backgroundColor: '#c0392b' },
  btnText: { color: '#fff', fontWeight: '600' },
  topic: { paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  topicRef: { color: '#0a7ea4', fontWeight: '700', marginBottom: 4 },
  topicText: { color: '#333' },
  topicDelete: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#c0392b', borderRadius: 6 },
  topicDeleteText: { color: '#fff', fontWeight: '700' },
});


