/**
 * AmanGuard Family - Common Data Types & Enums
 * Matches Android Core Models and Firebase Cloud Functions Schema
 */

export type PermState =
  | 'GRANTED'
  | 'DENIED'
  | 'NOT_REQUESTED'
  | 'NEEDS_MANUAL'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'REVOKED'
  | 'NEEDS_REAUTH';

export type PermissionState = PermState;

export type PermId =
  | 'location_fine'
  | 'location_background'
  | 'location_services'
  | 'notifications'
  | 'usage_access'
  | 'battery_opt'
  | 'camera'
  | 'microphone';

export type ConnectionStatus = 'ONLINE' | 'STALE' | 'OFFLINE' | 'UNKNOWN';

export type CommandType =
  | 'location.refresh'
  | 'permissions.check'
  | 'sync.now'
  | 'rules.sync'
  | 'live.start'
  | 'live.stop'
  | string;

export type LiveSessionType = 'screen' | 'camera' | 'camera_front' | 'camera_back' | 'mic';

export type LiveSessionStatus =
  | 'requested'
  | 'connecting'
  | 'active'
  | 'ended'
  | 'stopped'
  | 'rejected'
  | 'failed';

export interface LocationRecord {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  provider: string; // 'fused' | 'gps' | 'network'
  source: string; // 'periodic' | 'instant'
  deviceTime: number;
  serverTime: number;
  addressLabel?: string;
}

export interface Geofence {
  id: string;
  deviceId: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  enabled: boolean;
  notifyEnter: boolean;
  notifyExit: boolean;
  createdAt: number;
}

export interface AppUsageItem {
  pkg: string;
  name: string;
  category: string;
  seconds: number;
}

export interface DailyUsage {
  date: string;
  totalSeconds: number;
  apps: AppUsageItem[];
}

export interface CommandItem {
  id: string;
  familyId: string;
  deviceId: string;
  type: CommandType;
  status: 'pending' | 'sent' | 'received' | 'applied' | 'failed' | 'delivered' | 'unsupported';
  result?: string;
  payload?: any;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface AlertItem {
  id: string;
  familyId: string;
  deviceId: string;
  childName?: string;
  type: 'geofence_enter' | 'geofence_exit' | 'permission_revoked' | 'battery_low' | 'screen_time_limit' | string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
}

export interface PairingCode {
  code: string;
  familyId: string;
  familyName: string;
  childName: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface LiveSession {
  id: string;
  familyId: string;
  deviceId: string;
  parentId: string;
  childId: string;
  type: LiveSessionType;
  status: LiveSessionStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  requestedBy: string;
  quality?: string;
  endReason?: string;
  cameraFacing?: 'front' | 'back';
}

export interface DeviceStatus {
  lastSeen?: number;
  battery: number;
  isCharging: boolean;
  networkType: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  manufacturer: string;
}

export interface PermissionRecord {
  state: PermissionState;
  checkedAt: number;
}

export interface DeviceSettings {
  locationIntervalMin: number;
}

export interface Device {
  id: string;
  familyId: string;
  childName: string;
  name: string;
  avatarColor?: string;
  status: 'active' | 'unlinked' | 'pending';
  deviceUid: string;
  fcmToken?: string;
  createdAt: number;
  settings: DeviceSettings;
  deviceStatus: DeviceStatus;
  currentPermissions: Record<PermId | string, PermissionRecord>;
  lastLocation?: LocationRecord | null;
  unlinkedAt?: number;
  unlinkedBy?: 'parent' | 'device';
}

export interface Family {
  id: string;
  name: string;
  ownerUid: string;
  members: string[];
  retentionDays: number;
  createdAt: number;
}
