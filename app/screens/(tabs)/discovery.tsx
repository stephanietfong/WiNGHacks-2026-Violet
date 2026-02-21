// app/screens/tabs/discovery.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Discovery() {
  return (
    <LinearGradient
      colors={['#FE9FB8', '#FFC198']} // start → end colors
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Text style={styles.text}>Discovery</Text>

      {/* Semi-transparent box below the text */}
      <View style={styles.box}>
        
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'flex-start',
  },
  text: { 
    fontSize: 35, 
    fontWeight: 'bold', 
    marginBottom: 20,
    paddingLeft: 10,
  },
  box: {
    width: '98%',                 
    height: 620,                  
    backgroundColor: 'rgba(251, 233, 222, 0.5)', 
    borderRadius: 10,             
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',                
  },
});