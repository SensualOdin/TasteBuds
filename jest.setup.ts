/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-require-imports */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import type { Ref } from 'react';
import type { PressableProps } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn(() => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => ({ select: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null }), maybeSingle: jest.fn().mockResolvedValue({ data: null }), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis() })),
      rpc: jest.fn(() => ({ data: null })),
    })),
  };
});

jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = require('react');
  const { View } = require('react-native');
  const PressableMock = React.forwardRef(function PressableMock(
    props: PressableProps,
    ref: Ref<unknown>,
  ) {
    return React.createElement(
      View,
      { ...props, ref },
      typeof props.children === 'function'
        ? props.children({ pressed: false, hovered: false })
        : props.children,
    );
  });

  return PressableMock;
});
