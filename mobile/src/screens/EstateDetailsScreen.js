import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import ApiService from '../services/ApiService';

const PRIMARY = '#8FA189';
const DARK    = '#FDFBF7';
const CARD    = '#F4EFE6';
const GREEN   = '#758A6F';

export default function EstateDetailsScreen({ route, navigation }) {
  const { estate } = route.params;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [estate.id]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const estateItems = await ApiService.getEstateItems(estate.id);
      setItems(estateItems || []);
    } catch (e) {
      console.error('Failed to load items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{estate.name}</Text>
        <View style={{ width: 60 }} />
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'} Scanned
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No items scanned yet</Text>
          <Text style={styles.emptySubtext}>Use the Scanner tab to add items to this estate.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>
                  ${parseFloat(item.estimated_min_price || 0).toFixed(0)} - ${parseFloat(item.estimated_max_price || 0).toFixed(0)}
                </Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  backBtn: { padding: 8 },
  backText: { color: PRIMARY, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D2B2A' },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD5',
    marginBottom: 8,
  },
  statsText: { color: '#7A7571', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  list: { padding: 20 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5DFD5',
    overflow: 'hidden',
  },
  itemImage: { width: 100, height: 100, resizeMode: 'cover' },
  noImagePlaceholder: {
    width: 100, height: 100, backgroundColor: '#EBE6DC', justifyContent: 'center', alignItems: 'center'
  },
  noImageText: { color: '#7A7571', fontSize: 12 },
  itemInfo: { flex: 1, padding: 16, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#2D2B2A', marginBottom: 4 },
  itemPrice: { fontSize: 15, color: GREEN, fontWeight: '800', marginBottom: 6 },
  itemDesc: { fontSize: 13, color: '#7A7571', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#2D2B2A', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { color: '#7A7571', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
