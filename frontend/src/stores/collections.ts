import { create } from "zustand";

interface Collection {
  id: string;
  name: string;
  // Add other fields
}

interface CollectionsState {
  collections: Collection[];
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  addCollection: (collection) =>
    set((state) => ({ collections: [...state.collections, collection] })),
  removeCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),
}));
