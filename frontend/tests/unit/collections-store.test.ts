import { useCollectionsStore } from "@/stores/collections";
import { mockCollections } from "../../../tests/fixtures/frontend/mocks";

describe("useCollectionsStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useCollectionsStore.setState({
      collections: [],
    });
  });

  describe("initial state", () => {
    it("has empty collections array", () => {
      const state = useCollectionsStore.getState();
      expect(state.collections).toEqual([]);
    });
  });

  describe("addCollection", () => {
    it("adds a collection to the list", () => {
      const { addCollection } = useCollectionsStore.getState();
      addCollection(mockCollections[0]);

      const state = useCollectionsStore.getState();
      expect(state.collections).toEqual([mockCollections[0]]);
    });

    it("adds multiple collections", () => {
      const { addCollection } = useCollectionsStore.getState();
      addCollection(mockCollections[0]);
      addCollection(mockCollections[1]);

      const state = useCollectionsStore.getState();
      expect(state.collections).toEqual(mockCollections);
    });
  });

  describe("removeCollection", () => {
    it("removes a collection by id", () => {
      useCollectionsStore.setState({ collections: mockCollections });

      const { removeCollection } = useCollectionsStore.getState();
      removeCollection("1");

      const state = useCollectionsStore.getState();
      expect(state.collections).toHaveLength(1);
      expect(state.collections[0].id).toBe("2");
    });

    it("does not remove anything if id not found", () => {
      useCollectionsStore.setState({ collections: mockCollections });

      const { removeCollection } = useCollectionsStore.getState();
      removeCollection("nonexistent");

      const state = useCollectionsStore.getState();
      expect(state.collections).toEqual(mockCollections);
    });
  });

  describe("edge cases", () => {
    it("handles removing from empty list", () => {
      const { removeCollection } = useCollectionsStore.getState();
      removeCollection("1");

      const state = useCollectionsStore.getState();
      expect(state.collections).toEqual([]);
    });

    it("handles adding duplicate ids", () => {
      const { addCollection } = useCollectionsStore.getState();
      addCollection(mockCollections[0]);
      addCollection(mockCollections[0]);

      const state = useCollectionsStore.getState();
      expect(state.collections).toHaveLength(2);
      expect(state.collections[0]).toEqual(mockCollections[0]);
      expect(state.collections[1]).toEqual(mockCollections[0]);
    });

    it("preserves other collections when removing", () => {
      const additionalCollection = {
        ...mockCollections[0],
        id: "3",
        name: "Extra",
      };
      useCollectionsStore.setState({
        collections: [...mockCollections, additionalCollection],
      });

      const { removeCollection } = useCollectionsStore.getState();
      removeCollection("1");

      const state = useCollectionsStore.getState();
      expect(state.collections).toHaveLength(2);
      expect(state.collections.map((c: any) => c.id)).toEqual(["2", "3"]);
    });
  });
});
