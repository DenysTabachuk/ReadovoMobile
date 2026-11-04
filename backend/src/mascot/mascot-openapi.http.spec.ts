import Ajv, { type ValidateFunction } from 'ajv';
import request, { type Response } from 'supertest';

import { exportOpenApi } from '../openapi/export-openapi';
import {
  createMascotHttpApp,
  MASCOT_TEST_USER_ID,
  type MascotHttpTestApp,
} from './testing/create-mascot-http-app';

const routes = [
  {
    method: 'get',
    path: '/mascot/profile/me',
    schemaPath: '/mascot/profile/me',
    operationId: 'getMascotProfile',
    status: 200,
    equippedHeadItemId: null,
  },
  {
    method: 'post',
    path: '/mascot/profile/me/items/pirate-hat/buy',
    schemaPath: '/mascot/profile/me/items/{itemId}/buy',
    operationId: 'buyMascotItem',
    status: 201,
    equippedHeadItemId: null,
  },
  {
    method: 'post',
    path: '/mascot/profile/me/items/pirate-hat/equip',
    schemaPath: '/mascot/profile/me/items/{itemId}/equip',
    operationId: 'equipMascotItem',
    status: 201,
    equippedHeadItemId: 'pirate-hat',
  },
  {
    method: 'delete',
    path: '/mascot/profile/me/slots/head',
    schemaPath: '/mascot/profile/me/slots/{slot}',
    operationId: 'clearMascotSlot',
    status: 200,
    equippedHeadItemId: null,
  },
  {
    method: 'delete',
    path: '/mascot/profile/me/slots',
    schemaPath: '/mascot/profile/me/slots',
    operationId: 'clearAllMascotSlots',
    status: 200,
    equippedHeadItemId: null,
  },
] as const;

