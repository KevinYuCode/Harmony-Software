import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { employeeId: string; password: string }) {
    return this.authService.login(body.employeeId, body.password);
  }

  @Post('admin-login')
  async adminLogin(@Body() body: { password: string }) {
    return this.authService.adminLogin(body.password);
  }
}
