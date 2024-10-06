import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

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

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => router.push(`/device/${item.uuid}`)}
    >
              <Text style={styles.deviceName}>{item.uuid}</Text>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceLocation}>{item.location}</Text>
      <Text style={[styles.deviceStatus, { color: item.status === 'online' ? '#4CAF50' : '#F44336' }]}>
        {item.status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.uuid}
      />
      <Link href="/add-device" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Device</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#001a33',
      padding: 20,
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
    googleButton: {
      backgroundColor: '#4285F4',
      padding: 15,
      borderRadius: 5,
      width: '100%',
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });