import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import EditScreen from './src/screens/EditScreen';
import BibleScreen from './src/screens/BibleScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Bíblia">
        <Stack.Screen name="Bíblia" component={BibleScreen} />
        <Stack.Screen name="Esboços" component={HomeScreen} />
        <Stack.Screen name="Detalhes" component={DetailScreen} />
        <Stack.Screen name="Editar" component={EditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
