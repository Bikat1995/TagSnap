import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import EstateDetailsScreen from './src/screens/EstateDetailsScreen';


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!isMounted) return;
        
        let onboardingComplete = null;
        let authToken = null;
        
        try {
          onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
          authToken = await AsyncStorage.getItem('auth_token');
        } catch (storageError) {
          console.error('Storage error:', storageError);
        }
        
        if (!isMounted) return;
        
        setHasCompletedOnboarding(onboardingComplete === 'true');
        setIsAuthenticated(!!authToken);
      } catch (e) {
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    const timeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        setHasCompletedOnboarding(false);
        setIsAuthenticated(false);
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isLoading]);

  const getInitialRoute = () => {
    if (!hasCompletedOnboarding) return 'Onboarding';
    if (isAuthenticated) return 'Home';
    return 'Login';
  };

  // Custom lightweight navigator to bypass React Navigation Fabric bugs
  const [history, setHistory] = useState([{ name: getInitialRoute(), params: {} }]);
  
  const currentRoute = history[history.length - 1];

  const navigate = (name, params = {}) => {
    setHistory(prev => [...prev, { name, params }]);
  };

  const replace = (name, params = {}) => {
    setHistory(prev => [...prev.slice(0, -1), { name, params }]);
  };

  const goBack = () => {
    setHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const navigation = { navigate, replace, goBack };
  const route = { params: currentRoute.params };

  const renderScreen = () => {
    if (isLoading) {
      return <SplashScreen />;
    }
    
    switch (currentRoute.name) {
      case 'Onboarding': return <OnboardingScreen navigation={navigation} route={route} />;
      case 'Login': return <LoginScreen navigation={navigation} route={route} />;
      case 'Register': return <RegisterScreen navigation={navigation} route={route} />;
      case 'Home': return <HomeScreen navigation={navigation} route={route} />;
      case 'EstateDetails': return <EstateDetailsScreen navigation={navigation} route={route} />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#e6e0d4' }}>
      <StatusBar style="auto" />
      {renderScreen()}
    </View>
  );
}
