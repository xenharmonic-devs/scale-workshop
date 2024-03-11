// https://on.cypress.io/api

describe("Scale Workshop 2 compatibility", () => {
  it("ignores invalid scale lines", () => {
    cy.visit("/?l=1_7nF74_5F4_gtFe8_bF8_2c1F1kw_pFg_1jFw_3dF1s_2F1&version=2.4.0");
    cy.contains("h2", "Scale data");
    cy.get("#scale-data").should('have.value', '// 1\n275/256 black\n5/4 white\n605/512 white\n11/8 black\n3025/2048 white\n25/16 black\n55/32 white\n121/64 white\n2/1 black');
  });
});

describe("Scale Workshop 1 compatibility", () => {
  it("supports all line types", () => {
    cy.visit("?name=Test%20scale&data=1%2C23%0A1%5C3%0A3%2F2%0A1001.2%0A2%2F1&freq=420&midi=42&vert=5&horiz=1&colors=white%20black%20white%20black%20white&waveform=triangle&ampenv=perc-medium");
    cy.contains("h2", "Scale data");
    cy.get("#scale-data").should('have.value', '1.23e black\n1\\3 white\n3/2 black\n1001.2 white\n2/1 white');
  });
});
