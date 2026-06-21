import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { CharacterStage } from '../types';

const STAGE_EMOJI: Record<CharacterStage, string> = {
  pure: '🌿',
  ghost: '💼',
  slave: '🤖',
  zombie: '🧟',
  banned: '👔',
};

interface Props {
  stage: CharacterStage;
  size?: number;
}

export default function CharacterAvatar({ stage, size = 40 }: Props) {
  const bg = stage === 'pure' ? Colors.pureCharacter : Colors.contaminatedCharacter;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontSize: size * 0.5 }}>{STAGE_EMOJI[stage] ?? '🌿'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
