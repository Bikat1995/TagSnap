import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#e6e0d4',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  primary: '#4a3b2c',
  primaryHover: '#2b2118',
  primaryLight: '#d5cbb8',
  textDark: '#0a0a0a',
  textLight: '#736150',
  border: '#d5cbb8',
  success: '#4a3b2c',
  warning: '#736150',
  danger: '#2b2118',
  error: '#2b2118',
};

const slides = [
  {
    id: '1',
    Icon: ({ size, color }) => <MaterialCommunityIcons name="line-scan" size={size} color={color} />,
    title: 'Snap, Identify\n& Appraise',
    body: 'Point your camera at any estate sale item and let our AI instantly identify it, write a description, and estimate its market value.',
    accent: COLORS.primaryLight,
    iconColor: COLORS.primary,
  },
  {
    id: '2',
    Icon: ({ size, color }) => <MaterialCommunityIcons name="office-building-outline" size={size} color={color} />,
    title: 'Organise by\nEstate',
    body: 'Group every scanned item under the right estate sale. Keep your entire inventory structured, searchable, and always in sync.',
    accent: COLORS.primaryLight,
    iconColor: COLORS.primary,
  },
  {
    id: '3',
    Icon: ({ size, color }) => <Feather name="bar-chart-2" size={size} color={color} />,
    title: 'Track Sales\n& Reports',
    body: 'Monitor which items sold, see pricing trends, and review estate performance—all from one beautiful dashboard.',
    accent: COLORS.primaryLight,
    iconColor: COLORS.primary,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      AsyncStorage.setItem('onboarding_complete', 'true').then(() => {
        navigation.replace('Login');
      });
    }
  };

  const skip = () => {
    AsyncStorage.setItem('onboarding_complete', 'true').then(() => {
      navigation.replace('Login');
    });
  };

  const slide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoTag}>Tag</Text>
          <Text style={styles.logoSnap}>Snap</Text>
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide content – manual state-driven, no FlatList */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => {
          const SlideIcon = s.Icon;
          return (
            <View key={s.id} style={styles.slide}>
              <View style={[styles.iconCircle, { backgroundColor: s.accent }]}>
                <SlideIcon size={56} color={s.iconColor} />
              </View>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideBody}>{s.body}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Step indicator */}
        <Text style={styles.stepText}>{currentIndex + 1} of {slides.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row' },
  logoTag: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  logoSnap: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  skipText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },

  // Slide
  slide: {
    width,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  slideBody: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 310,
    fontWeight: '400',
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stepText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
