import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SimpleTestScreen() {
  console.log('SimpleTestScreen rendering!');
  console.log('SimpleTestScreen - About to return JSX');
  
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>RED SCREEN TEST</Text>
      </View>
      <Text style={styles.text}>SIMPLE TEST SCREEN</Text>
      <Text style={styles.text}>If you see this red screen, navigation is working!</Text>
      <Text style={styles.text}>This should be impossible to miss!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  banner: {
    backgroundColor: '#000000',
    padding: 30,
    marginBottom: 40,
    borderRadius: 10,
  },
  bannerText: {
    color: '#FFFF00',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