describe('Mascot OpenAPI wire contract (HTTP)', () => {
  let testApp: MascotHttpTestApp;
  const responseValidators = new Map<string, ValidateFunction<unknown>>();

  beforeAll(async () => {
    const document = await exportOpenApi();
    const validator = new Ajv({ strict: false, allErrors: true });
    validator.addSchema(document, 'mascot');
    for (const route of routes) {
      const operation = document.paths[route.schemaPath]?.[route.method];
      expect(operation?.operationId).toBe(route.operationId);
      expect(operation?.security).toEqual([{ bearer: [] }]);
      expect(operation).not.toHaveProperty('requestBody');
      const pointer = route.schemaPath
        .replaceAll('~', '~0')
        .replaceAll('/', '~1');
      for (const status of Object.keys(operation?.responses ?? {})) {
        responseValidators.set(
          `${route.operationId}:${status}`,
          validator.compile<unknown>({
            $ref: `mascot#/paths/${pointer}/${route.method}/responses/${status}/content/application~1json/schema`,
          }),
        );
      }
    }
  });

  function expectDocumentedResponse(
    operationId: string,
    response: Response,
  ): void {
    const validate = responseValidators.get(
      `${operationId}:${response.status}`,
    );
    if (!validate)
      throw new Error(`Missing ${operationId} response ${response.status}`);
    const body: unknown = response.body;
    if (!validate(body))
      throw new Error(
        `HTTP body violates OpenAPI: ${JSON.stringify(validate.errors)}`,
      );
  }

  beforeEach(async () => {
    testApp = await createMascotHttpApp();
  });
  afterEach(async () => testApp.app.close());

  it.each(routes)(
    'matches the serialized success body and status for $operationId',
    async (route) => {
      // The buy route intentionally exercises its existing already-owned success.
      testApp.prisma.userMascotProfile.upsert.mockResolvedValue({
        ...testApp.profile,
        ownedItemIds: ['pirate-hat'],
      });
      testApp.prisma.userMascotProfile.update.mockResolvedValue({
        ...testApp.profile,
        ownedItemIds: ['pirate-hat'],
        equippedHeadItemId: route.equippedHeadItemId,
      });
      const equippedItems =
        route.equippedHeadItemId === null ? {} : { head: 'pirate-hat' };
      await request(testApp.server)
        [route.method](route.path)
        .set('Authorization', testApp.authorization)
        .expect(route.status, {
          userId: MASCOT_TEST_USER_ID,
          ownedItemIds: ['pirate-hat'],
          equippedItems,
        })
        .expect((response: Response) =>
          expectDocumentedResponse(route.operationId, response),
        );
    },
  );

  it.each(routes)(
    'documents missing authentication before $operationId reaches persistence',
    async (route) => {
      await request(testApp.server)
        [route.method](route.path)
        .expect(401, {
          statusCode: 401,
          code: 'AUTH_AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.',
        })
        .expect((response: Response) =>
          expectDocumentedResponse(route.operationId, response),
        );
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each(routes)(
    'documents missing-user errors for $operationId',
    async (route) => {
      testApp.prisma.user.findUnique.mockResolvedValue(null);
      await request(testApp.server)
        [route.method](route.path)
        .set('Authorization', testApp.authorization)
        .expect(404, {
          statusCode: 404,
          code: 'MASCOT_USER_NOT_FOUND',
          message: 'User not found.',
        })
        .expect((response: Response) =>
          expectDocumentedResponse(route.operationId, response),
        );
    },
  );

  it.each([
    { action: 'buy', operationId: 'buyMascotItem' },
    { action: 'equip', operationId: 'equipMascotItem' },
  ])(
    'documents unknown catalog items and normalized blank IDs for $operationId',
    async ({ action, operationId }) => {
      await request(testApp.server)
        .post(`/mascot/profile/me/items/unknown/${action}`)
        .set('Authorization', testApp.authorization)
        .expect(400, {
          statusCode: 400,
          code: 'MASCOT_ITEM_UNKNOWN',
          message: 'Unknown mascot item.',
        })
        .expect((response: Response) =>
          expectDocumentedResponse(operationId, response),
        );
      await request(testApp.server)
        .post(`/mascot/profile/me/items/%20/${action}`)
        .set('Authorization', testApp.authorization)
        .expect(400)
        .expect((response: Response) =>
          expectDocumentedResponse(operationId, response),
        );
      expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it('documents a rejected slot without treating null as an empty response slot', async () => {
    await request(testApp.server)
      .delete('/mascot/profile/me/slots/shoes')
      .set('Authorization', testApp.authorization)
      .expect(400)
      .expect((response: Response) =>
        expectDocumentedResponse('clearMascotSlot', response),
      );
    const validate = responseValidators.get('getMascotProfile:200');
    expect(
      validate?.({
        userId: MASCOT_TEST_USER_ID,
        ownedItemIds: [],
        equippedItems: { head: null },
      }),
    ).toBe(false);
  });

  it('documents purchase and ownership business errors sharing validation HTTP 400', async () => {
    await request(testApp.server)
      .post('/mascot/profile/me/items/pirate-hat/buy')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_NOT_ENOUGH_COINS',
        message: 'Not enough coins.',
      })
      .expect((response: Response) =>
        expectDocumentedResponse('buyMascotItem', response),
      );
    await request(testApp.server)
      .post('/mascot/profile/me/items/pirate-hat/equip')
      .set('Authorization', testApp.authorization)
      .expect(400, {
        statusCode: 400,
        code: 'MASCOT_ITEM_NOT_OWNED',
        message: 'Mascot item is not owned.',
      })
      .expect((response: Response) =>
        expectDocumentedResponse('equipMascotItem', response),
      );
  });

  it('describes required path parameters and the backend-owned slot enum', async () => {
    const document = await exportOpenApi();
    expect(
      document.paths['/mascot/profile/me/items/{itemId}/buy']?.post?.parameters,
    ).toMatchObject([
      {
        name: 'itemId',
        in: 'path',
        required: true,
        schema: { type: 'string', minLength: 1 },
      },
    ]);
    expect(
      document.paths['/mascot/profile/me/slots/{slot}']?.delete?.parameters,
    ).toMatchObject([
      {
        name: 'slot',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/MascotAccessorySlot' },
      },
    ]);
    expect(document.components?.schemas).toMatchObject({
      MascotAccessorySlot: { type: 'string', enum: ['eyes', 'head'] },
    });
  });
});
