import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineStorageService from './OfflineStorageService';

class ApiService {
  // For physical devices, replace 'localhost' with your computer's IP address
  // Find your IP: Windows: ipconfig, Mac/Linux: ifconfig
  // Example: 'http://192.168.1.100:5000/api'
  static baseUrl = __DEV__ 
    ? 'http://192.168.1.4:5000/api'  // For physical device / emulator
    : 'http://YOUR_COMPUTER_IP:5000/api';  // For production - UPDATE THIS!

  async _isOnline() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }

  async _getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (e) {
      return null;
    }
  }

  _getHeaders(token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Estates API calls with offline support
  async getUserEstates(userId) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.get(
          `${ApiService.baseUrl}/estates/user/${userId}`,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 200 && response.data.success) {
          const estates = response.data.data;
          await OfflineStorageService.cacheEstates(estates);
          return estates;
        }
      } catch (e) {
        // Fall back to cache
      }
    }

    // Return cached data if offline or API failed
    return await OfflineStorageService.getCachedEstates();
  }

  async getEstate(estateId) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.get(
          `${ApiService.baseUrl}/estates/${estateId}`,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 200 && response.data.success) {
          const estate = response.data.data;
          // Update cache with this estate
          const cachedEstates = await OfflineStorageService.getCachedEstates();
          const index = cachedEstates.findIndex((e) => e.id === estateId);
          if (index !== -1) {
            cachedEstates[index] = estate;
          } else {
            cachedEstates.push(estate);
          }
          await OfflineStorageService.cacheEstates(cachedEstates);
          return estate;
        }
      } catch (e) {
        // Fall back to cache
      }
    }

    // Return cached estate if available
    const cachedEstates = await OfflineStorageService.getCachedEstates();
    return cachedEstates.find((e) => e.id === estateId) || null;
  }

  async createEstate(estateData) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.post(
          `${ApiService.baseUrl}/estates`,
          estateData,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 201 && response.data.success) {
          const estate = response.data.data;
          // Add to cache
          const cachedEstates = await OfflineStorageService.getCachedEstates();
          cachedEstates.push(estate);
          await OfflineStorageService.cacheEstates(cachedEstates);
          return estate;
        }
      } catch (e) {
        // Fall through to offline handling below
      }
    }

    // Offline or API failed — store pending and cache optimistically
    const optimisticEstate = {
      ...estateData,
      id: `temp_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'Setup',
    };
    await OfflineStorageService.addPendingChange('create_estate', estateData);
    const cachedEstates = await OfflineStorageService.getCachedEstates();
    cachedEstates.push(optimisticEstate);
    await OfflineStorageService.cacheEstates(cachedEstates);
    return optimisticEstate;
  }

  async deleteEstate(estateId) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.delete(
          `${ApiService.baseUrl}/estates/${estateId}`,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 200 && response.data.success) {
          // Remove from cache
          let cachedEstates = await OfflineStorageService.getCachedEstates();
          cachedEstates = cachedEstates.filter(e => e.id !== estateId);
          await OfflineStorageService.cacheEstates(cachedEstates);
          
          let cachedItems = await OfflineStorageService.getCachedItems();
          cachedItems = cachedItems.filter(i => i.estate_id !== estateId);
          await OfflineStorageService.cacheItems(cachedItems);
          
          return true;
        }
      } catch (e) {
        console.error('Failed to delete estate via API:', e);
      }
    }
    
    // In offline mode, just remove it from cache
    let cachedEstates = await OfflineStorageService.getCachedEstates();
    cachedEstates = cachedEstates.filter(e => e.id !== estateId);
    await OfflineStorageService.cacheEstates(cachedEstates);
    
    // Store pending delete operation so backend syncs later
    await OfflineStorageService.addPendingChange('delete_estate', { id: estateId });
    return true;
  }

  // Items API calls with offline support
  async getUserItems(userId) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.get(
          `${ApiService.baseUrl}/items/user/${userId}`,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 200 && response.data.success) {
          const items = response.data.data;
          await OfflineStorageService.cacheItems(items);
          return items;
        }
      } catch (e) {
        // Fall back to cache
      }
    }

    // Return cached data if offline or API failed
    return await OfflineStorageService.getCachedItems();
  }

  async getEstateItems(estateId) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.get(
          `${ApiService.baseUrl}/items/estate/${estateId}`,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 200 && response.data.success) {
          const items = response.data.data;
          // Update cache with these items
          const cachedItems = await OfflineStorageService.getCachedItems();
          const filtered = cachedItems.filter((item) => item.estate_id !== estateId);
          filtered.push(...items);
          await OfflineStorageService.cacheItems(filtered);
          return items;
        }
      } catch (e) {
        // Fall back to cache
      }
    }

    // Return cached items for this estate
    const cachedItems = await OfflineStorageService.getCachedItems();
    return cachedItems.filter((item) => item.estate_id === estateId);
  }

  async createItem(itemData) {
    const isOnline = await this._isOnline();
    const token = await this._getAuthToken();

    if (isOnline && token) {
      try {
        const response = await axios.post(
          `${ApiService.baseUrl}/items`,
          itemData,
          { headers: this._getHeaders(token) }
        );

        if (response.status === 201 && response.data.success) {
          const item = response.data.data;
          // Add to cache
          const cachedItems = await OfflineStorageService.getCachedItems();
          cachedItems.push(item);
          await OfflineStorageService.cacheItems(cachedItems);
          return item;
        }
      } catch (e) {
        // Store as pending change
        await OfflineStorageService.addPendingChange('create_item', itemData);
        return itemData; // Return optimistic response
      }
    } else {
      // Store as pending change
      await OfflineStorageService.addPendingChange('create_item', itemData);
      return itemData; // Return optimistic response
    }

    return null;
  }

  // Sync pending changes when online
  async syncPendingChanges() {
    const isOnline = await this._isOnline();
    if (!isOnline) return;

    const token = await this._getAuthToken();
    if (!token) return;

    const pendingChanges = await OfflineStorageService.getPendingChanges();
    if (pendingChanges.length === 0) return;

    for (const change of pendingChanges) {
      try {
        await this._syncChange(change, token);
      } catch (e) {
        // Keep failed changes for next sync
        continue;
      }
    }

    // Clear successfully synced changes
    await OfflineStorageService.clearPendingChanges();
  }

  async _syncChange(change, token) {
    const { operation, data } = change;

    switch (operation) {
      case 'create_estate':
        await axios.post(
          `${ApiService.baseUrl}/estates`,
          data,
          { headers: this._getHeaders(token) }
        );
        break;
      case 'create_item':
        await axios.post(
          `${ApiService.baseUrl}/items`,
          data,
          { headers: this._getHeaders(token) }
        );
        break;
      case 'delete_estate':
        await axios.delete(
          `${ApiService.baseUrl}/estates/${data.id}`,
          { headers: this._getHeaders(token) }
        );
        break;
    }
  }

  async scanItem(imageUri) {
    const isOnline = await this._isOnline();
    if (!isOnline) {
      throw new Error("You must be online to use the AI Scanner.");
    }
    
    let localUri = imageUri;
    let filename = localUri.split('/').pop();

    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    let formData = new FormData();
    formData.append('image', { uri: localUri, name: filename, type });

    const response = await axios.post(
      `${ApiService.baseUrl}/scan`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || "Failed to scan image");
    }
  }
}

export default new ApiService();

