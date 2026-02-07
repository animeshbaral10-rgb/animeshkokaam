// Export entity classes only (not enums)
export { User } from './user.entity';
export { Profile } from './profile.entity';
export { Pet } from './pet.entity';
export { Device } from './device.entity';
export { PetDeviceLink } from './pet-device-link.entity';
export { Location } from './location.entity';
export { Geofence } from './geofence.entity';
export { Alert } from './alert.entity';
export { AlertRule } from './alert-rule.entity';

// Export enums separately (for use in services, not for TypeORM)
export { DeviceStatus } from './device.entity';
export { GeofenceType } from './geofence.entity';
export { AlertType, AlertSeverity } from './alert.entity';
export { RuleType } from './alert-rule.entity';

