// Example document for "Try an example" in the designer and the dependency mapper.

import type { JsonObject } from './openapi';

export function sampleDocument(): JsonObject {
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  const json = (schema: unknown) => ({ 'application/json': { schema } });
  const error = { description: 'Unexpected error', content: json(ref('Error')) };
  return {
    openapi: '3.1.0',
    info: { title: 'Pet Store', version: '1.0.0', description: 'A small pet store API.' },
    servers: [{ url: 'https://api.example.com/v1', description: 'Production' }],
    tags: [
      { name: 'pets', description: 'Everything about pets' },
      { name: 'orders', description: 'Store orders' },
    ],
    paths: {
      '/pets': {
        get: {
          tags: ['pets'],
          summary: 'List pets',
          operationId: 'listPets',
          parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer', maximum: 100, example: 20 } }],
          responses: { '200': { description: 'A page of pets', content: json({ type: 'array', items: ref('Pet') }) }, default: error },
        },
        post: {
          tags: ['pets'],
          summary: 'Create a pet',
          operationId: 'createPet',
          requestBody: { required: true, content: json(ref('NewPet')) },
          responses: { '201': { description: 'Created', content: json(ref('Pet')) }, default: error },
        },
      },
      '/pets/{petId}': {
        get: {
          tags: ['pets'],
          summary: 'Get a pet',
          operationId: 'getPet',
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { '200': { description: 'The pet', content: json(ref('Pet')) }, '404': error },
        },
      },
      '/orders': {
        post: {
          tags: ['orders'],
          summary: 'Place an order',
          operationId: 'placeOrder',
          requestBody: { required: true, content: json(ref('Order')) },
          responses: { '201': { description: 'Order placed', content: json(ref('Order')) }, default: error },
        },
      },
    },
    components: {
      schemas: {
        NewPet: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', example: 'Rex' }, tag: { type: 'string' }, category: ref('Category') },
        },
        Pet: { allOf: [ref('NewPet'), { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } }] },
        Category: { type: 'object', properties: { name: { type: 'string', example: 'Dogs' }, parent: ref('Category') } },
        Order: {
          type: 'object',
          required: ['petId', 'quantity'],
          properties: { petId: { type: 'string', format: 'uuid' }, quantity: { type: 'integer', minimum: 1 }, pet: ref('Pet') },
        },
        Error: { type: 'object', required: ['code', 'message'], properties: { code: { type: 'integer' }, message: { type: 'string' } } },
      },
    },
  };
}
