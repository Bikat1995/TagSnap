import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoMark}>
          <MaterialCommunityIcons name="line-scan" size={44} color="#FFF" />
        </View>
        <View style={styles.logoTextRow}>
          <Text style={styles.logoTag}>Tag</Text>
          <Text style={styles.logoSnap}>Snap</Text>
        </View>
        <Text style={styles.tagline}>AI-powered estate sale management</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, { opacity: 0.3 }]} />
          <View style={[styles.dot, { opacity: 0.6 }]} />
          <View style={[styles.dot, { opacity: 1 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e0d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  logoMark: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: '#4a3b2c',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2b2118',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  logoTextRow: { flexDirection: 'row', marginBottom: 12 },
  logoTag: { fontSize: 36, fontWeight: '800', color: '#0a0a0a', letterSpacing: -1 },
  logoSnap: { fontSize: 36, fontWeight: '800', color: '#4a3b2c', letterSpacing: -1 },
  tagline: { fontSize: 14, color: '#736150', fontWeight: '500', letterSpacing: 0.2 },
  footer: { position: 'absolute', bottom: 60, alignItems: 'center' },
  loadingDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4a3b2c' },
});
