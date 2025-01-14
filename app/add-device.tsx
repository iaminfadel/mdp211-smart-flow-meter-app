import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { CameraView, Camera } from "expo-camera";
import { Camera as Camera_Logo} from 'lucide-react-native';

export default function AddDeviceScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [uuid, setUUID] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    try {
      // Expecting QR code data in format: {"uuid":"123","name":"Device Name"}
      const deviceData = JSON.parse(data);
      
      if (deviceData.uuid) {
        setUUID(deviceData.uuid.toString());
        if (deviceData.name) setName(deviceData.name);
        setScanning(false);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code does not contain valid device information.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read QR code data. Please try again or enter details manually.');
    }
  };

  const handleAddDevice = async () => {
    if (!uuid || !name || !location) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const userId = auth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to add a device');
      return;
    }

    setLoading(true);
    
    try {
      const devicesRef = database().ref(`users/${userId}/devices/${uuid}`);
      await devicesRef.set({
        uuid: Number(uuid),
        name,
        location,
        status: 'offline',
        addedAt: database.ServerValue.TIMESTAMP
      });
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add device. Please try again.');
      console.error('Error adding device:', error);
    } finally {
      setLoading(false);
    }
  };

  if (scanning) {
    return (
      <View style={styles.container}>
        <CameraView
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setScanning(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel Scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => setScanning(true)}
        >
          <Camera size={24} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>- OR -</Text>

        <TextInput
          style={styles.input}
          placeholder="UUID"
          value={uuid}
          onChangeText={setUUID}
          placeholderTextColor="#8b9cb5"
          editable={!loading}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Device Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#8b9cb5"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#8b9cb5"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleAddDevice}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding Device...' : 'Add Device'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001a33',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#004d99',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  orText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#003366',
    color: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});