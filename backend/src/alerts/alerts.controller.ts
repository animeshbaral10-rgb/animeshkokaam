import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertService: AlertService) {}

  @Get()
  async findAll(@Request() req, @Query('isRead') isRead?: string) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.alertService.findAll(req.user.id, isReadBool);
  }

  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    const count = await this.alertService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.alertService.markAsRead(id, req.user.id);
  }

  @Post('check-inactivity')
  async checkInactivity(@Request() req) {
    await this.alertService.checkInactivityAlerts(req.user.id);
    return { message: 'Inactivity check completed' };
  }

  @Post('check-device-status')
  async checkDeviceStatus(@Request() req) {
    await this.alertService.checkDeviceStatusAlerts(req.user.id);
    return { message: 'Device status check completed' };
  }
}







