import { Injectable } from '@nestjs/common';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Geofence {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
}

@Injectable()
export class GeofencingService {
  private readonly EARTH_RADIUS_KM = 6371.0;

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @returns Distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = this.EARTH_RADIUS_KM * c;

    return distanceKm * 1000; // Convert to meters
  }

  /**
   * Check if a location is inside a geofence
   */
  isLocationInGeofence(
    location: Coordinates,
    geofence: Geofence,
  ): boolean {
    const lat = Number(location?.latitude);
    const lon = Number(location?.longitude);
    const cLat = Number(geofence?.centerLatitude);
    const cLon = Number(geofence?.centerLongitude);
    const r = Number(geofence?.radiusMeters);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      Number.isNaN(cLat) ||
      Number.isNaN(cLon) ||
      Number.isNaN(r) ||
      r <= 0
    ) {
      return false;
    }
    const distance = this.calculateDistance(lat, lon, cLat, cLon);
    return distance <= r;
  }

  /**
   * Check if a location is outside a geofence
   */
  isLocationOutsideGeofence(
    location: Coordinates,
    geofence: Geofence,
  ): boolean {
    return !this.isLocationInGeofence(location, geofence);
  }

  /**
   * Get distance from location to geofence center
   */
  getDistanceToGeofence(
    location: Coordinates,
    geofence: Geofence,
  ): number {
    return this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.centerLatitude,
      geofence.centerLongitude,
    );
  }

  /**
   * Find nearest geofence to a location
   */
  findNearestGeofence(
    location: Coordinates,
    geofences: Geofence[],
  ): { geofence: Geofence; distance: number } | null {
    if (geofences.length === 0) {
      return null;
    }

    let nearest: { geofence: Geofence; distance: number } | null = null;

    for (const geofence of geofences) {
      const distance = this.getDistanceToGeofence(location, geofence);
      if (!nearest || distance < nearest.distance) {
        nearest = { geofence, distance };
      }
    }

    return nearest;
  }

  /**
   * Check all geofences for a location and return status
   */
  checkGeofences(
    location: Coordinates,
    geofences: Geofence[],
  ): Array<{
    geofence: Geofence;
    isInside: boolean;
    distance: number;
  }> {
    return geofences.map((geofence) => ({
      geofence,
      isInside: this.isLocationInGeofence(location, geofence),
      distance: this.getDistanceToGeofence(location, geofence),
    }));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}














