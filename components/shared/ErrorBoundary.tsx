import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureError } from '@/lib/sentry';
import colors from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    captureError(error, 'ErrorBoundary', 'fatal');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            {this.props.fallbackMessage || "Quelque chose s'est mal passé"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 12,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Une erreur inattendue est survenue. Pas d'inquiétude, tes données sont en
            sécurité.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={{
                fontSize: 12,
                color: colors.error,
                marginTop: 16,
                textAlign: 'center',
                fontFamily: 'monospace',
                backgroundColor: '#FFF0F0',
                padding: 12,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              marginTop: 32,
              backgroundColor: colors.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
