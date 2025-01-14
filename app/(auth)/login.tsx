import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Configure Google Sign-In
  GoogleSignin.configure({
    webClientId: '591151168525-r8ntc734q5qmb2vq0q3hnv3u2edbs4qk.apps.googleusercontent.com',
    offlineAccess: true, // Add this to request a refresh token
  });

  const handleEmailAuth = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      if (isLogin) {
        await auth().signInWithEmailAndPassword(email, password);
      } else {
        await auth().createUserWithEmailAndPassword(email, password);
      }
      router.replace('/');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Please use a stronger password!';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password!';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account exists with this email!';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      // First, sign out from any existing Google session
      await GoogleSignin.signOut();
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices();
      
      // Perform Google Sign-In
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In response:', userInfo);
      if (!userInfo.data.idToken) {
        throw new Error('No ID Token found');
      }
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
      
      router.replace('/');
    } catch (error) {
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign in was cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play Services are not available';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Google Sign-In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8b9cb5"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8b9cb5"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleEmailAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {isLogin ? 'Login' : 'Register'} with Email
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.googleButton, loading && styles.buttonDisabled]} 
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Login with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={toggleAuthMode}
        disabled={loading}
      >
        <Text style={styles.toggleButtonText}>
          {isLogin ? 'Need to register?' : 'Already have an account?'}
        </Text>
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
  buttonDisabled: {
    opacity: 0.6,
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
  toggleButton: {
    marginTop: 20,
  },
  toggleButtonText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
});