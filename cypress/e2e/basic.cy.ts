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
    cy.get("a").contains("Build Scale").click();
    cy.get(".real-valued").should("have.value", "432");
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

describe("Scale generation/modification", () => {
  it("generates and approximates 5-TET", () => {
    cy.visit("/");

    cy.get("a").contains("New scale").click();
    cy.get("a").contains("Equal temperament").click();
    cy.get("button").contains("OK").click();
    cy.get("#scale-data").should("contain.value", "1\\5");

    cy.get("a").contains("Modify scale").click();
    cy.get("a").contains("Approximate by ratios").click();
    for (let i = 0; i < 5; ++i) {
      cy.get("button").contains("Apply").click();
    }
    cy.get("button").contains("Close").click();
    cy.get("#scale-data").should("contain.value", "8/7");
  });
});