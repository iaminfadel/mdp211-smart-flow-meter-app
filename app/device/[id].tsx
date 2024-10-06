import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { LineChart } from 'react-native-chart-kit';

const timeRanges = [
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

const sampleData = (data, sampleSize) => {
  if (data.length <= sampleSize) return data;
  const interval = Math.floor(data.length / sampleSize);
  return data.filter((_, index) => index % interval === 0).slice(0, sampleSize);
};

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [device, setDevice] = useState(null);
  const [currentFlowrate, setCurrentFlowrate] = useState(null);
  const [currentTemperature, setCurrentTemperature] = useState(null);
  const [currentPressure, setCurrentPressure] = useState(null);

  const [flowrateData, setFlowrateData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [pressureData, setPressureData] = useState([]);

  const [ledState, setLedState] = useState(false);
  const [connectionState, setConnectionState] = useState('Offline');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[0]);

  const fetchHistoricalData = useCallback(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const now = Math.floor(Date.now() / 1000);
    const startTime = now - (selectedTimeRange.hours * 60 * 60);

    const flowrateRef = database().ref(`devices/${id}/flowrate`);
    const temperatureRef = database().ref(`devices/${id}/temperature`);
    const pressureRef = database().ref(`devices/${id}/pressure`);


    flowrateRef.orderByChild('timestamp').startAt(startTime).limitToLast(1000).once('value', (snapshot) => {
      const data = snapshot.val();
      const flowrateList = data ? Object.values(data).map(d => ({ timestamp: d.timestamp, value: d.flowrate })) : [];
      setFlowrateData(flowrateList);
    });

    temperatureRef.orderByChild('timestamp').startAt(startTime).limitToLast(1000).once('value', (snapshot) => {
      const data = snapshot.val();
      const temperatureList = data ? Object.values(data).map(d => ({ timestamp: d.timestamp, value: d.temperature })) : [];
      setTemperatureData(temperatureList);
    });

    pressureRef.orderByChild('timestamp').startAt(startTime).limitToLast(1000).once('value', (snapshot) => {
      const data = snapshot.val();
      const pressureList = data ? Object.values(data).map(d => ({ timestamp: d.timestamp, value: d.pressure })) : [];
      setPressureData(pressureList);
    });
  }, [id, selectedTimeRange]);

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const deviceRef = database().ref(`users/${userId}/devices/${id}`);
    const flowrateRef = database().ref(`devices/${id}/flowrate`);
    const temperatureRef = database().ref(`devices/${id}/temperature`);
    const pressureRef = database().ref(`devices/${id}/pressure`);
    const ledStateRef = database().ref(`devices/${id}/led_state`);
    const connectionRef = database().ref(`users/${userId}/devices/${id}/status`);

    const deviceUnsubscribe = deviceRef.on('value', (snapshot) => {
      setDevice(snapshot.val());
    });

    const currentFlowrateUnsubscribe = flowrateRef.limitToLast(1).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestFlowrate = Object.values(data)[0];
        setCurrentFlowrate(latestFlowrate.flowrate);
      }
    });

    const currentTemperatureUnsubscribe = temperatureRef.limitToLast(1).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestTemperature = Object.values(data)[0];
        setCurrentTemperature(latestTemperature.temperature);
      }
    });

    const currentPressureUnsubscribe = pressureRef.limitToLast(1).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const latestPressure = Object.values(data)[0];
        setCurrentPressure(latestPressure.pressure);
      }
    });

    const ledStateUnsubscribe = ledStateRef.on('value', (snapshot) => {
      setLedState(snapshot.val());
    });

    const connectionStateUnsubscribe = connectionRef.on('value', (snapshot) => {
      console.log(snapshot.val());
      setConnectionState(snapshot.val() ? 'Online' : 'Offline');
    });

    fetchHistoricalData();

    return () => {
      deviceRef.off('value', deviceUnsubscribe);
      flowrateRef.off('value', currentFlowrateUnsubscribe);
      temperatureRef.off('value', currentTemperatureUnsubscribe);
      pressureRef.off('value', currentPressureUnsubscribe);
      ledStateRef.off('value', ledStateUnsubscribe);
      connectionRef.off('value', connectionStateUnsubscribe);
    };
  }, [id, fetchHistoricalData]);

  const toggleLedState = useCallback(() => {
    const ledStateRef = database().ref(`devices/${id}/led_state`);
    ledStateRef.set(!ledState);
  }, [id, ledState]);

  const sampledFlowrateData = useMemo(() => {
    return sampleData(flowrateData, 10);
  }, [flowrateData]);

  const sampledTemperatureData = useMemo(() => {
    return sampleData(temperatureData, 10);
  }, [temperatureData]);

  const sampledPressureData = useMemo(() => {
    return sampleData(pressureData, 10);
  }, [pressureData]);

  const renderChart = useCallback((data, title, color, dataKey) => {
    if (data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: data.map(d => new Date(d.timestamp * 1000).toLocaleTimeString()),
      datasets: [{
        data: data.map(d => d.value),
        color: (opacity = 1) => color,
        strokeWidth: 2
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 30}
          height={220}
          chartConfig={{
            backgroundColor: '#003366',
            backgroundGradientFrom: '#003366',
            backgroundGradientTo: '#0066cc',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "2",
              strokeWidth: "1",
              stroke: "#ffa726"
            }
          }}
          bezier
          style={styles.chart}
          getDotColor={(dataPoint, dataPointIndex) => color}
          yAxisLabel={dataKey === 'flowrate' ? 'kg/s' : '%'}
          yAxisSuffix=""
        />
      </View>
    );
  }, []);

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
          <Text style={styles.mainReadingValue}>{currentFlowrate !== null ? `${currentFlowrate.toFixed(1)} kg/s` : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.currentReadings}>

        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Temperature</Text>
          <Text style={styles.readingValue}>{currentTemperature !== null ? `${currentTemperature.toFixed(1)}°C` : 'N/A'}</Text>
        </View>
        <View style={styles.readingBox}>
          <Text style={styles.readingTitle}>Pressure</Text>
          <Text style={styles.readingValue}>{currentPressure !== null ? `${currentPressure.toFixed(1)} KPa` : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.ledContainer}>
        <Text style={styles.ledText}>LED State: {ledState ? 'ON' : 'OFF'}</Text>
        <TouchableOpacity style={styles.ledButton} onPress={toggleLedState}>
          <Text style={styles.ledButtonText}>Toggle LED</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRangeContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range.label}
            style={[
              styles.timeRangeButton,
              selectedTimeRange.label === range.label && styles.selectedTimeRangeButton
            ]}
            onPress={() => {
              setSelectedTimeRange(range);
              fetchHistoricalData();
            }}
          >
            <Text style={[
              styles.timeRangeButtonText,
              selectedTimeRange.label === range.label && styles.selectedTimeRangeButtonText
            ]}>{range.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* {renderChart(sampledFlowrateData, 'Flowrate History', '#FF6B6B', 'flowrate')}
      {renderChart(sampledTemperatureData, 'Temperature History', '#4ECDC4', 'temperature')} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001a33',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginTop: 30,
    backgroundColor: '#003366',
  },
  text: {
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
  },
  connectionIndicator: {
    padding: 5,
    borderRadius: 5,
  },
  connectionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currentReadings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#004080',
  },
  readingBox: {
    alignItems: 'center',
  },
  mainReadingTitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 5,
  },
  mainReadingValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  readingTitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    padding: 15,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  ledContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#003366',
    padding: 15,
    marginTop: 20,
  },
  ledText: {
    color: '#fff',
    fontSize: 18,
  },
  ledButton: {
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
  },
  ledButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#004080',
  },
  timeRangeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#0066cc',
  },
  selectedTimeRangeButton: {
    backgroundColor: '#003366',
  },
  timeRangeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedTimeRangeButtonText: {
    color: '#ffa726',
  },
});