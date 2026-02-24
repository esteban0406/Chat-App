import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('/')
  getRoot() {
    return { message: 'Welcome to the Chat-App backend!' };
  }
}
