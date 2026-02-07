import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (!user || !user.encryptedPassword) {
      // Increment failed attempts for existing user
      if (user) {
        await this.incrementFailedLoginAttempts(user);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked (admins can bypass lock)
    if (user.isLocked && !user.isAdmin) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account is locked. Please contact administrator.');
      } else {
        // Lock expired, unlock the account
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);
      }
    } else if (user.isLocked && user.isAdmin) {
      // Admin accounts should never be locked - auto-unlock them
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.userRepository.save(user);
      this.logger.warn(`Admin account ${user.email} was locked but has been auto-unlocked`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.encryptedPassword);
    
    if (!isPasswordValid) {
      await this.incrementFailedLoginAttempts(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.isLocked) {
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockedUntil = null;
      await this.userRepository.save(user);
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      ...user.profile,
    };
  }

  /**
   * Increment failed login attempts and lock account after 5 attempts
   * Admin accounts are never auto-locked
   */
  private async incrementFailedLoginAttempts(user: User): Promise<void> {
    // Admin accounts should never be auto-locked
    if (user.isAdmin) {
      this.logger.warn(`Admin account ${user.email} had failed login attempt but will not be locked`);
      // Still track attempts for logging, but don't lock
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await this.userRepository.save(user);
      return;
    }

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock account after 5 failed attempts (only for non-admin users)
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      user.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Lock for 24 hours
      this.logger.warn(`Account ${user.email} locked due to ${user.failedLoginAttempts} failed login attempts`);
    }

    await this.userRepository.save(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { email: user.email, sub: user.id };
    
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      encryptedPassword: hashedPassword,
      emailConfirmedAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    // Create profile
    const profile = this.profileRepository.create({
      id: savedUser.id,
      fullName: registerDto.fullName || null,
    });

    await this.profileRepository.save(profile);

    // Return user with profile
    const userWithProfile = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['profile'],
    });

    // Send welcome email (non-blocking - don't wait for it)
    this.logger.log(`Attempting to send welcome email to ${registerDto.email}...`);
    this.emailService.sendWelcomeEmail(
      registerDto.email,
      registerDto.fullName,
    ).catch((error) => {
      // Log error but don't fail registration
      this.logger.error(`Failed to send welcome email to ${registerDto.email}:`, error);
    });

    return {
      id: userWithProfile.id,
      email: userWithProfile.email,
      ...userWithProfile.profile,
    };
  }

  async validateJwtPayload(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['profile'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      ...user.profile,
    };
  }

  async updateProfile(userId: string, updateProfileDto: any) {
    const profile = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    // Update profile fields
    if (updateProfileDto.fullName !== undefined) {
      profile.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.avatarUrl !== undefined) {
      profile.avatarUrl = updateProfileDto.avatarUrl;
    }
    if (updateProfileDto.phone !== undefined) {
      profile.phone = updateProfileDto.phone;
    }

    await this.profileRepository.save(profile);

    // Return same shape as /auth/me so frontend keeps isAdmin and profile fields
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      ...user.profile,
    };
  }
}
