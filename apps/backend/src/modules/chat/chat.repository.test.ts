import { describe, it, expect } from 'vitest';
import { useTestDb, testDb } from '../../core/test/db';
import { createChatRepository } from './chat.repository';
import { createUsersRepository } from '../users/users.repository';
import { createProductsRepository } from '../products/products.repository';

useTestDb();

async function seedConversation() {
  const usersRepo = createUsersRepository(testDb);
  const productsRepo = createProductsRepository(testDb);
  const chatRepo = createChatRepository(testDb);

  const buyer = await usersRepo.create({ email: 'buyer@example.com' });
  const seller = await usersRepo.create({ email: 'seller@example.com' });
  const { product } = await productsRepo.create({
    sellerId: seller.id, name: 'Sepatu', price: 100_000,
    description: '', category: 'fashion', subcategory: 'shoes',
    attributes: {}, listingStatus: 'active', approvalStatus: 'approved',
    expiresAt: null, locationName: '', locationPlaceId: '', locationLat: 0, locationLng: 0,
    photos: [],
  });
  const convo = await chatRepo.findOrCreateConversation({ productId: product.id, buyerId: buyer.id, sellerId: seller.id });
  return { buyer, seller, product, convo, chatRepo };
}

describe('ChatRepository', () => {
  it('findOrCreateConversation is idempotent', async () => {
    const { convo, chatRepo, product, buyer, seller } = await seedConversation();
    const again = await chatRepo.findOrCreateConversation({ productId: product.id, buyerId: buyer.id, sellerId: seller.id });
    expect(again.id).toBe(convo.id);
  });

  it('createMessage + listMessages round-trip', async () => {
    const { convo, buyer, chatRepo } = await seedConversation();
    await chatRepo.createMessage({ conversationId: convo.id, senderId: buyer.id, text: 'Halo', imageUrl: null });
    const msgs = await chatRepo.listMessages(convo.id, 50);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.text).toBe('Halo');
  });

  it('listConversations returns conversations for user', async () => {
    const { buyer, chatRepo } = await seedConversation();
    const list = await chatRepo.listConversations(buyer.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.conversation.buyerId).toBe(buyer.id);
  });

  it('isParticipant returns true for buyer and seller', async () => {
    const { convo, buyer, seller, chatRepo } = await seedConversation();
    expect(await chatRepo.isParticipant(convo.id, buyer.id)).toBe(true);
    expect(await chatRepo.isParticipant(convo.id, seller.id)).toBe(true);
    expect(await chatRepo.isParticipant(convo.id, 'random-uuid')).toBe(false);
  });
});
