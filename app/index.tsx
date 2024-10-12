import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Link, useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {Easing} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedStatusIndicator = ({ status }) => {
  return (
    <MotiView
      from={{ scale: 0.1, opacity: 0.1 }}
      animate={{ scale: 1, opacity: 1 }}
      
      transition={{ type: 'timing', duration: 1000, loop: true, easing: Easing.linear }}
      style={[
        styles.statusIndicator,
        { backgroundColor: status === true ? '#88e700' : '#ff0000' }
      ]}
    />
  );
};

export default function DeviceListScreen() {
  const [devices, setDevices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const devicesRef = database().ref(`users/${userId}/devices`);

    const onValueChange = devicesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const deviceList = data ? Object.entries(data).map(([uuid, device]) => ({ uuid, ...device })) : [];
      setDevices(deviceList);
    });

    return () => devicesRef.off('value', onValueChange);
  }, []);

  const renderDeviceItem = ({ item, index }) => (
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
        <AnimatedStatusIndicator status={item.status} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#00296b','#00296b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>
        Your Devices
      </Text>

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
  title:{
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop:10
  },
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 80,
    paddingTop:20
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