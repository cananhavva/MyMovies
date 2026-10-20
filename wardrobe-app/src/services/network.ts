import NetInfo from '@react-native-community/netinfo';

/** `isInternetReachable` is null while unknown; only a definite "no" counts as offline. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
