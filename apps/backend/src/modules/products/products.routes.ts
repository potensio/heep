import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { productsService } from './products.service';
import { presignSchema, createProductSchema } from './products.validation';

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

productsRoutes.post('/images/presign', requireAuth, zValidator('json', presignSchema), async (c) => {
  const { count } = c.req.valid('json');
  const uploads = await productsService.presignUpload(count);
  return c.json({ uploads });
});

productsRoutes.post('/', requireAuth, zValidator('json', createProductSchema), async (c) => {
  const input = c.req.valid('json');
  const { product, images } = await productsService.createProduct(c.get('user').id, input);
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
