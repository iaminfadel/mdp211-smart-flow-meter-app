import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Threshold time in seconds
const THRESHOLD = 5;
// Interval in milliseconds to refresh the status periodically 
const REFRESH_INTERVAL = 5 * 1000;

const AnimatedStatusIndicator = ({ status }) => {
  return (
    <MotiView
      from={{ scale: 0.1, opacity: 0.1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'timing', duration: 1000, loop: true, easing: Easing.linear }}
      style={[
        styles.statusIndicator,
        { backgroundColor: status ? '#88e700' : '#ff0000' }
      ]}
    />
  );
};

export default function DeviceListScreen() {
  const [devices, setDevices] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const router = useRouter();

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const devicesRef = database().ref(`users/${userId}/devices`);

    const onValueChange = devicesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const deviceList = data ? Object.entries(data).map(([uuid, device]) => ({ uuid, ...device })) : [];
      setDevices(deviceList);

      // Fetch statuses for all devices on initial load
      fetchAllDeviceStatuses(deviceList);
    });

    return () => devicesRef.off('value', onValueChange);
  }, []);

  useEffect(() => {
    // Set an interval to periodically fetch device statuses
    const intervalId = setInterval(() => {
      if (devices.length > 0) {
        fetchAllDeviceStatuses(devices);
      }
    }, REFRESH_INTERVAL);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [devices]);

  const fetchDeviceStatus = async (uuid) => {
    try {
      const timestampRef = database().ref(`/devices/${uuid}/real-time/timestamp`);
      const snapshot = await timestampRef.once('value');
      const timestamp = snapshot.val();

      // Compare timestamp with current time
      const currentTime = parseInt(Date.now() / 1000);
      return timestamp && (currentTime - timestamp) < THRESHOLD;
    } catch (error) {
      console.error('Error fetching device status:', error);
      return false;
    }
  };

  const fetchAllDeviceStatuses = async (deviceList) => {
    const statuses = {};
    for (const device of deviceList) {
      const status = await fetchDeviceStatus(device.uuid);
      statuses[device.uuid] = status;
    }
    setDeviceStatuses(statuses);
  };

  const renderDeviceItem = ({ item }) => {
    const isOnline = deviceStatuses[item.uuid]; // Get the status from the state

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => router.push(`/device/${item.uuid}`)}
      >
        <LinearGradient
          colors={['#00509d', '#00509d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceUuid}>{item.uuid}</Text>
          <Text style={styles.deviceLocation}>{item.location}</Text>
          <AnimatedStatusIndicator status={isOnline ? true : false} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#00296b', '#00296b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Your Devices</Text>

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.uuid}
        contentContainerStyle={styles.listContainer}
      />
      <Link href="/add-device" asChild>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={['#ffffff', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>Add Device</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 80,
    paddingTop: 20,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  card: {
    padding: 20,
    minHeight: 150,
  },
  deviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  deviceUuid: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  deviceLocation: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
  },
  addButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#00296b',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
