import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { getOutlineById, upsertOutline } from '../storage/outlines';

export default function EditScreen({ route, navigation }) {
  const id = route.params?.id ?? null;
  const initial = route.params?.initial ?? null;
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      if (id) {
        const data = await getOutlineById(id);
        if (data) {
          setTitle(data.title || '');
          setPassage(data.passage || '');
          setTags((data.tags || []).join(', '));
          setNotes(data.notes || '');
        }
      } else if (initial) {
        setTitle(initial.title || '');
        setPassage(initial.passage || '');
        setTags(initial.tags || '');
        setNotes(initial.notes || '');
      }
    })();
  }, [id]);

  const onSave = async () => {
    const payload = {
      id: id || undefined,
      title: title.trim() || 'Sem título',
      passage: passage.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes,
      updatedAt: Date.now(),
    };
    await upsertOutline(payload);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título do esboço" />

        <Text style={styles.label}>Passagem</Text>
        <TextInput style={styles.input} value={passage} onChangeText={setPassage} placeholder="Ex: João 3:16" />

        <Text style={styles.label}>Tags</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Separadas por vírgula" />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anotações do sermão..."
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.save} onPress={onSave}>
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
        {id ? (
          <TouchableOpacity style={[styles.save, { backgroundColor: '#2c3e50' }]} onPress={() => navigation.navigate('Bíblia', { outlineId: id })}>
            <Text style={styles.saveText}>Adicionar verso como tópico</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  multiline: {
    height: 180,
  },
  save: {
    marginTop: 20,
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
});


