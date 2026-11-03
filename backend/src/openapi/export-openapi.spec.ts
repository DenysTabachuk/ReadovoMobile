import { NestApplication, NestFactory } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { spawnSync } from 'node:child_process';
import { Server as NetServer, Socket } from 'node:net';
import { resolve } from 'node:path';

import { TranslationsController } from '../translations/translations.controller';
import { TranslationsService } from '../translations/translations.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../auth/jwt.service';
import { exportOpenApi } from './export-openapi';

type HttpServiceAccessor = {
  readonly axiosRef: unknown;
};

jest.mock('../app.module', () => {
  throw new Error('Offline export must not import AppModule');
});
jest.mock('dotenv', () => {
  throw new Error('Offline export must not load environment files');
});

const OFFLINE_EXPORT_TIMEOUT_MS = 30_000;

describe('Offline OpenAPI export', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is deterministic without listening, initializing hooks or running production constructors', async () => {
    const init = jest
      .spyOn(NestApplication.prototype, 'init')
      .mockImplementation(() => {
        throw new Error('Offline export must not initialize lifecycle hooks');
      });
    const listen = jest
      .spyOn(NetServer.prototype, 'listen')
      .mockImplementation(() => {
        throw new Error('Offline export must not listen');
      });
    const connect = jest
      .spyOn(Socket.prototype, 'connect')
      .mockImplementation(() => {
        throw new Error('Offline export must not connect');
      });
    const create = jest.spyOn(NestFactory, 'create');
    const service = jest.spyOn(TranslationsService.prototype, 'translateWord');
    // AxiosInstance is callable, so Jest's types otherwise mistake this getter
    // for a method. This checked view keeps the same prototype and widens its value.
    const httpServiceAccessor: HttpServiceAccessor = HttpService.prototype;
    const axiosRef = jest
      .spyOn(httpServiceAccessor, 'axiosRef', 'get')
      .mockImplementation(() => {
        throw new Error(
          'Offline export must not initialize outbound HTTP services',
        );
      });
    const first = await exportOpenApi();
    const second = await exportOpenApi();
    expect(second).toEqual(first);
    expect(Object.keys(first.paths).sort()).toEqual([
      '/achievements/profile/me',
      '/api/translations/word',
    ]);
    expect(listen).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
    expect(service).not.toHaveBeenCalled();
    expect(axiosRef).not.toHaveBeenCalled();
    expect(create.mock.calls[0]?.[1]).toEqual({ logger: false, preview: true });
    const app: unknown = await create.mock.results[0]?.value;
    if (!(app instanceof NestApplication)) {
      throw new Error('Expected a metadata-only Nest application');
    }
    const translationService =
      app.get<TranslationsService>(TranslationsService);
    const translationController = app.get<TranslationsController>(
      TranslationsController,
    );
    expect(translationService).toBeInstanceOf(TranslationsService);
    // These fields are normally created by real constructors/field initializers.
    expect(Object.hasOwn(translationService, 'baseWordCache')).toBe(false);
    expect(Object.hasOwn(translationService, 'http')).toBe(false);
    expect(Object.hasOwn(translationController, 'translationsService')).toBe(
      false,
    );
    expect(Object.hasOwn(app.get<JwtService>(JwtService), 'secret')).toBe(
      false,
    );
    expect(app.get<PrismaService>(PrismaService)).toBeInstanceOf(PrismaService);
  });

  it(
    'exports in a fresh process without environment files, secret reads or network I/O',
    async () => {
      const environment: NodeJS.ProcessEnv = {};
      for (const name of ['PATH', 'SystemRoot', 'TEMP', 'TMP']) {
        const value = process.env[name];
        if (value !== undefined) environment[name] = value;
      }
      // Install the guards before loading ts-node or any application module, so
      // import-time behavior is covered as well as Nest's preview bootstrap.
      const script = String.raw`
      const fs = require('node:fs');
      const { basename } = require('node:path');
      const { Server, Socket } = require('node:net');
      Server.prototype.listen = function () { throw new Error('Unexpected HTTP listener'); };
      Socket.prototype.connect = function () { throw new Error('Unexpected network connection'); };
      globalThis.fetch = function () { throw new Error('Unexpected fetch request'); };
      function rejectEnvironmentFile(file) {
        const name = basename(String(file));
        if (name === '.env' || name.startsWith('.env.')) throw new Error('Unexpected environment file read');
      }
      const readFileSync = fs.readFileSync;
      fs.readFileSync = function (file, ...args) {
        rejectEnvironmentFile(file);
        return readFileSync.call(this, file, ...args);
      };
      const readFile = fs.readFile;
      fs.readFile = function (file, ...args) {
        rejectEnvironmentFile(file);
        return readFile.call(this, file, ...args);
      };
      const readFileAsync = fs.promises.readFile;
      fs.promises.readFile = async function (file, ...args) {
        rejectEnvironmentFile(file);
        return readFileAsync.call(this, file, ...args);
      };
      const secretNames = new Set(['DATABASE_URL', 'GOOGLE_TRANSLATE_API_KEY', 'GROQ_API_KEY', 'JWT_SECRET']);
      process.env = new Proxy(process.env, {
        get(target, key) {
          if (secretNames.has(key)) throw new Error('Unexpected secret read: ' + key);
          return Reflect.get(target, key);
        },
      });
      require(${JSON.stringify(require.resolve('ts-node'))}).register({
        project: ${JSON.stringify(resolve(__dirname, '../../tsconfig.json'))},
        experimentalResolver: true,
      });
      const { exportOpenApi } = require(${JSON.stringify(resolve(__dirname, 'export-openapi.ts'))});
      exportOpenApi().then(document => process.stdout.write(JSON.stringify(document)))
        .catch(error => { console.error(error.message); process.exitCode = 1; });
    `;
      const result = spawnSync(process.execPath, ['-e', script], {
        env: environment,
        encoding: 'utf8',
        timeout: OFFLINE_EXPORT_TIMEOUT_MS,
      });
      expect(result.error).toBeUndefined();
      // ts-node's experimental resolver uses fs.Stats on newer Node releases.
      // Allow only that upstream deprecation; unexpected stderr must still fail.
      expect(
        result.stderr.replace(
          /\(node:\d+\) \[DEP0180\] DeprecationWarning: fs\.Stats constructor is deprecated\.\r?\n\(Use `node --trace-deprecation \.\.\.` to show where the warning was created\)\r?\n/g,
          '',
        ),
      ).toBe('');
      expect(result.status).toBe(0);
      expect(result.stdout).toBe(JSON.stringify(await exportOpenApi()));
    },
    OFFLINE_EXPORT_TIMEOUT_MS,
  );

  it('describes explicit wire fields, request defaults, statuses and public access', async () => {
    const document = await exportOpenApi();
    const operation = document.paths['/api/translations/word']?.post;
    expect(operation).toMatchObject({
      operationId: 'translateWord',
      security: [],
      parameters: [],
      requestBody: { required: true },
    });
    expect(Object.keys(operation?.responses ?? {})).toEqual([
      '201',
      '400',
      '413',
      '500',
      '502',
      'default',
    ]);
    expect(document.components?.schemas).toMatchObject({
      TranslateWordRequest: {
        additionalProperties: false,
        required: ['word'],
        properties: {
          word: { type: 'string', minLength: 1, maxLength: 200 },
          context: { type: 'string', nullable: true, maxLength: 4000 },
          sourceLanguage: {
            type: 'string',
            default: 'en',
            enum: ['en'],
          },
          targetLanguage: {
            type: 'string',
            default: 'uk',
            enum: ['uk'],
          },
        },
      },
      TranslateWordResponse: {
        required: [
          'baseTranslation',
          'sourceLanguage',
          'targetLanguage',
          'translation',
          'word',
        ],
        properties: {
          context: { type: 'string', nullable: true },
          contextTranslation: { type: 'string' },
          contextualTranslation: { type: 'string' },
          sourceLanguage: { type: 'string', enum: ['en'] },
          targetLanguage: { type: 'string', enum: ['uk'] },
        },
      },
    });
    expect(operation?.responses['502']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            oneOf: [
              {
                properties: {
                  code: { enum: ['TRANSLATIONS_REQUEST_FAILED'] },
                  statusCode: { enum: [502] },
                },
              },
              {
                properties: {
                  code: { enum: ['TRANSLATIONS_UNAVAILABLE'] },
                  statusCode: { enum: [502] },
                },
              },
              {
                properties: {
                  code: { enum: ['REQUEST_REJECTED'] },
                  statusCode: { enum: [502] },
                },
              },
            ],
          },
        },
      },
    });
  });

  it('documents authenticated achievements separately from public translations', async () => {
    const document = await exportOpenApi();
    const operation = document.paths['/achievements/profile/me']?.get;
    expect(operation).toMatchObject({
      operationId: 'getAchievementsProfile',
      security: [{ bearer: [] }],
      parameters: [],
    });
    expect(operation).not.toHaveProperty('requestBody');
    expect(Object.keys(operation?.responses ?? {})).toEqual([
      '200',
      '400',
      '401',
      '404',
      '413',
      '500',
      'default',
    ]);
    expect(document.components?.securitySchemes).toMatchObject({
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    });
    expect(document.components?.schemas).toMatchObject({
      AchievementStatus: {
        required: [
          'badgeKey',
          'claimedAt',
          'coinsReward',
          'descriptionKey',
          'id',
          'isClaimed',
          'isUnlocked',
          'progressValue',
          'targetValue',
          'titleKey',
          'unlockedAt',
        ],
        properties: {
          claimedAt: { type: 'string', format: 'date-time', nullable: true },
          unlockedAt: { type: 'string', format: 'date-time', nullable: true },
          id: {
            enum: [
              'first_test_completed',
              'ten_tests_completed',
              'ten_words_learned',
              'first_thousand_coins',
            ],
          },
        },
      },
    });
  });
});
