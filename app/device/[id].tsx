import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import MeasurementGraph from './MeasurementGraph';  // Adjust path as needed

// Threshold time in milliseconds (e.g., 5 minutes)
const THRESHOLD = 10;
// Interval in milliseconds to refresh the status periodically (e.g., 30 seconds)
const REFRESH_INTERVAL = 1 * 1000;

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [device, setDevice] = useState(null);
  const [currentFlowrate, setCurrentFlowrate] = useState(null);
  const [currentTemperature, setCurrentTemperature] = useState(null);
  const [currentPressure, setCurrentPressure] = useState(null);
  const [ledState, setLedState] = useState(false);
  const [connectionState, setConnectionState] = useState('Offline');

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const deviceRef = database().ref(`users/${userId}/devices/${id}`);
    const flowrateRef = database().ref(`devices/${id}/flowrate`);
    const temperatureRef = database().ref(`devices/${id}/temperature`);
    const pressureRef = database().ref(`devices/${id}/pressure`);
    const ledStateRef = database().ref(`devices/${id}/led_state`);
    const realtimeRef = database().ref(`devices/${id}/real-time`);

    const deviceUnsubscribe = deviceRef.on('value', (snapshot) => {
      setDevice(snapshot.val());
    });

    const realtimeUnsubscribe = realtimeRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentFlowrate(data.flowrate);
        setCurrentTemperature(data.temperature);
        setCurrentPressure(data.pressure);
      }
    });

    const ledStateUnsubscribe = ledStateRef.on('value', (snapshot) => {
      setLedState(snapshot.val());
    });

    return () => {
      deviceRef.off('value', deviceUnsubscribe);
      ledStateRef.off('value', ledStateUnsubscribe);
      realtimeRef.off('value', realtimeUnsubscribe);
    };
  }, [id]);

  // Periodic check for connection state using timestamp
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const realtimeRef = database().ref(`devices/${id}/real-time/timestamp`);

    const fetchConnectionStatus = async () => {
      const snapshot = await realtimeRef.once('value');
      const timestamp = snapshot.val();

      if (timestamp) {
        const currentTime = parseInt(Date.now() / 1000); // Get current time in seconds
        const timeDifference = currentTime - timestamp;

        // Check if the difference exceeds the threshold
        if (timeDifference > THRESHOLD) {
          setConnectionState('Offline');
        } else {
          setConnectionState('Online');
        }
      } else {
        setConnectionState('Offline');
      }
    };

    // Fetch connection state on load
    fetchConnectionStatus();

    // Set interval to periodically fetch the connection state
    const intervalId = setInterval(() => {
      fetchConnectionStatus();
    }, REFRESH_INTERVAL);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [id]);

  const toggleLedState = useCallback(() => {
    const ledStateRef = database().ref(`devices/${id}/led_state`);
    ledStateRef.set(!ledState);
  }, [id, ledState]);

  if (!device) {
    return <View style={styles.container}><Text style={styles.text}>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{device.name}</Text>
          <Text style={styles.deviceLocation}>{device.location}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: connectionState === 'Online' ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.connectionText}>{connectionState}</Text>
        </View>
      </View>

      <View style={styles.currentReadings}>
        <View style={styles.readingBox}>
          <Text style={styles.mainReadingTitle}>Flowrate</Text>
          <Text style={styles.mainReadingValue}>
            {(currentFlowrate !== null && connectionState === 'Online') ? `${currentFlowrate?.toFixed(1)} kg / s` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.currentReadings}>
        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Temperature</Text>
          <Text style={styles.readingValue}>
            {(currentTemperature !== null && connectionState === 'Online') ? `${currentTemperature?.toFixed(1)}°C` : 'N/A'}
          </Text>
        </View>
        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Pressure</Text>
          <Text style={styles.readingValue}>
            {(currentPressure !== null && connectionState === 'Online') ? `${currentPressure?.toFixed(1)} KPa` : 'N/A'}
          </Text>
        </View>
      </View>

      <MeasurementGraph deviceId={id} />

    </ScrollView>
  );
}

// Local styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#00296B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  deviceLocation: {
    fontSize: 20,
    color: '#eee',
  },
  statusIndicator: {
    width: 50,
    height: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent:'center'
  },
  connectionText: {
    fontSize: 14,
    color: '#fff',
  },
  currentReadings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  readingBox: {
    flex: 1,
    backgroundColor: '#00509D',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  mainReadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainReadingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  readingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  readingValue: {
    fontSize: 20,
    color: '#fff',
    marginTop: 5,
  },
});
