// https://docs.cypress.io/api/introduction/api.html

describe("Basic test", () => {
  it("visits the app root url", () => {
    cy.visit("/");
    cy.contains("h2", "Scale data");
  });
});
