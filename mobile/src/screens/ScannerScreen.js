import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  overlay: 'rgba(0,0,0,0.4)',
};

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [selectedEstate, setSelectedEstate] = useState(null);
  const [estates, setEstates] = useState([]);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadEstates();
  }, []);

  const loadEstates = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        const data = await ApiService.getUserEstates(userId);
        if (data && data.length > 0) {
          setEstates(data);
          if (!selectedEstate) {
            setSelectedEstate(data[data.length - 1]); // Select most recently created by default
          }
        }
      }
    } catch {}
  };

  const takePicture = async () => {
    if (!selectedEstate) {
      Alert.alert('Select Estate', 'Please select an estate before scanning.');
      return;
    }
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        analyzeImage(photo.uri);
      } catch {
        Alert.alert('Error', 'Failed to capture image.');
      }
    }
  };

  const analyzeImage = async (uri) => {
    setAnalyzing(true);
    setAiData(null);
    try {
      const data = await ApiService.scanItem(uri);
      setAiData({
        ...data,
        title: data.ai_title || 'Vintage Mid-Century Ceramic Lamp',
        description: data.ai_description || 'Elegant MCM lamp featuring a patterned ceramic base (glazed olive and cream). Geometric motifs. Original linen drum shade with matching trim. Excellent condition. Circa 1960s.',
        minPrice: data.estimated_min_price || 250,
        maxPrice: data.estimated_max_price || 450,
        uri: uri,
      });
    } catch (e) {
      Alert.alert('Analysis Failed', e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveItem = async () => {
    if (!aiData || !selectedEstate) return;
    try {
      await ApiService.createItem({
        estate_id: selectedEstate.id,
        ai_title: aiData.title,
        ai_description: aiData.description,
        estimated_min_price: aiData.minPrice,
        estimated_max_price: aiData.maxPrice,
        image_url: aiData.uri,
      });
      resetScanner();
    } catch {
      Alert.alert('Error', 'Failed to save item.');
    }
  };

  const resetScanner = () => {
    setAiData(null);
  };

  if (!permission) return <View style={styles.safe} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, marginBottom: 16 }}>Camera access required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <View style={{ width: 40 }} />
          <TouchableOpacity style={styles.headerCenter} onPress={() => setSelectModalVisible(true)}>
            <Text style={styles.headerTitle}>TagSnap</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={styles.headerSubtitle}>{selectedEstate ? selectedEstate.name : 'Select Estate'} </Text>
              <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.8)" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerUserBtn}>
            <View style={styles.onlineDot} />
            <Feather name="users" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Brackets */}
        {!aiData && !analyzing && (
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        )}

        {/* Loading Pill */}
        {analyzing && (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <View style={styles.analyzingPill}>
              <Text style={styles.analyzingText}>AI Analyze: 75%</Text>
            </View>
          </View>
        )}

        {/* Result Bottom Sheet */}
        {aiData && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{aiData.title}</Text>
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.iconBtn}><Feather name="edit-2" size={14} color={COLORS.textLight}/></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}><Feather name="eye" size={14} color={COLORS.textLight}/></TouchableOpacity>
              </View>
            </View>
            <Text style={styles.sheetDesc}>{aiData.description}</Text>
            <Text style={styles.sheetPrice}>${aiData.minPrice} – ${aiData.maxPrice}</Text>
            
            <View style={styles.actionRow}>
              <View style={styles.actionWrap}>
                <TouchableOpacity style={styles.actionBtnWhite} onPress={saveItem}>
                  <Feather name="check" size={24} color={COLORS.success} />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>Accept</Text>
              </View>

              <View style={styles.actionWrap}>
                <TouchableOpacity style={styles.actionBtnGreen} onPress={takePicture}>
                  <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={{height: 16}} />
              </View>

              <View style={styles.actionWrap}>
                <TouchableOpacity style={styles.actionBtnWhite} onPress={resetScanner}>
                  <Feather name="trash-2" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
                <View style={{height: 16}} />
              </View>
            </View>
          </View>
        )}

        {/* Capture Button (if not analyzing and no data) */}
        {!aiData && !analyzing && (
          <View style={styles.captureFooter}>
            <TouchableOpacity style={styles.actionBtnGreen} onPress={takePicture}>
              <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

      </CameraView>

      {/* Estate Selection Modal */}
      <Modal visible={selectModalVisible} animationType="slide" transparent onRequestClose={() => setSelectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Estate</Text>
            <Text style={styles.modalSub}>Choose which estate to save this item to.</Text>
            
            <FlatList
              data={estates}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.estateRow, selectedEstate?.id === item.id && styles.estateRowActive]} 
                  onPress={() => { setSelectedEstate(item); setSelectModalVisible(false); }}
                >
                  <Feather name="home" size={20} color={selectedEstate?.id === item.id ? COLORS.primary : COLORS.textLight} />
                  <Text style={[styles.estateRowText, selectedEstate?.id === item.id && styles.estateRowTextActive]}>{item.name}</Text>
                  {selectedEstate?.id === item.id && <Feather name="check" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FA' },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold' },

  // Header Overlay
  headerOverlay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerMenuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  headerUserBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 6 },

  // Viewfinder
  viewfinder: { width: 280, height: 280, alignSelf: 'center', marginTop: 100 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: 'rgba(255,255,255,0.6)' },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 16 },

  // Analyzing
  analyzingOverlay: { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center' },
  analyzingPill: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  analyzingText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Bottom Sheet
  bottomSheet: { backgroundColor: COLORS.surface, margin: 16, marginBottom: 32, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, flex: 1, paddingRight: 12, lineHeight: 24 },
  sheetActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  sheetDesc: { fontSize: 13, color: COLORS.textLight, lineHeight: 20, marginBottom: 16 },
  sheetPrice: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 24 },

  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 24 },
  actionWrap: { alignItems: 'center' },
  actionBtnWhite: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  actionBtnGreen: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, borderWidth: 4, borderColor: COLORS.primaryLight },
  actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textDark, marginTop: 8 },

  captureFooter: { alignItems: 'center', paddingBottom: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40, maxHeight: height * 0.7 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CCC', alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  modalSub: { color: COLORS.textLight, fontSize: 14, marginBottom: 24 },
  estateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  estateRowActive: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingHorizontal: 16, borderBottomWidth: 0, marginBottom: 8 },
  estateRowText: { flex: 1, fontSize: 16, color: COLORS.textDark, fontWeight: '600', marginLeft: 16 },
  estateRowTextActive: { color: COLORS.primary, fontWeight: '800' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  cancelBtnText: { color: COLORS.textLight, fontSize: 15, fontWeight: '700' },
});
