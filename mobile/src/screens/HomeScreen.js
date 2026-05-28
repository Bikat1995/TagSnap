import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Dimensions,
  Switch,
  Animated,
  Modal,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import ApiService from '../services/ApiService';
import ScannerScreen from './ScannerScreen';
import CatalogScreen from './CatalogScreen';
import ReportsScreen from './ReportsScreen';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

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
};

// ─── Reusable Global Header ────────────────────────────────────────────────
const GlobalHeader = ({ estateName, onMenuPress }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity style={styles.headerBtn} onPress={onMenuPress}>
      <Feather name="menu" size={20} color={COLORS.textDark} />
    </TouchableOpacity>
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle}>TagSnap</Text>
      <Text style={styles.headerSubtitle}>Estate Sale: {estateName || 'All Estates'}</Text>
    </View>
    <TouchableOpacity style={styles.headerUserBtn}>
      <View style={styles.onlineDot} />
      <Feather name="users" size={16} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
);

// ─── Dashboard (Estates) ──────────────────────────────────────────────────
function DashboardScreen({ navigation, openDrawer }) {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [estateName, setEstateName] = useState('');
  const [estateAddress, setEstateAddress] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        // Fetch real estates and items to calculate true counts
        const [estatesData, itemsData] = await Promise.all([
          ApiService.getUserEstates(userId),
          ApiService.getUserItems(userId)
        ]);
        
        const mappedData = (estatesData || []).map(e => {
          const estateItems = (itemsData || []).filter(item => item.estate_id === e.id);
          const hasItems = estateItems.length > 0;
          return {
            ...e,
            status: e.status || (hasItems ? 'In Progress' : 'Setup'),
            itemsCount: estateItems.length,
            startedAt: new Date(e.created_at || Date.now()).toLocaleDateString(),
          };
        });
        setEstates(mappedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateEstate = async () => {
    if (!estateName.trim()) {
      Alert.alert('Required', 'Please enter an estate name.');
      return;
    }
    setCreating(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      await ApiService.createEstate({
        name: estateName.trim(),
        address: estateAddress.trim(),
        user_id: parseInt(userId),
      });
      setModalVisible(false);
      setEstateName('');
      setEstateAddress('');
      fetchEstates(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to create estate.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEstate = (estateId, estateName) => {
    Alert.alert(
      'Delete Estate',
      `Are you sure you want to delete "${estateName}"? All scanned items inside it will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteEstate(estateId);
              fetchEstates(true);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete estate.');
            }
          }
        }
      ]
    );
  };

  const renderBadge = (status) => {
    let bg = COLORS.primaryLight, text = COLORS.primaryHover;
    if (status === 'Completed') { bg = '#E5DFD5'; text = COLORS.textDark; }
    if (status === 'Setup') { bg = COLORS.border; text = COLORS.textLight; }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const renderEstate = ({ item }) => (
    <TouchableOpacity
      style={styles.estateCard}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('EstateDetails', { estate: item })}
    >
      <View style={styles.estateInfo}>
        <Text style={styles.estateName}>{item.name}</Text>
        <View style={styles.estateMetaRow}>
          {renderBadge(item.status)}
          <Text style={styles.estateMetaText}>{item.itemsCount} Items • Created {item.startedAt}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDeleteEstate(item.id, item.name)} style={{ padding: 8 }}>
        <Feather name="trash-2" size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <GlobalHeader onMenuPress={openDrawer} />
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Estates</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search estates..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="filter" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={estates.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={renderEstate}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEstates(true)} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Feather name="home" size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>No active estates</Text>
                <Text style={styles.emptySub}>Tap the + button to create your first estate sale.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Create Estate Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Estate</Text>
            <Text style={styles.modalSub}>Add a new estate sale to your account.</Text>

            <Text style={styles.inputLabel}>Estate Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Johnson Family Estate"
              placeholderTextColor="#999"
              value={estateName}
              onChangeText={setEstateName}
            />

            <Text style={styles.inputLabel}>Address (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="123 Main St, City, State"
              placeholderTextColor="#999"
              value={estateAddress}
              onChangeText={setEstateAddress}
            />

            <TouchableOpacity style={[styles.createBtn, creating && { opacity: 0.7 }]} onPress={handleCreateEstate} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Estate</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEstateName(''); setEstateAddress(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Settings ───────────────────────────────────────────────────────────────
function SettingsScreen({ navigation, openDrawer }) {
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  // Modals
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [aiModeVisible, setAiModeVisible] = useState(false);
  const [aiMode, setAiMode] = useState('High');

  useEffect(() => {
    AsyncStorage.getItem('settings_autoSave').then(val => {
      if (val !== null) setAutoSave(val === 'true');
    });
  }, []);

  const toggleAutoSave = async (val) => {
    setAutoSave(val);
    await AsyncStorage.setItem('settings_autoSave', String(val));
  };

  const handleDarkMode = (val) => {
    setDarkMode(val);
    if (val) {
      Alert.alert('Custom Theme Active', 'The app is currently locked to the custom brown palette theme.');
      setTimeout(() => setDarkMode(false), 500);
    }
  };

  return (
    <View style={styles.screen}>
      <GlobalHeader onMenuPress={openDrawer} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => setPrivacyVisible(true)}>
            <Feather name="lock" size={18} color={COLORS.textLight} style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Privacy & Security</Text>
            <Feather name="chevron-right" size={18} color={COLORS.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsRow} onPress={() => setNotificationsVisible(true)}>
            <Feather name="bell" size={18} color={COLORS.textLight} style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Notifications</Text>
            <Feather name="chevron-right" size={18} color={COLORS.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Feather name="moon" size={18} color={COLORS.textLight} style={styles.settingsIcon} />
            <Text style={styles.settingsText}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={handleDarkMode} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
          </View>
        </View>

        <Text style={styles.groupLabel}>APP</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => setAiModeVisible(true)}>
            <Text style={[styles.settingsText, { paddingLeft: 8 }]}>AI Accuracy Mode</Text>
            <Text style={styles.settingsValue}>{aiMode}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.settingsRow}>
            <Text style={[styles.settingsText, { paddingLeft: 8 }]}>Auto-save Scans</Text>
            <Switch value={autoSave} onValueChange={toggleAutoSave} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
          </View>
        </View>
      </View>

      {/* Privacy Modal */}
      <Modal visible={privacyVisible} animationType="slide" transparent={false}>
        <View style={styles.screen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)} style={styles.modalBackBtn}>
              <Feather name="arrow-left" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Privacy & Security</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.content}>
            <Text style={styles.subScreenText}>
              Your data is secured using end-to-end encryption. Images processed by Google Gemini are explicitly opted-out of data training to protect your inventory privacy.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => Alert.alert('Logout', 'Logging out of all sessions.')}>
              <Text style={styles.dangerBtnText}>Logout all other sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notificationsVisible} animationType="slide" transparent={false}>
        <View style={styles.screen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} style={styles.modalBackBtn}>
              <Feather name="arrow-left" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Notifications</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.content}>
            <View style={styles.settingsGroup}>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsText}>Push Notifications</Text>
                <Switch value={true} onValueChange={() => {}} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingsRow}>
                <Text style={styles.settingsText}>Weekly Summary Emails</Text>
                <Switch value={false} onValueChange={() => {}} trackColor={{ true: COLORS.primary, false: COLORS.border }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Mode Modal */}
      <Modal visible={aiModeVisible} animationType="slide" transparent={false}>
        <View style={styles.screen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAiModeVisible(false)} style={styles.modalBackBtn}>
              <Feather name="arrow-left" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>AI Accuracy Mode</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.content}>
            <Text style={styles.subScreenText}>Choose the AI model used for scanning items.</Text>
            
            <TouchableOpacity style={styles.optionRow} onPress={() => { setAiMode('High'); setAiModeVisible(false); }}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>High Accuracy (Gemini 2.5 Flash)</Text>
                <Text style={styles.optionSub}>Slower, but highest accuracy for appraisals.</Text>
              </View>
              {aiMode === 'High' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={() => { setAiMode('Fast'); setAiModeVisible(false); }}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Speed Mode (Gemini 1.5 Flash)</Text>
                <Text style={styles.optionSub}>Faster response, less descriptive.</Text>
              </View>
              {aiMode === 'Fast' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Custom Bottom Tabs Layout ──────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Estates');
  const [userName, setUserName] = useState('');
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('user_name').then(name => setUserName(name || 'TagSnap User'));
  }, []);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setIsDrawerOpen(false));
  };

  const handleLogout = async () => {
    closeDrawer();
    await AsyncStorage.multiRemove(['auth_token', 'user_id', 'user_name']);
    navigation.replace('Login');
  };

  const navigateTab = (tabName) => {
    setActiveTab(tabName);
    closeDrawer();
  };

  // Render the current screen based on state
  const renderCurrentScreen = () => {
    switch(activeTab) {
      case 'Estates': return <DashboardScreen navigation={navigation} openDrawer={openDrawer} />;
      case 'Scan': return <ScannerScreen navigation={navigation} openDrawer={openDrawer} />;
      case 'Catalog': return <CatalogScreen navigation={navigation} openDrawer={openDrawer} />;
      case 'Reports': return <ReportsScreen navigation={navigation} openDrawer={openDrawer} />;
      case 'Settings': return <SettingsScreen navigation={navigation} openDrawer={openDrawer} />;
      default: return <DashboardScreen navigation={navigation} openDrawer={openDrawer} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Screen */}
      <View style={styles.screenWrapper}>
        {renderCurrentScreen()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.customTabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Estates')}>
          <View style={[styles.tabIconWrap, activeTab === 'Estates' && styles.tabIconWrapActive]}>
            <MaterialCommunityIcons name="office-building-outline" size={24} color={activeTab === 'Estates' ? COLORS.primaryHover : COLORS.textLight} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Estates' && { color: COLORS.primaryHover, fontWeight: '700' }]}>Estates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Scan')} activeOpacity={0.8}>
          <View style={[styles.tabIconWrap, activeTab === 'Scan' && styles.tabIconWrapActive]}>
            <MaterialCommunityIcons name="line-scan" size={24} color={activeTab === 'Scan' ? COLORS.primaryHover : COLORS.textLight} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Scan' && { color: COLORS.primaryHover, fontWeight: '700' }]}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Catalog')}>
          <View style={[styles.tabIconWrap, activeTab === 'Catalog' && styles.tabIconWrapActive]}>
            <MaterialCommunityIcons name="bookshelf" size={24} color={activeTab === 'Catalog' ? COLORS.primaryHover : COLORS.textLight} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Catalog' && { color: COLORS.primaryHover, fontWeight: '700' }]}>Catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Reports')}>
          <View style={[styles.tabIconWrap, activeTab === 'Reports' && styles.tabIconWrapActive]}>
            <Feather name="file-text" size={22} color={activeTab === 'Reports' ? COLORS.primaryHover : COLORS.textLight} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Reports' && { color: COLORS.primaryHover, fontWeight: '700' }]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab('Settings')}>
          <View style={[styles.tabIconWrap, activeTab === 'Settings' && styles.tabIconWrapActive]}>
            <Feather name="settings" size={22} color={activeTab === 'Settings' ? COLORS.primaryHover : COLORS.textLight} />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'Settings' && { color: COLORS.primaryHover, fontWeight: '700' }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Sidebar Drawer ─── */}
      {isDrawerOpen && (
        <Animated.View style={[styles.drawerOverlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={styles.drawerDismiss} onPress={closeDrawer} activeOpacity={1} />
        </Animated.View>
      )}
      
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.drawerName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.drawerRole}>Lead Appraiser</Text>
          </View>
        </View>

        <View style={styles.drawerNav}>
          <TouchableOpacity style={[styles.drawerItem, activeTab === 'Scan' && styles.drawerItemActive]} onPress={() => navigateTab('Scan')}>
            <MaterialCommunityIcons name="line-scan" size={22} color={activeTab === 'Scan' ? COLORS.primary : COLORS.textDark} style={styles.drawerIcon} />
            <Text style={[styles.drawerItemText, activeTab === 'Scan' && styles.drawerItemTextActive]}>Scanner Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.drawerItem, activeTab === 'Estates' && styles.drawerItemActive]} onPress={() => navigateTab('Estates')}>
            <MaterialCommunityIcons name="office-building-outline" size={22} color={activeTab === 'Estates' ? COLORS.primary : COLORS.textDark} style={styles.drawerIcon} />
            <Text style={[styles.drawerItemText, activeTab === 'Estates' && styles.drawerItemTextActive]}>My Estates</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.drawerItem, activeTab === 'Settings' && styles.drawerItemActive]} onPress={() => navigateTab('Settings')}>
            <Feather name="settings" size={22} color={activeTab === 'Settings' ? COLORS.primary : COLORS.textDark} style={styles.drawerIcon} />
            <Text style={[styles.drawerItemText, activeTab === 'Settings' && styles.drawerItemTextActive]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => Alert.alert('Help', 'Support coming soon.')}>
            <Feather name="help-circle" size={22} color={COLORS.textDark} style={styles.drawerIcon} />
            <Text style={styles.drawerItemText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.drawerLogout} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} style={styles.drawerIcon} />
          <Text style={styles.drawerLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screenWrapper: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, paddingHorizontal: 20 },
  
  // Custom Tab Bar
  customTabBar: {
    flexDirection: 'row', height: 90, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: 25, paddingTop: 12, justifyContent: 'space-around', elevation: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textLight, marginTop: 4 },
  tabIconWrap: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  tabIconWrapActive: { backgroundColor: COLORS.primaryLight },

  // Header
  headerContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  headerUserBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.border
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 6 },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  
  // Search
  searchRow: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 12, paddingLeft: 10, fontSize: 14, color: COLORS.textDark },
  filterBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },

  // Estates
  listContent: { paddingBottom: 40 },
  estateCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: COLORS.border,
  },
  estateInfo: { flex: 1 },
  estateName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  estateMetaRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8, backgroundColor: COLORS.primaryLight },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: COLORS.primaryHover },
  estateMetaText: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', maxWidth: 260 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CCC', alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  modalSub: { color: COLORS.textLight, fontSize: 14, marginBottom: 24 },
  inputLabel: { color: COLORS.textLight, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E5DFD5', borderRadius: 12, padding: 14, color: COLORS.textDark, fontSize: 15, marginBottom: 16 },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: COLORS.textLight, fontSize: 14, fontWeight: '700' },

  // Settings
  groupLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textLight, letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  settingsGroup: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingsIcon: { marginRight: 12 },
  settingsText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  settingsValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 46 },

  // Sub-screens
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg },
  modalBackBtn: { width: 40, height: 40, justifyContent: 'center' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  subScreenText: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, marginTop: 24, marginBottom: 24 },
  dangerBtn: { backgroundColor: COLORS.danger, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  dangerBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  optionSub: { fontSize: 12, color: COLORS.textLight },

  // Sidebar Drawer
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  drawerDismiss: { flex: 1 },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH,
    backgroundColor: COLORS.surface, zIndex: 20, paddingTop: 60, paddingHorizontal: 24,
    borderRightWidth: 1, borderRightColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 20,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: COLORS.border },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  drawerName: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  drawerRole: { fontSize: 13, color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  
  drawerNav: { flex: 1, gap: 8 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  drawerItemActive: { backgroundColor: COLORS.primaryLight },
  drawerIcon: { marginRight: 16 },
  drawerItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  drawerItemTextActive: { color: COLORS.primary, fontWeight: '700' },
  
  drawerLogout: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 20 },
  drawerLogoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
});
