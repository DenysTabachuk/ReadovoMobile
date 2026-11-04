import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../app.module';
import { exportOpenApi } from './export-openapi';

const DIAGNOSTIC_PATHS = [
  '/notifications/test-push/me',
  '/notifications/learning-reminders/dispatch',
  '/notifications/learning-reminders/dispatch/today/me',
];

describe('Application OpenAPI coverage', () => {
  it.each(['development', 'production'])(
    'covers every registered controller operation in %s',
    async (environment) => {
      // Scan the real application without the coverage allowlist. Preview skips
      // constructors/lifecycle hooks, so this audit needs no services or secrets.
      const app = await NestFactory.create(
        AppModule.forEnvironment(environment),
        { preview: true, logger: false },
      );
      try {
        const registered = SwaggerModule.createDocument(
          app,
          new DocumentBuilder().addBearerAuth().build(),
          { autoTagControllers: false },
        );
        const canonical = await exportOpenApi();
        expect(registered.paths).not.toHaveProperty('/');
        expect(canonical.paths).not.toHaveProperty('/');
        const expectedPaths = { ...canonical.paths };
        if (environment === 'production') {
          for (const path of DIAGNOSTIC_PATHS) delete expectedPaths[path];
        }
        expect(registered.paths).toEqual(expectedPaths);
        const operationIds = new Set<string>();
        for (const item of Object.values(registered.paths)) {
          for (const method of [
            'get',
            'post',
            'put',
            'patch',
            'delete',
          ] as const) {
            const operation = item?.[method];
            if (!operation) continue;
            expect(operation.operationId).toBeDefined();
            expect(operationIds.has(operation.operationId ?? '')).toBe(false);
            operationIds.add(operation.operationId ?? '');
            expect(operation.security).toBeDefined();
            for (const [status, response] of Object.entries(
              operation.responses,
            )) {
              if (!status.startsWith('2')) continue;
              expect(response).toHaveProperty('content');
            }
          }
        }
        expect(operationIds.size).toBe(environment === 'production' ? 48 : 51);
      } finally {
        await app.close();
      }
    },
  );
});
