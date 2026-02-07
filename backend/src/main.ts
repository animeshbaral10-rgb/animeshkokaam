import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EmailService } from './email/email.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Increase body size limit to 10MB (for base64 image uploads)
  const expressApp = app.getHttpAdapter().getInstance();
  const express = require('express');
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS — allow frontend URL, localhost, and ESP32/device requests
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/.*\.vercel\.app$/,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (ESP32, curl, mobile apps)
      if (!origin) return callback(null, true);

      for (const allowed of allowedOrigins) {
        if (typeof allowed === 'string' && origin === allowed) return callback(null, true);
        if (allowed instanceof RegExp && allowed.test(origin)) return callback(null, true);
      }

      // In development, allow everything
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

  // Listen on 0.0.0.0 so cloud hosts can reach the server
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port}`);

  // Verify email connection if configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    setTimeout(async () => {
      try {
        const emailService = app.get(EmailService);
        if (emailService?.verifyConnection) {
          emailService.verifyConnection().catch(() => {});
        }
      } catch (_) {}
    }, 1000);
  }
}

bootstrap();







