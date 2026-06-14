export type KnowledgeEntry = {
  id: string;
  /** The fact added to the AI's memory (Bubble: `metadata_text`). */
  text: string;
  /** Whether this memory is active in the AI (Bubble: `is_activated`). */
  isActivated: boolean;
};
