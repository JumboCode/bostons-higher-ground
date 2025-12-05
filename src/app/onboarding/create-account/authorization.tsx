// auth.ts
export const auth = betterAuth({
  password: {
    minLength: 8,
    // Combined password validation logic for requirements:
    validate: async (password) => {
      const errors = [];
      if (!/[A-Z]/.test(password))
        errors.push("Must contain an uppercase letter.");
      if (!/[a-z]/.test(password))
        errors.push("Must contain a lowercase letter.");
      if (!/\d/.test(password))
        errors.push("Must contain a number.");
      if (errors.length > 0)
        throw new Error(errors.join(" "));
      return true;
    }
  },
  confirmPassword: {
    // validate confirm matches password (use in your UI logic)
    validate: async (confirm, { password }) => {
      if (confirm !== password)
        throw new Error("Passwords do not match.");
      return true;
    }
  }
});
