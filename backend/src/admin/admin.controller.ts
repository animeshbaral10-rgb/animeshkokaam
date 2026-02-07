import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('statistics')
  async getStatistics() {
    return this.adminService.getUserStatistics();
  }

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/password')
  async changeUserPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.adminService.changeUserPassword(id, body.newPassword);
  }

  @Post('users/:id/unlock')
  async unlockUser(@Param('id') id: string) {
    return this.adminService.unlockUser(id);
  }

  @Post('users/:id/lock')
  async lockUser(@Param('id') id: string) {
    return this.adminService.lockUser(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}

