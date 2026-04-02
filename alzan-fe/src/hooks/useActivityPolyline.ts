import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { cacheDirectory, copyAsync, getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { supabase } from '../lib/supabaseClient';
import {
  detectFormat,
  parseRouteFileWithSummary,
  type ParseRouteFileOptions,
  type ParsedRouteImport,
  type SupportedRouteFormat,
} from '../services/mapService';
import { useTranslation } from 'react-i18next';
import { Alert } from '../components/common/Alert';
import { Platform } from 'react-native';

const ROUTE_PICKER_TYPES: string[] = Platform.select({
  ios: [
    // iOS relies on UTI identifiers more than MIME strings.
    // Keep this broad to avoid provider-specific mismatches in TestFlight/internal builds.
    'public.item',
    'public.content',
    'public.data',
    'public.text',
    'public.xml',
    'public.json',
    // FIT files are often exposed as generic binary blobs by iOS providers.
    'application/octet-stream',
  ],
  android: [
    'application/vnd.ant.fit',
    'application/octet-stream',
    'application/gpx+xml',
    'application/vnd.google-earth.kml+xml',
    'application/json',
    'application/xml',
    'text/xml',
    'text/plain',
    '*/*',
  ],
  web: [
    '.fit',
    '.gpx',
    '.tcx',
    '.kml',
    '.json',
    '.txt',
    '.polyline',
    'application/vnd.ant.fit',
    'application/octet-stream',
    'application/gpx+xml',
    'application/vnd.google-earth.kml+xml',
    'application/json',
    'application/xml',
    'text/xml',
    'text/plain',
    '*/*',
  ],
  default: ['*/*'],
}) ?? ['*/*'];

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = (() => {
  const table = new Int16Array(123);
  table.fill(-1);

  for (let index = 0; index < BASE64_ALPHABET.length; index += 1) {
    table[BASE64_ALPHABET.charCodeAt(index)] = index;
  }

  return table;
})();

function decodeBase64(base64: string): Uint8Array {
  const clean = base64.replace(/\s/g, '');

  if (clean.length === 0) {
    return new Uint8Array(0);
  }

  if (clean.length % 4 !== 0) {
    throw new Error('Invalid base64 content.');
  }

  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const outputLength = (clean.length / 4) * 3 - padding;
  const output = new Uint8Array(outputLength);

  let buffer = 0;
  let bits = 0;
  let outIndex = 0;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (char === '=') {
      break;
    }

    const code = clean.charCodeAt(index);
    const value = code < BASE64_LOOKUP.length ? BASE64_LOOKUP[code] : -1;

    if (value < 0) {
      throw new Error('Invalid base64 content.');
    }

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output[outIndex] = (buffer >> bits) & 0xff;
      outIndex += 1;
    }
  }

  return output.subarray(0, outIndex);
}

/**
 * Cross-platform text file reader.
 *  - Web: document picker returns a blob/http URI — fetch() works.
 *  - Native: document picker copies to a file:// URI.
 *    We use layered fallbacks because providers behave differently across iOS/Android/release builds.
 */
async function readFileAsText(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Failed to read file (HTTP ${response.status})`);
    return response.text();
  }

  try {
    return await new File(uri).text();
  } catch {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`Failed to read file (HTTP ${response.status})`);
      return response.text();
    } catch {
      return readAsStringAsync(uri, { encoding: 'utf8' });
    }
  }
}

/**
 * Cross-platform binary file reader for FIT files.
 */
async function readFileAsBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Failed to read file (HTTP ${response.status})`);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  try {
    return await new File(uri).bytes();
  } catch {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`Failed to read file (HTTP ${response.status})`);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch {
      const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
      return decodeBase64(base64);
    }
  }
}

function extractFileExtensionFromName(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return name.slice(dotIndex);
}

function deriveFilename(asset: DocumentPicker.DocumentPickerAsset): string {
  if (asset.name && asset.name.trim().length > 0) {
    return asset.name;
  }

  const uriTail = asset.uri.split('/').pop();
  if (!uriTail) return 'route.txt';

  const decoded = decodeURIComponent(uriTail).trim();
  return decoded.length > 0 ? decoded : 'route.txt';
}

function isFitBinary(binary: Uint8Array): boolean {
  if (binary.length < 12) return false;
  const signature = String.fromCharCode(binary[8], binary[9], binary[10], binary[11]);
  return signature === '.FIT';
}

function detectFormatFromMimeType(mimeType: string): SupportedRouteFormat | null {
  if (!mimeType) return null;

  if (mimeType.includes('fit')) return 'fit';
  if (mimeType.includes('gpx')) return 'gpx';
  if (mimeType.includes('kml')) return 'kml';
  if (mimeType.includes('json')) return 'json';
  if (mimeType.includes('tcx')) return 'tcx';
  if (mimeType === 'text/plain') return 'polyline';

  return null;
}

function detectFormatFromTextContent(textContent: string): SupportedRouteFormat {
  const trimmed = textContent.trim();
  const lowered = trimmed.toLowerCase();

  if (lowered.startsWith('<gpx')) return 'gpx';
  if (lowered.includes('<trainingcenterdatabase')) return 'tcx';
  if (lowered.startsWith('<kml') || lowered.includes('<kml ')) return 'kml';
  if (lowered.startsWith('{') || lowered.startsWith('[')) return 'json';
  return 'polyline';
}

async function resolveReadableNativeUri(uri: string, filename: string): Promise<string> {
  if (Platform.OS === 'web' || uri.startsWith('file://')) {
    return uri;
  }

  try {
    if (!cacheDirectory) {
      return uri;
    }

    const extension = extractFileExtensionFromName(filename);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const destination = `${cacheDirectory}route-upload-${unique}${extension}`;

    await copyAsync({ from: uri, to: destination });
    const info = await getInfoAsync(destination);
    if (info.exists) {
      return destination;
    }
  } catch {
    // fall through to original URI
  }

  return uri;
}

