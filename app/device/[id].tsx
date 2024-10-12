import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {styles} from '../../styles';

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
    const connectionRef = database().ref(`users/${userId}/devices/${id}/status`);
    const realtimeRef = database().ref(`devices/${id}/real-time`);

    const deviceUnsubscribe = deviceRef.on('value', (snapshot) => {
      setDevice(snapshot.val());
    });

    const realtimeUnsubscribe= realtimeRef.on('value', (snapshot) => {
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

    const connectionStateUnsubscribe = connectionRef.on('value', (snapshot) => {
      setConnectionState(snapshot.val() ? 'Online' : 'Offline');
    });

    return () => {
      deviceRef.off('value', deviceUnsubscribe);
      ledStateRef.off('value', ledStateUnsubscribe);
      connectionRef.off('value', connectionStateUnsubscribe);
      realtimeRef.off('value', realtimeUnsubscribe);
    };
  });

  const toggleLedState = useCallback(() => {
    const ledStateRef = database().ref(`devices/${ id }/led_state`);
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
          <Text style={styles.subtitle}>{device.location}</Text>
        </View>
        <View style={[styles.connectionIndicator, { backgroundColor: connectionState === 'Online' ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.connectionText}>{connectionState}</Text>
        </View>
      </View>

      <View style={styles.currentReadings}>
        <View style={styles.readingBox}>
          <Text style={styles.mainReadingTitle}>Flowrate</Text>
          <Text style={styles.mainReadingValue}>{currentFlowrate !== null ? `${ currentFlowrate?.toFixed(1) } kg / s` : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.currentReadings}>

        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Temperature</Text>
          <Text style={styles.readingValue}>{currentTemperature !== null ? `${ currentTemperature?.toFixed(1) }°C` : 'N/A'}</Text>
        </View>
        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Pressure</Text>
          <Text style={styles.readingValue}>{currentPressure !== null ? `${ currentPressure?.toFixed(1) } KPa` : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.ledContainer}>
        <Text style={styles.ledText}>LED State: {ledState ? 'ON' : 'OFF'}</Text>
        <TouchableOpacity style={styles.ledButton} onPress={toggleLedState}>
          <Text style={styles.ledButtonText}>Toggle LED</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
