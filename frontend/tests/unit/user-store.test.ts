import { useUserStore } from "@/stores/user";
import { mockUsers } from "../../../tests/fixtures/frontend/mocks";

describe("useUserStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useUserStore.setState({
      user: null,
    });
  });

  describe("initial state", () => {
    it("has null user initially", () => {
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe("setUser", () => {
    it("sets the user", () => {
      const { setUser } = useUserStore.getState();
      setUser(mockUsers[0]);

      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUsers[0]);
    });

    it("can update user information", () => {
      const { setUser } = useUserStore.getState();
      setUser(mockUsers[0]);

      const updatedUser = { ...mockUsers[0], name: "Updated Name" };
      setUser(updatedUser);

      const state = useUserStore.getState();
      expect(state.user?.name).toBe("Updated Name");
    });
  });

  describe("logout", () => {
    it("clears the user", () => {
      useUserStore.setState({ user: mockUsers[0] });

      const { logout } = useUserStore.getState();
      logout();

      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it("handles logout when no user is set", () => {
      const { logout } = useUserStore.getState();
      logout();

      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles setting user to null", () => {
      useUserStore.setState({ user: mockUsers[0] });

      const { setUser } = useUserStore.getState();
      setUser(null as any);

      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });

    it("preserves user data integrity", () => {
      const { setUser } = useUserStore.getState();
      setUser(mockUsers[0]);

      const state = useUserStore.getState();
      expect(state.user).toHaveProperty("id");
      expect(state.user).toHaveProperty("name");
      expect(state.user).toHaveProperty("email");
      expect(state.user).toHaveProperty("createdAt");
    });
  });
});
