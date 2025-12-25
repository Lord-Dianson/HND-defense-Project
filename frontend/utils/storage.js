import { Preferences } from '@capacitor/preferences';

export async function writePref(key, value) {
  await Preferences.set({ key, value: JSON.stringify(value) });
}


export async function readPref(key) {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : null;
}


export async function removePref(key) {
  await Preferences.remove({ key });
}


export async function clearPrefs() {
  await Preferences.clear();
}

