import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineStorageService {
  static _estatesKey = 'cached_estates';
  static _itemsKey = 'cached_items';
  static _pendingChangesKey = 'pending_changes';

  // Estates caching
  async cacheEstates(estates) {
    try {
      const jsonString = JSON.stringify(estates);
      await AsyncStorage.setItem(this.constructor._estatesKey, jsonString);
    } catch (e) {
      console.error('Error caching estates:', e);
    }
  }

  async getCachedEstates() {
    try {
      const jsonString = await AsyncStorage.getItem(this.constructor._estatesKey);
      if (jsonString == null) return [];
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Error getting cached estates:', e);
      return [];
    }
  }

  // Items caching
  async cacheItems(items) {
    try {
      const jsonString = JSON.stringify(items);
      await AsyncStorage.setItem(this.constructor._itemsKey, jsonString);
    } catch (e) {
      console.error('Error caching items:', e);
    }
  }

  async getCachedItems() {
    try {
      const jsonString = await AsyncStorage.getItem(this.constructor._itemsKey);
      if (jsonString == null) return [];
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Error getting cached items:', e);
      return [];
    }
  }

  // Pending changes for sync
  async addPendingChange(operation, data) {
    try {
      const pending = await this.getPendingChanges();
      pending.push({
        operation,
        data,
        timestamp: new Date().toISOString(),
      });
      await this._savePendingChanges(pending);
    } catch (e) {
      console.error('Error adding pending change:', e);
    }
  }

  async getPendingChanges() {
    try {
      const jsonString = await AsyncStorage.getItem(this.constructor._pendingChangesKey);
      if (jsonString == null) return [];
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Error getting pending changes:', e);
      return [];
    }
  }

  async _savePendingChanges(changes) {
    try {
      const jsonString = JSON.stringify(changes);
      await AsyncStorage.setItem(this.constructor._pendingChangesKey, jsonString);
    } catch (e) {
      console.error('Error saving pending changes:', e);
    }
  }

  async clearPendingChanges() {
    try {
      await AsyncStorage.removeItem(this.constructor._pendingChangesKey);
    } catch (e) {
      console.error('Error clearing pending changes:', e);
    }
  }

  // Clear all cached data
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.constructor._estatesKey);
      await AsyncStorage.removeItem(this.constructor._itemsKey);
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
}

export default new OfflineStorageService();

