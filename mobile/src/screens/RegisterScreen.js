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

export default function RegisterScreen({ navigation }) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]          = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleRegister = async () => {
    setError('');
    if (!businessName.trim()) { setError('Please enter your username'); return; }
    if (!email.trim())        { setError('Please enter your email'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        email: email.trim().toLowerCase(),
        password,
        business_name: businessName.trim(),
      });
      if (res.data.success) {
        await AsyncStorage.setItem('auth_token', res.data.data.token);
        await AsyncStorage.setItem('user_id', res.data.data.user.id.toString());
        if (businessName.trim()) {
          await AsyncStorage.setItem('user_name', businessName.trim());
        }
        navigation.replace('Home');
      } else {
        setError(res.data.error || 'Registration failed');
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

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={COLORS.textDark} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headingSection}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="line-scan" size={32} color="#FFF" />
            </View>
            <Text style={styles.heading}>Create your{'\n'}account</Text>
            <Text style={styles.sub}>Start managing estate sales with AI-powered tools.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <View style={styles.iconBox}>
                <Feather name="user" size={18} color={COLORS.textLight} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

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
                placeholder="At least 6 characters"
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
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  backText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },

  headingSection: { marginBottom: 32 },
  logoMark: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  heading: {
    fontSize: 32, fontWeight: '800', color: COLORS.textDark,
    lineHeight: 40, marginBottom: 10, letterSpacing: -0.5,
  },
  sub: { color: COLORS.textLight, fontSize: 15, fontWeight: '400', lineHeight: 22 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24, borderWidth: 1, borderColor: COLORS.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    marginBottom: 20,
  },

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
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.textDark },
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
    alignItems: 'center', marginTop: 4, marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: COLORS.textLight, fontSize: 14, fontWeight: '500' },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },

  terms: { color: COLORS.textLight, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
});