/** Tag attached to errors thrown by parseRouteFile so we can show a specific message */
export const ROUTE_PARSE_ERROR_TAG = 'ROUTE_PARSE_ERROR';

interface UploadPolylineParams {
  sessionId: string;
}

interface UseUploadPolylineOptions {
  /** Called with the encoded polyline string immediately after a successful upload */
  onPolylineUploaded?: (polyline: string) => void;
}

interface UsePickPolylineOptions {
  /** Called with the encoded polyline string immediately after a successful parse */
  onPolylinePicked?: (polyline: string) => void;
  /** Called with parsed polyline + summary metrics from the uploaded file */
  onRoutePicked?: (route: ParsedRouteImport) => void;
  /** Optional FC máxima estimada para calcular zonas (ej. 220 - edad) */
  estimatedMaxHeartRate?: number | null;
}

interface PickPolylineMutationVars {
  estimatedMaxHeartRate?: number | null;
}

async function pickAndParseRouteFile(options?: ParseRouteFileOptions): Promise<ParsedRouteImport> {
  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      type: ROUTE_PICKER_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch (pickerError) {
    if (Platform.OS !== 'ios') {
      throw pickerError;
    }

    // Some iOS providers reject MIME-oriented filters in production builds.
    // Retry with the broadest supported UTI.
    result = await DocumentPicker.getDocumentAsync({
      type: ['public.item'],
      copyToCacheDirectory: true,
      multiple: false,
    });
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    throw new Error('CANCELLED');
  }

  const asset = result.assets[0];
  const filename = deriveFilename(asset);
  const uri = await resolveReadableNativeUri(asset.uri, filename);
  const mimeType = (asset.mimeType ?? '').toLowerCase();

  try {
    const formatFromName = detectFormat(filename);
    const formatFromMime = detectFormatFromMimeType(mimeType);
    const resolvedFormat = formatFromName ?? formatFromMime;

    if (resolvedFormat === 'fit') {
      const binary = await readFileAsBytes(uri);
      return parseRouteFileWithSummary(binary, formatFromName ? filename : `${filename}.fit`, options);
    }

    if (resolvedFormat) {
      const text = await readFileAsText(uri);
      const extension = resolvedFormat === 'polyline' ? 'txt' : resolvedFormat;
      return parseRouteFileWithSummary(text, formatFromName ? filename : `${filename}.${extension}`, options);
    }

    const binary = await readFileAsBytes(uri);
    if (isFitBinary(binary)) {
      return parseRouteFileWithSummary(binary, `${filename}.fit`, options);
    }

    const text = await readFileAsText(uri);
    const sniffedFormat = detectFormatFromTextContent(text);
    const extension = sniffedFormat === 'polyline' ? 'txt' : sniffedFormat;
    return parseRouteFileWithSummary(text, `${filename}.${extension}`, options);
  } catch (parseErr) {
    const tagged = new Error(ROUTE_PARSE_ERROR_TAG);
    console.error('[useActivityPolyline] Parse error:', parseErr);
    throw tagged;
  }
}

/**
 * Hook that provides a mutation to upload a GPS route file and store it as a
 * Google-encoded polyline on the activity session.
 */
export const useUploadPolyline = ({ onPolylineUploaded }: UseUploadPolylineOptions = {}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ sessionId }: UploadPolylineParams): Promise<string> => {
      const parsedRoute = await pickAndParseRouteFile();
      const polyline = parsedRoute.polyline;

      const { error: dbError } = await supabase
        .from('activity_sessions')
        .update({ route_polyline: polyline })
        .eq('id', sessionId);

      if (dbError) {
        console.error('[useUploadPolyline] Supabase update error:', dbError);
        throw new Error('DB_ERROR');
      }

      return polyline;
    },

    onSuccess: polyline => {
      queryClient.invalidateQueries({ queryKey: ['enduranceSessions'] });
      queryClient.invalidateQueries({ queryKey: ['completedSessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onPolylineUploaded?.(polyline);
    },

    onError: (error: Error) => {
      if (error.message === 'CANCELLED') return;
      console.error('[useUploadPolyline] Error:', error.message);
      const userMessage =
        error.message === ROUTE_PARSE_ERROR_TAG ? t('training.routeParseError') : t('training.routeUploadError');
      Alert.alert(t('training.routeMap'), userMessage);
    },
  });
};

/**
 * Hook that allows picking/parsing a route file without persisting it to DB.
 * Useful for form flows where the user can attach a route and only save it
 * once the full activity form is submitted.
 */
export const usePickPolyline = ({
  onPolylinePicked,
  onRoutePicked,
  estimatedMaxHeartRate,
}: UsePickPolylineOptions = {}) => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (vars?: PickPolylineMutationVars): Promise<ParsedRouteImport> =>
      pickAndParseRouteFile({ estimatedMaxHeartRate: vars?.estimatedMaxHeartRate ?? estimatedMaxHeartRate }),

    onSuccess: parsedRoute => {
      onPolylinePicked?.(parsedRoute.polyline);
      onRoutePicked?.(parsedRoute);
    },

    onError: (error: Error) => {
      if (error.message === 'CANCELLED') return;
      console.error('[usePickPolyline] Error:', error.message);
      const userMessage =
        error.message === ROUTE_PARSE_ERROR_TAG ? t('training.routeParseError') : t('training.routeUploadError');
      Alert.alert(t('training.routeMap'), userMessage);
    },
  });
};
