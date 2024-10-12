import{
    StyleSheet
  } from 'react-native';
  
export const styles = StyleSheet.create({
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
