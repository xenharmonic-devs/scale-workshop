// https://docs.cypress.io/api/introduction/api.html

describe("Basic test", () => {
  it("visits the app root url", () => {
    cy.visit("/");
    cy.contains("h2", "Scale data");
  });
});

describe("404 page", () => {
  it("creates an octaplex", () => {
    cy.visit("/non-existing-page");
    cy.contains("h2", "Not found");
    cy.get("a")
      .last()
      .click()
      .then(() => {
        cy.get("button")
          .first()
          .click()
          .then(() => {
            cy.contains("h2", "Scale data");
            cy.get("#scale-name").should(
              "have.value",
              "The Octaplex (3 5 7 11)"
            );
          });
      });
  });
});
