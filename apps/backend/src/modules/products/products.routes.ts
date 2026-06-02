import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { presignSchema, createProductSchema, updateProductSchema, feedQuerySchema, searchQuerySchema } from './products.validation';

export const productsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Read routes — unauthenticated, registered before /:id to prevent param capture
productsRoutes.get('/feed', zValidator('query', feedQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await c.get('productsService').listFeed({ cursor, limit });
  return c.json(result);
});

productsRoutes.get('/search', zValidator('query', searchQuerySchema), async (c) => {
  const q = c.req.valid('query');
  const result = await c.get('productsService').searchProducts({
    q: q.q,
    category: q.category,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    sortBy: q.sortBy,
    cursor: q.cursor,
    limit: q.limit,
  });
  return c.json(result);
});

productsRoutes.get('/:id', async (c) => {
  const product = await c.get('productsService').getProduct(c.req.param('id'));
  return c.json({ product });
});

// Write routes — authenticated
productsRoutes.post('/images/presign', requireAuth, zValidator('json', presignSchema), async (c) => {
  const { count } = c.req.valid('json');
  const uploads = await c.get('productsService').presignUpload(count);
  return c.json({ uploads });
});

productsRoutes.patch('/:id', requireAuth, zValidator('json', updateProductSchema), async (c) => {
  const input = c.req.valid('json');
  const productId = c.req.param('id');
  const userId = c.get('user').id;
  await c.get('productsService').updateProduct(productId, userId, input);
  const product = await c.get('productsService').getProduct(productId);
  return c.json({ product });
});

productsRoutes.post('/', requireAuth, zValidator('json', createProductSchema), async (c) => {
  const input = c.req.valid('json');
  const { product, images } = await c.get('productsService').createProduct(c.get('user').id, input);
  return c.json(
    {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        attributes: product.attributes,
        listingStatus: product.listingStatus,
        approvalStatus: product.approvalStatus,
        expiresAt: product.expiresAt,
        location: {
          name: product.locationName,
          placeId: product.locationPlaceId,
          lat: product.locationLat,
          lng: product.locationLng,
        },
        photos: images
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(i => ({ url: i.url, position: i.position })),
        createdAt: product.createdAt,
      },
    },
    201,
  );
});
