import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const Skeleton = ({ width, height, borderRadius = 4, style }) => {
  const animatedValue = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: animatedValue },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#dcdde1',
    overflow: 'hidden',
  }
});

export default Skeleton;
