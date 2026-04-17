import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import express from 'express';

export function applyHttpHardening(
  app: INestApplication,
  payloadLimit = '1mb',
) {
  // Helmet for API-only backend (disable CSP to avoid blocking third-party API calls from clients)
  // Note: crossOriginResourcePolicy is set to 'cross-origin' to allow static files to be accessed from different origins
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for static files
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(hpp());
  app.use(express.json({ limit: payloadLimit }));
  app.use(express.urlencoded({ limit: payloadLimit, extended: true }));
  app.use(compression());
}
