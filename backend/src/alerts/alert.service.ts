import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Alert, AlertType, AlertSeverity } from '../entities/alert.entity';
import { AlertRule, RuleType } from '../entities/alert-rule.entity';
import { Device } from '../entities/device.entity';
import { Geofence } from '../entities/geofence.entity';
import { GeofencingService, Coordinates } from '../geofences/geofencing.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface CreateAlertDto {
  userId: string;
  petId?: string;
  deviceId?: string;
  geofenceId?: string;
  alertType: AlertType;
  title: string;
  message?: string;
  severity?: AlertSeverity;
  location?: Coordinates;
  metadata?: any;
}

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
    private geofencingService: GeofencingService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Process alert rules when a new location is received
   */
  async processLocationAlerts(
    deviceId: string,
    location: Coordinates,
    speedKmh?: number,
  ): Promise<void> {
    // Get device with pet links
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
      relations: ['petLinks', 'petLinks.pet'],
    });

    if (!device) return;

    // Get active pet link
    const activeLink = device.petLinks?.find(link => link.isActive);
    const petId = activeLink?.petId;

    // Get active alert rules for this user/pet
    const rules = await this.alertRuleRepository.find({
      where: [
        { userId: device.userId, isActive: true },
        ...(petId ? [{ petId, isActive: true }] : []),
      ],
    });

    if (rules.length === 0) return;

    // Check geofences for entry/exit
    await this.checkGeofences(device, location, petId);

    // Process each rule
    for (const rule of rules) {
      if (rule.petId && rule.petId !== petId) continue;
      await this.processRule(rule, device, location, speedKmh, petId);
    }
  }

  /**
   * Check geofences for entry/exit
   */
  private async checkGeofences(device: Device, location: Coordinates, petId?: string): Promise<void> {
    const allGeofences = await this.geofenceRepository.find({
      where: { userId: device.userId, isActive: true },
    });

    // Only evaluate geofences that apply to this pet (no pet = all pets, or matching petId)
    const geofences = allGeofences.filter(
      (g) => g.petId == null || g.petId === petId,
    );

    for (const geofence of geofences) {
      if (geofence.type !== 'circle') continue;

      const centerLat = Number(geofence.centerLatitude);
      const centerLng = Number(geofence.centerLongitude);
      const radiusM = Number(geofence.radiusMeters);
      if (
        Number.isNaN(centerLat) ||
        Number.isNaN(centerLng) ||
        Number.isNaN(radiusM) ||
        radiusM <= 0
      ) {
        continue;
      }

      const isInside = this.geofencingService.isLocationInGeofence(location, {
        id: geofence.id,
        centerLatitude: centerLat,
        centerLongitude: centerLng,
        radiusMeters: radiusM,
      });

      // Use last alert for this device+geofence to decide state transition (avoid duplicate alerts)
      const lastAlert = await this.alertRepository.findOne({
        where: {
          geofenceId: geofence.id,
          deviceId: device.id,
          alertType: In([AlertType.GEOFENCE_ENTRY, AlertType.GEOFENCE_EXIT]),
        },
        order: { createdAt: 'DESC' },
      });

      const lastWasEntry = lastAlert?.alertType === AlertType.GEOFENCE_ENTRY;

      if (geofence.alertOnExit && !isInside && lastWasEntry) {
        await this.createAlert({
          userId: device.userId,
          petId,
          deviceId: device.id,
          geofenceId: geofence.id,
          alertType: AlertType.GEOFENCE_EXIT,
          title: 'Geofence Exit Alert',
          message: `Pet exited geofence: ${geofence.name}`,
          severity: AlertSeverity.HIGH,
          location,
        });
      }

      if (geofence.alertOnEntry && isInside && !lastWasEntry) {
        await this.createAlert({
          userId: device.userId,
          petId,
          deviceId: device.id,
          geofenceId: geofence.id,
          alertType: AlertType.GEOFENCE_ENTRY,
          title: 'Geofence Entry Alert',
          message: `Pet entered geofence: ${geofence.name}`,
          severity: AlertSeverity.MEDIUM,
          location,
        });
      }
    }
  }

  /**
   * Process a single alert rule
   */
  private async processRule(
    rule: AlertRule,
    device: Device,
    location: Coordinates,
    speedKmh?: number,
    petId?: string,
  ): Promise<void> {
    const conditions = rule.conditions as any;

    switch (rule.ruleType) {
      case RuleType.BATTERY:
        if (device.batteryLevel && conditions.batteryThresholdPercent) {
          if (device.batteryLevel <= conditions.batteryThresholdPercent) {
            await this.createAlert({
              userId: device.userId,
              petId,
              deviceId: device.id,
              alertType: AlertType.LOW_BATTERY,
              title: 'Low Battery Alert',
              message: `Device battery is at ${device.batteryLevel}%`,
              severity: AlertSeverity.MEDIUM,
            });
          }
        }
        break;

      case RuleType.INACTIVITY:
        // Handled by checkInactivityAlerts
        break;
    }
  }

  /**
   * Check for device offline and low battery alerts
   */
  async checkDeviceStatusAlerts(userId: string): Promise<void> {
    const devices = await this.deviceRepository.find({
      where: { userId, status: 'active' as any },
      relations: ['petLinks', 'petLinks.pet'],
    });

    for (const device of devices) {
      const activeLink = device.petLinks?.find(link => link.isActive);
      const petId = activeLink?.petId;

      // Check for low battery (threshold: 20%)
      if (device.batteryLevel !== null && device.batteryLevel <= 20) {
        // Check if we already sent a low battery alert recently (within last hour)
        const recentBatteryAlert = await this.alertRepository.findOne({
          where: {
            deviceId: device.id,
            alertType: AlertType.LOW_BATTERY,
          },
          order: { createdAt: 'DESC' },
        });

        if (!recentBatteryAlert || (Date.now() - recentBatteryAlert.createdAt.getTime()) > 3600000) {
          await this.createAlert({
            userId: device.userId,
            petId,
            deviceId: device.id,
            alertType: AlertType.LOW_BATTERY,
            title: 'Low Battery Alert',
            message: `Device ${device.name || device.deviceId} battery is at ${device.batteryLevel}%`,
            severity: device.batteryLevel <= 10 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          });
        }
      }

      // Check for device offline (no contact for 15 minutes)
      if (device.lastContact) {
        const minutesSinceLastContact = (Date.now() - device.lastContact.getTime()) / (1000 * 60);
        if (minutesSinceLastContact > 15) {
          // Check if we already sent an offline alert recently (within last hour)
          const recentOfflineAlert = await this.alertRepository.findOne({
            where: {
              deviceId: device.id,
              alertType: AlertType.DEVICE_OFFLINE,
            },
            order: { createdAt: 'DESC' },
          });

          if (!recentOfflineAlert || (Date.now() - recentOfflineAlert.createdAt.getTime()) > 3600000) {
            await this.createAlert({
              userId: device.userId,
              petId,
              deviceId: device.id,
              alertType: AlertType.DEVICE_OFFLINE,
              title: 'Device Offline',
              message: `Device ${device.name || device.deviceId} has been offline for ${Math.round(minutesSinceLastContact)} minutes`,
              severity: AlertSeverity.HIGH,
            });
          }
        }
      } else {
        // Device never contacted
        const recentOfflineAlert = await this.alertRepository.findOne({
          where: {
            deviceId: device.id,
            alertType: AlertType.DEVICE_OFFLINE,
          },
          order: { createdAt: 'DESC' },
        });

        if (!recentOfflineAlert || (Date.now() - recentOfflineAlert.createdAt.getTime()) > 3600000) {
          await this.createAlert({
            userId: device.userId,
            petId,
            deviceId: device.id,
            alertType: AlertType.DEVICE_OFFLINE,
            title: 'Device Never Connected',
            message: `Device ${device.name || device.deviceId} has never sent location data`,
            severity: AlertSeverity.HIGH,
          });
        }
      }
    }
  }

  /**
   * Check for inactivity alerts
   */
  async checkInactivityAlerts(userId: string): Promise<void> {
    const rules = await this.alertRuleRepository.find({
      where: {
        userId,
        ruleType: RuleType.INACTIVITY,
        isActive: true,
      },
    });

    if (rules.length === 0) return;

    // Get all devices for this user
    const devices = await this.deviceRepository.find({
      where: { userId, status: 'active' as any },
      relations: ['petLinks', 'petLinks.pet'],
    });

    for (const device of devices) {
      const activeLink = device.petLinks?.find(link => link.isActive);
      const petId = activeLink?.petId;

      for (const rule of rules) {
        if (rule.petId && rule.petId !== petId) continue;

        const conditions = rule.conditions as any;
        const thresholdMinutes = conditions.inactivityThresholdMinutes || 30;

        if (!device.lastContact) {
          await this.createAlert({
            userId: device.userId,
            petId,
            deviceId: device.id,
            alertType: AlertType.DEVICE_OFFLINE,
            title: 'Device Never Connected',
            message: `Device ${device.name} has never sent location data`,
            severity: AlertSeverity.HIGH,
          });
          continue;
        }

        const minutesSinceLastSeen = (Date.now() - device.lastContact.getTime()) / (1000 * 60);

        if (minutesSinceLastSeen > thresholdMinutes) {
          await this.createAlert({
            userId: device.userId,
            petId,
            deviceId: device.id,
            alertType: AlertType.INACTIVITY,
            title: 'Device Inactivity Alert',
            message: `Device ${device.name} has been inactive for ${Math.round(minutesSinceLastSeen)} minutes`,
            severity: AlertSeverity.MEDIUM,
          });
        }
      }
    }
  }

  /**
   * Create an alert
   */
  async createAlert(dto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      userId: dto.userId,
      petId: dto.petId,
      deviceId: dto.deviceId,
      geofenceId: dto.geofenceId,
      alertType: dto.alertType,
      title: dto.title,
      message: dto.message,
      severity: dto.severity || AlertSeverity.MEDIUM,
      locationLatitude: dto.location?.latitude,
      locationLongitude: dto.location?.longitude,
      metadata: dto.metadata,
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Get unread count for this user
    const unreadCount = await this.getUnreadCount(dto.userId);

    // Broadcast real-time alert and unread count
    this.realtimeGateway.broadcastAlert(dto.userId, savedAlert);
    this.realtimeGateway.broadcastUnreadCount(dto.userId, unreadCount);

    return savedAlert;
  }

  /**
   * Get all alerts for a user
   */
  async findAll(userId: string, isRead?: boolean) {
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.alertRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['pet', 'device', 'geofence'],
    });
  }

  /**
   * Get unread alert count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.alertRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.isRead = true;
    alert.readAt = new Date();
    const savedAlert = await this.alertRepository.save(alert);

    // Broadcast updated unread count
    const unreadCount = await this.getUnreadCount(userId);
    this.realtimeGateway.broadcastUnreadCount(userId, unreadCount);

    return savedAlert;
  }
}
