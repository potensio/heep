export type KnowledgeEntry = {
  id: string;
  /** The fact added to the AI's memory (Bubble: `metadata_text`). */
  text: string;
  /** Whether this memory is active in the AI (Bubble: `is_activated`). */
  isActivated: boolean;
  /**
   * Pinecone vector id (Bubble: `pinecone_id`). Empty until the memory has
   * finished being embedded — we surface that as a "Processing" state.
   */
  pineconeId: string;
  /** Restaurant this memory belongs to (Bubble: `restaurant_id`). */
  restaurantId: string;
};
