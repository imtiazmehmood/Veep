import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    marginVertical: 10,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    color: colors.text,
    fontSize: 17,
    minWidth: 280,
    marginVertical: 12,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  callIdText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  callIdValue: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

