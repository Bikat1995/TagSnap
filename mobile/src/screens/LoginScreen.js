import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const BASE_URL = __DEV__ ? 'http://192.168.1.4:5000/api' : 'http://YOUR_IP:5000/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim())  { setError('Please enter your email'); return; }
    if (!password)      { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      if (res.data.success) {
        await AsyncStorage.setItem('auth_token', res.data.data.token);
        await AsyncStorage.setItem('user_id', res.data.data.user.id.toString());
        if (res.data.data.user.business_name) {
          await AsyncStorage.setItem('user_name', res.data.data.user.business_name);
        }
        navigation.replace('Home');
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo Mark */}
          <View style={styles.logoSection}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="line-scan" size={32} color="#FFF" />
            </View>
            <View style={styles.logoTextRow}>
              <Text style={styles.logoTagDark}>Tag</Text>
              <Text style={styles.logoSnapBlue}>Snap</Text>
            </View>
            <Text style={styles.tagline}>AI-powered estate sale management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            {/* Email */}
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoMark: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoTextRow: { flexDirection: 'row', marginBottom: 8 },
  logoTagDark: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  logoSnapBlue: { fontSize: 28, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  tagline: { color: COLORS.textLight, fontSize: 13, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: 4, letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: COLORS.textLight, marginBottom: 24, fontWeight: '500' },

  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14,
    fontSize: 15, color: COLORS.textDark,
  },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 10,
    padding: 12, marginBottom: 16, gap: 8,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: '600', flex: 1 },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textLight, fontSize: 13, fontWeight: '500' },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: COLORS.textLight, fontSize: 14, fontWeight: '500' },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
