import Constants from 'expo-constants';
import { getExpoGoProjectConfig } from 'expo';

type HostCandidate = string | null | undefined;

function getHostname(value: HostCandidate) {
  const candidate = value?.trim();

  if (!candidate) {
    return null;
  }

  const valueWithScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(candidate)
    ? candidate
    : `http://${candidate}`;

  try {
    return new URL(valueWithScheme).hostname || null;
  } catch {
    return candidate.split('/')[0]?.split(':')[0]?.trim() || null;
  }
}

/**
 * Resolve a development hostname from an explicit override or available Expo metadata.
 *
 * Reads Expo runtime configuration, supporting both current and legacy manifest formats.
 *
 * @param explicitHost - Optional host or URL, tried before Expo host candidates.
 * @returns The first parsed hostname without scheme or port, falling back to localhost if
 *   no candidate is usable.
 * @example
 * getDevServerHost('http://192.168.1.20:8081/path');
 * // => '192.168.1.20'
 */
export function getDevServerHost(explicitHost?: string) {
  const constants = Constants as typeof Constants & {
    manifest?: {
      debuggerHost?: string;
      hostUri?: string;
    } | null;
    manifest2?: {
      extra?: {
        expoGo?: {
          debuggerHost?: string;
        };
        expoClient?: {
          hostUri?: string;
        };
      };
    } | null;
  };

  const hostCandidates = [
    explicitHost,
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest2?.extra?.expoGo?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
    constants.manifest?.debuggerHost,
    constants.manifest?.hostUri,
    getExpoGoProjectConfig()?.debuggerHost,
    constants.linkingUri,
  ];

  for (const hostCandidate of hostCandidates) {
    const hostname = getHostname(hostCandidate);

    if (hostname) {
      return hostname;
    }
  }

  return 'localhost';
}
