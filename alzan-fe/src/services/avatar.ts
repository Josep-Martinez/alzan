import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient'; // Adapted import path to match project structure

function guessExt(uri: string) {
  const clean = uri.split('?')[0];
  const parts = clean.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

export async function uploadMyAvatar(userId: string) {
  // 1) usuario actual (passed as arg)
  if (!userId) throw new Error('Not authenticated');

  // 2) pick
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.9,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (res.canceled) return null;

  const uri = res.assets[0].uri;
  const ext = guessExt(uri);

  // 3) bytes
  const fileRes = await fetch(uri);
  const arrayBuffer = await fileRes.arrayBuffer();

  // 4) path fijo (para reemplazar)
  const path = `${userId}/avatar.${ext}`;

  // 5) upload (upsert true = reemplaza)
  const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`,
    upsert: true,
  });

  if (uploadErr) throw uploadErr;

  // 6) guardar en tu tabla users.avatar_url el PATH
  const { error: dbErr } = await supabase.from('users').update({ avatar_url: path }).eq('id', userId);

  if (dbErr) throw dbErr;

  return path;
}

// 5) Mostrar avatar (bucket privado) con Signed URL
export async function getMyAvatarSignedUrl(avatarPath: string) {
  if (!avatarPath) return null;
  // If it's already a full URL (legacy or public), return it
  if (avatarPath.startsWith('http')) return avatarPath;

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 60 * 60 * 24); // 24 hours (increased from 10min for better UX)

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
  return data.signedUrl;
}
