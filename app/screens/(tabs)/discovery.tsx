// app/screens/tabs/discovery.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
        <Text style={styles.name}>Sabrina</Text>
        <Text style={styles.age}>25</Text>
        <Image
          source={require("../../../assets/images/sample-woman-photo.jpg")}
          />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}
        >
          <Image
          source={require("../../../assets/images/reject-circle.png")}
          style={{margin: 15}}
          />
          <Image
          source={require("../../../assets/images/more-info-circle.png")}
          style={{margin: 15}}
          />
          <Image
          source={require("../../../assets/images/check-circle.png")}
          style={{margin: 15}}
          />
        </View>
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
    paddingLeft: 5,
  },
  box: {
    width: '98%',                 
    height: 620,                  
    backgroundColor: 'rgba(251, 233, 222, 0.5)', 
    borderRadius: 10,             
    alignItems: 'center',
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    paddingLeft: 10,
    paddingTop: 10,                
  },
  age: {
    fontSize: 25,
    fontWeight: '500',
    color: '#333',
    alignSelf: 'flex-start',
    paddingTop:0,
    paddingLeft: 10,
    paddingBottom: 15,                
  },
});