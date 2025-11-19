import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';
import type { TextInputContainerProps } from '../types/components';

const TextInputContainer: React.FC<TextInputContainerProps> = ({
  placeholder,
  value,
  setValue,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline={true}
        numberOfLines={1}
        cursorColor={colors.primary}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onChangeText={setValue}
        value={value}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202427',
    borderRadius: 12,
    marginVertical: 12,
  },
  input: {
    margin: 8,
    padding: 8,
    width: '90%',
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
  },
});

export default TextInputContainer;
