// https://on.cypress.io/api

describe("Basic test", () => {
  it("visits the app root url", () => {
    cy.visit("/");
    cy.contains("h2", "Scale data");
  });

  it("preserves the base frequency when changing tabs", () => {
    cy.visit("/");
    cy.get(".real-valued").clear()
    cy.get(".real-valued").type("432")
    cy.get(".real-valued").trigger("change")
    cy.get(".real-valued").should("have.value", "432");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(400); // Wait for debounce to expire.
    cy.get("a").contains("Synth").click();
    cy.url().should("contain", "f=");
  });
});

describe("404 page", () => {
  it("creates an octaplex", () => {
    cy.visit("/non-existing-page");
    cy.contains("h2", "Not found");
    cy.get("a").last().click();
    cy.get("button").first().click();
    cy.contains("h2", "Scale data");
    cy.get("#scale-name").should(
      "have.value",
      "The Octaplex (3 5 7 11)"
    );
  });
});
