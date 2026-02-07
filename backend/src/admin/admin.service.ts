import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Pet } from '../entities/pet.entity';
import { Device } from '../entities/device.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isLocked: false },
    });
    const lockedUsers = await this.userRepository.count({
      where: { isLocked: true },
    });
    const adminUsers = await this.userRepository.count({
      where: { isAdmin: true },
    });
    const totalPets = await this.petRepository.count();
    const totalDevices = await this.deviceRepository.count();
    
    // Count users who have logged in (have emailConfirmedAt set)
    const usersWithLogin = await this.userRepository.count({
      where: { emailConfirmedAt: Not(IsNull()) },
    });

    return {
      totalUsers,
      activeUsers,
      lockedUsers,
      adminUsers,
      usersWithLogin,
      totalPets,
      totalDevices,
    };
  }

  /**
   * Get all users with their profiles, pets, and devices
   */
  async getAllUsers() {
    const users = await this.userRepository.find({
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        // Get user's pets
        const pets = await this.petRepository.find({
          where: { userId: user.id },
          order: { createdAt: 'DESC' },
        });

        // Get user's devices
        const devices = await this.deviceRepository.find({
          where: { userId: user.id },
          order: { createdAt: 'DESC' },
        });

        // Check if user has logged in (has emailConfirmedAt)
        const hasLoggedIn = user.emailConfirmedAt !== null;

        return {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          isLocked: user.isLocked,
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil,
          createdAt: user.createdAt,
          lastLogin: user.emailConfirmedAt, // This indicates when they first confirmed/registered
          hasLoggedIn,
          petsCount: pets.length,
          devicesCount: devices.length,
          profile: user.profile ? {
            fullName: user.profile.fullName,
            phone: user.profile.phone,
            avatarUrl: user.profile.avatarUrl,
          } : null,
          pets: pets.map((pet) => ({
            id: pet.id,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            createdAt: pet.createdAt,
          })),
          devices: devices.map((device) => ({
            id: device.id,
            name: device.name,
            deviceId: device.deviceId,
            status: device.status,
            batteryLevel: device.batteryLevel,
            lastContact: device.lastContact,
          })),
        };
      })
    );

    return usersWithDetails;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      isLocked: user.isLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      createdAt: user.createdAt,
      profile: user.profile ? {
        fullName: user.profile.fullName,
        phone: user.profile.phone,
        avatarUrl: user.profile.avatarUrl,
      } : null,
    };
  }

  /**
   * Change user password
   */
  async changeUserPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.encryptedPassword = hashedPassword;
    // Reset failed login attempts when password is changed
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;

    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  /**
   * Unlock user account
   */
  async unlockUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    await this.userRepository.save(user);

    return { message: 'User account unlocked successfully' };
  }

  /**
   * Lock user account
   */
  async lockUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isLocked = true;
    user.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Lock for 24 hours

    await this.userRepository.save(user);

    return { message: 'User account locked successfully' };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isAdmin) {
      throw new BadRequestException('Cannot delete admin user');
    }

    await this.userRepository.remove(user);

    return { message: 'User deleted successfully' };
  }
}

