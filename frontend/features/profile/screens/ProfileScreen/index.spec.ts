import { Redirect } from 'expo-router';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import type { AuthUserProfile, useAuth } from '@/features/auth';
import { AuthenticatedProfile } from './components/authenticatedProfile';
import ProfileScreen from '.';

type ProfileAuthState = Pick<
  ReturnType<typeof useAuth>,
  'currentUser' | 'isAuthenticated' | 'isHydratingAuth'
>;

let mockAuth: ProfileAuthState;
jest.mock('@/features/auth', () => ({ useAuth: () => mockAuth }));
jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null) }));
jest.mock('@/components/fullScreenLoader', () => ({
  FullScreenLoader: jest.fn(() => null),
}));
jest.mock('./components/authenticatedProfile', () => ({
  AuthenticatedProfile: jest.fn(() => null),
}));

const USER: AuthUserProfile = {
  id: 'reader-a',
  email: 'reader@example.test',
  displayName: 'Reader',
};

beforeEach(() => {
  mockAuth = {
    currentUser: null,
    isAuthenticated: false,
    isHydratingAuth: false,
  };
});

it('shows the loader while authentication is being hydrated', () => {
  mockAuth.isHydratingAuth = true;
  expect(ProfileScreen()).toMatchObject({ type: FullScreenLoader });
});

it.each([
  { scenario: 'signed out', isAuthenticated: false, currentUser: USER },
  { scenario: 'missing profile', isAuthenticated: true, currentUser: null },
  {
    scenario: 'missing user ID',
    isAuthenticated: true,
    currentUser: { ...USER, id: null },
  },
])(
  'redirects to login for $scenario instead of rendering a profile',
  ({ isAuthenticated, currentUser }) => {
    mockAuth = { currentUser, isAuthenticated, isHydratingAuth: false };
    expect(ProfileScreen()).toMatchObject({
      type: Redirect,
      props: { href: '/login' },
    });
  },
);

it('passes the authenticated owner to the profile content', () => {
  mockAuth = {
    currentUser: USER,
    isAuthenticated: true,
    isHydratingAuth: false,
  };
  expect(ProfileScreen()).toMatchObject({
    type: AuthenticatedProfile,
    props: {
      userId: 'reader-a',
      email: 'reader@example.test',
      displayName: 'Reader',
    },
  });
});
