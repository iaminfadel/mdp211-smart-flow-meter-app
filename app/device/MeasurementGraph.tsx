import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Path, Group } from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import database from '@react-native-firebase/database';

const GRAPH_WIDTH = Dimensions.get('window').width - 100;
const GRAPH_HEIGHT = 300;
const PADDING = 10;
const GRID_LINES = 10;
const X_AXIS_LABELS = 5;

const RANGES = {
  'Live': 5 * 60,
  '1H': 60 * 60,
  '24H': 24 * 60 * 60,
  '7D': 7 * 24 * 60 * 60,
};

const UNITS = {
  flowrate: 'kg/s',
  temperature: '°C',
  pressure: 'KPa'
};

const formatTimestamp = (timestamp, range) => {
  const date = new Date(timestamp * 1000);
  if (range === 'Live' || range === '1H') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } else if (range === '24H') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  }
};

export default function MeasurementGraph({ deviceId }) {
  const [timeRange, setTimeRange] = useState('Live');
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('flowrate');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState(0);

  const calculateDataBounds = (data, metric) => {
    if (data.length === 0) return { min: 0, max: 1 };
    const values = data.map(d => d[metric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding)
    };
  };

  const getGridLines = () => {
    const { min, max } = calculateDataBounds(data, selectedMetric);
    const lines = [];
    for (let i = 0; i <= GRID_LINES; i++) {
      const y = GRAPH_HEIGHT - (PADDING + (i / GRID_LINES) * (GRAPH_HEIGHT - 2 * PADDING));
      lines.push({
        y,
        value: min + (i / GRID_LINES) * (max - min)
      });
    }
    return lines;
  };

  const getTimeLabels = useMemo(() => {
    if (data.length === 0) return [];
    const timestamps = data.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeStep = (maxTime - minTime) / (X_AXIS_LABELS - 1);
    
    return Array.from({ length: X_AXIS_LABELS }, (_, i) => {
      const timestamp = minTime + i * timeStep;
      return {
        x: PADDING + (i * (GRAPH_WIDTH - 2 * PADDING) / (X_AXIS_LABELS - 1)),
        timestamp
      };
    });
  }, [data, timeRange]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      setScale(Math.max(1, Math.min(e.scale * scale, 5)));
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale > 1) {
        setOffset(Math.max(-GRAPH_WIDTH * (scale - 1), Math.min(0, offset + e.translationX)));
      }
    });

  const handleTap = (x, y) => {
    const { min, max } = calculateDataBounds(data, selectedMetric);
    const timestamps = data.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    const timeAtX = minTime + ((x - PADDING) / (GRAPH_WIDTH - 2 * PADDING)) * (maxTime - minTime);
    const closestPoint = data.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - timeAtX) < Math.abs(prev.timestamp - timeAtX) ? curr : prev;
    });

    const pointX = PADDING + ((closestPoint.timestamp - minTime) / (maxTime - minTime)) * (GRAPH_WIDTH - 2 * PADDING);
    const pointY = GRAPH_HEIGHT - (PADDING + (closestPoint[selectedMetric] - min) * (GRAPH_HEIGHT - 2 * PADDING) / (max - min));

    setSelectedPoint({
      x: pointX,
      y: pointY,
      value: closestPoint[selectedMetric],
      timestamp: closestPoint.timestamp
    });
  };

  const tapGesture = Gesture.Tap()
    .onBegin((e) => {
      runOnJS(handleTap)(e.x, e.y);
    })
    .onFinalize(() => {
      runOnJS(setSelectedPoint)(null);
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, tapGesture);

  useEffect(() => {
    const fetchData = async () => {
      const now = Date.now() / 1000;
      const startTime = now - RANGES[timeRange];
      
      const realtimeRef = database()
        .ref(`devices/${deviceId}/logs`)
        .orderByChild('timestamp')
        .startAt(startTime);

      const snapshot = await realtimeRef.once('value');
      const rawData = snapshot.val() || {};
      
      const formattedData = Object.entries(rawData)
        .map(([key, value]) => ({
          timestamp: value.timestamp,
          flowrate: value.flowrate,
          temperature: value.temperature,
          pressure: value.pressure,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setData(formattedData);
      setScale(1);
      setOffset(0);
    };

    fetchData();

    if (timeRange === 'Live') {
      const realtimeRef = database().ref(`devices/${deviceId}/real-time`);
      const handleRealtime = (snapshot) => {
        const newData = snapshot.val();
        if (newData) {
          setData(prevData => {
            const newPoint = {
              timestamp: Date.now() / 1000,
              flowrate: newData.flowrate,
              temperature: newData.temperature,
              pressure: newData.pressure,
            };
            
            const filteredData = prevData.filter(
              d => d.timestamp > (Date.now() / 1000) - RANGES['Live']
            );
            
            return [...filteredData, newPoint];
          });
        }
      };

      realtimeRef.on('value', handleRealtime);
      return () => realtimeRef.off('value', handleRealtime);
    }
  }, [deviceId, timeRange]);

  const renderGraph = () => {
    if (data.length === 0) return null;

    const { min, max } = calculateDataBounds(data, selectedMetric);
    const timestamps = data.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    const path = data.reduce((acc, point, i) => {
      const x = PADDING + ((point.timestamp - minTime) / (maxTime - minTime)) * (GRAPH_WIDTH - 2 * PADDING);
      const y = GRAPH_HEIGHT - (PADDING + (point[selectedMetric] - min) * (GRAPH_HEIGHT - 2 * PADDING) / (max - min));
      return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');

    const gridLines = getGridLines();

    return (
      <Canvas style={styles.canvas}>
        <Group>
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <Path
              key={`grid-${i}`}
              path={`M ${PADDING} ${line.y} H ${GRAPH_WIDTH - PADDING}`}
              color="rgba(255, 255, 255, 0.2)"
              style="stroke"
              strokeWidth={1}
            />
          ))}
          
          {/* Main path */}
          <Path
            path={path}
            color="#FFF"
            style="stroke"
            strokeWidth={2}
            strokeJoin="round"
            strokeCap="round"
          />
          
          {/* Selected point */}
          {selectedPoint && (
            <>
              <Path
                path={`M ${selectedPoint.x} ${PADDING} V ${GRAPH_HEIGHT - PADDING}`}
                color="rgba(255, 255, 255, 0.5)"
                style="stroke"
                strokeWidth={1}
              />
              <Path
                path={`M ${PADDING} ${selectedPoint.y} H ${GRAPH_WIDTH - PADDING}`}
                color="rgba(255, 255, 255, 0.5)"
                style="stroke"
                strokeWidth={1}
              />
              <Path
                path={`M ${selectedPoint.x - 4} ${selectedPoint.y - 4} h 8 v 8 h -8 z`}
                color="#FFF"
                style="fill"
              />
            </>
          )}
        </Group>
      </Canvas>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.metricContainer}>
        {['flowrate', 'temperature', 'pressure'].map((metric) => (
          <TouchableOpacity
            key={metric}
            style={[
              styles.metricButton,
              selectedMetric === metric && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric)}
          >
            <Text style={[
              styles.metricText,
              selectedMetric === metric && styles.metricTextActive
            ]}>
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <GestureHandlerRootView style={styles.graphWrapper}>
        <View style={styles.yAxisLabels}>
          {getGridLines().toReversed().map((line, i) => (
            <Text key={i} style={styles.yAxisLabel}>
              {line.value.toFixed(1)}
            </Text>
          ))}
        </View>

        <View style={styles.graphContainer}>
          <GestureDetector gesture={composed}>
            <View style={styles.graphContent}>
              {renderGraph()}
              {selectedPoint && (
                <View style={[styles.tooltip, { top: selectedPoint.y - 40, left: selectedPoint.x - 50 }]}>
                  <Text style={styles.tooltipText}>
                    {selectedPoint.value.toFixed(1)} {UNITS[selectedMetric]}
                  </Text>
                  <Text style={styles.tooltipText}>
                    {formatTimestamp(selectedPoint.timestamp, timeRange)}
                  </Text>
                </View>
              )}
            </View>
          </GestureDetector>
          <Text style={styles.unitLabel}>{UNITS[selectedMetric]}</Text>
        </View>
      </GestureHandlerRootView>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {getTimeLabels.map((label, i) => (
          <Text
            key={i}
            style={[
              styles.xAxisLabel,
              { position: 'absolute', left: label.x - 25 }
            ]}
          >
            {formatTimestamp(label.timestamp, timeRange)}
          </Text>
        ))}
      </View>

      <View style={styles.timeRangeContainer}>
        {Object.keys(RANGES).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00509D',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
  },
  graphWrapper: {
    flexDirection: 'row',
    height: GRAPH_HEIGHT,
    marginBottom: 20,
  },
  graphContainer: {
    flex: 1,
    height: GRAPH_HEIGHT,
  },
  graphContent: {
    flex: 1,
    height: GRAPH_HEIGHT,
  },
  canvas: {
    flex: 1,
    height: GRAPH_HEIGHT,
  },
  yAxisLabels: {
    width: 20,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
    marginRight: 5,
  },
  yAxisLabel: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'right',
  },
  xAxisLabels: {
    height: 10,
    width: GRAPH_WIDTH - PADDING,
    marginLeft: 45,
    marginBottom: 10,
  },
  xAxisLabel: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
  },
  unitLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#FFF',
    fontSize: 10,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#003F88',
  },
  timeRangeButtonActive: {
    backgroundColor: '#FFF',
  },
  timeRangeText: {
    color: '#FFF',
    fontSize: 12,
  },
  timeRangeTextActive: {
    color: '#003F88',
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  metricButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#003F88',
  },
  metricButtonActive: {
    backgroundColor: '#FFF',
  },
  metricText: {
    color: '#FFF',
    fontSize: 12,
  },
  metricTextActive: {
    color: '#003F88',
  },
});