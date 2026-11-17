import type { Device, DeviceId } from './types';

export const DEVICES: readonly Device[] = [
  { id: 'desktop', label: 'Desktop', width: null, height: null },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { id: 'mobile', label: 'Mobile', width: 375, height: 667 },
];

export const getDevice = (id: DeviceId): Device => DEVICES.find((d) => d.id === id) ?? DEVICES[0];
