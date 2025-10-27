#!/bin/bash

FILE="src/plugins/core-flashcards/services/FlashcardService.ts"

# Replace getDecks() method
sed -i '167,176s/.*/  async getDecks(): Promise<Deck[]> {\
    if (!this.storage) {\
      throw new Error('\''Storage not initialized'\'');\
    }\
    const result = await this.storage.get<Deck[]>(STORAGE_KEYS.DECKS);\
    return result?.data || [];\
  }/' "$FILE"

echo "Refactor complete!"
