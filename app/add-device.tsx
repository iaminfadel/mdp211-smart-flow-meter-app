import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export default function AddDeviceScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [uuid, setUUID] = useState('');
  const router = useRouter();

  const handleAddDevice = () => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const devicesRef = database().ref(`users/${userId}/devices/${uuid}`);

    devicesRef.set({
      uuid: Number(uuid),
      name,
      location,
      status: 'offline'
    }).then(() => {
      router.back();
    }).catch((error) => {
      console.error('Error adding device:', error);
    });
  };

  return (
    <View style={styles.container}>
        <TextInput
        style={styles.input}
        placeholder="UUID"
        value={uuid}
        onChangeText={setUUID}
        placeholderTextColor="#ccc"
      />
      <TextInput
        style={styles.input}
        placeholder="Device Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#ccc"
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        placeholderTextColor="#ccc"
      />

      <TouchableOpacity style={styles.button} onPress={handleAddDevice}>
        <Text style={styles.buttonText}>Add Device</Text>
      </TouchableOpacity>
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