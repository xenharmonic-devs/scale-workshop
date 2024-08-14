// https://on.cypress.io/api

describe("Basic test", () => {
  it("visits the app root url", () => {
    cy.visit("/");
    cy.contains("h2", "Scale data");
  });

  it("preserves the base frequency when changing tabs", () => {
    cy.visit("/");
    cy.get("#auto-frequency").click()
    cy.get("#base-frequency").clear()
    cy.get("#base-frequency").type("432")
    cy.get("#base-frequency").trigger("change")
    cy.get("#base-frequency").should("have.value", "432");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(400); // Wait for debounce to expire.
    cy.get("a").contains("Synth").click();
    cy.get("a").contains("Build Scale").click();
    cy.get("#base-frequency").should("have.value", "432");
  });
});

describe("404 page", () => {
  it("creates an octaplex", () => {
    cy.visit("/non-existing-page");
    cy.contains("h2", "Not found");
    cy.get("#octaplex").click();
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
    cy.get("button").contains("Done").click();
    cy.get("#scale-data").should("contain.value", "8/7");
  });

  it("generates and displays 5 equal divisions of 1234.5 cents", () => {
    cy.visit("/");

    cy.get("a").contains("New scale").click();
    cy.get("a").contains("Equal temperament").click();
    cy.get("#equave").clear();
    cy.get("#equave").type('1234.5');
    cy.get("button").contains("OK").click();
    cy.get("#scale-data").should("contain.value", "1\\5 ed 1234.5");

    // This is how SonicWeave formats "3\5 ed 1234.5"
    cy.get('.tuning-table').should("contain", "2469\\4000");
  })
});
