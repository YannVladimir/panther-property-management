import { FurnishingType, PropertyStatus, RoomStatus } from '../types';

/** Backend enums are UPPER_SNAKE; several frontend unions use display-style strings that don't
 * reduce to a simple case transform (e.g. "Semi-Furnished" vs SEMI_FURNISHED), so these are
 * explicit two-way maps rather than string manipulation. */

const FURNISHING_TYPE_TO_FRONTEND: Record<string, FurnishingType> = {
  FULLY_FURNISHED: 'Fully Furnished',
  SELF_FURNISHED: 'Self Furnished',
  SEMI_FURNISHED: 'Semi-Furnished',
  EXECUTIVE_LUXURY: 'Executive Luxury',
};
const FURNISHING_TYPE_TO_BACKEND: Record<FurnishingType, string> = {
  'Fully Furnished': 'FULLY_FURNISHED',
  'Self Furnished': 'SELF_FURNISHED',
  'Semi-Furnished': 'SEMI_FURNISHED',
  'Executive Luxury': 'EXECUTIVE_LUXURY',
};

export function furnishingTypeToFrontend(value: string): FurnishingType {
  return FURNISHING_TYPE_TO_FRONTEND[value] ?? (value as FurnishingType);
}
export function furnishingTypeToBackend(value: FurnishingType): string {
  return FURNISHING_TYPE_TO_BACKEND[value] ?? value;
}

export function roomStatusToFrontend(value: string): RoomStatus {
  return value.toLowerCase() as RoomStatus;
}
export function roomStatusToBackend(value: RoomStatus): string {
  return value.toUpperCase();
}

export function propertyStatusToFrontend(value: string): PropertyStatus {
  return value.toLowerCase() as PropertyStatus;
}
export function propertyStatusToBackend(value: PropertyStatus): string {
  return value.toUpperCase();
}

export function rentalTypeStatusToFrontend(value: string): 'active' | 'inactive' {
  return value.toLowerCase() as 'active' | 'inactive';
}
export function rentalTypeStatusToBackend(value: 'active' | 'inactive'): string {
  return value.toUpperCase();
}
