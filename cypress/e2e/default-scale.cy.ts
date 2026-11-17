describe('Default scale modification', () => {
  for (const cancel of ['button', 'Escape', 'backdrop']) {
    it(`keeps empty source and closes the dropdown on ${cancel} cancellation`, () => {
      cy.visit('/')
      cy.get('#scale-data').clear()
      cy.wait(400) // Flush the scale editor debounce.
      cy.contains('a.btn', 'Modify scale').click()
      cy.contains('ul a', 'Repeat').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('#scale-data').should('have.value', '')
      if (cancel === 'button') cy.contains('button', 'Cancel').click()
      else if (cancel === 'Escape') cy.get('body').type('{esc}')
      else cy.get('.modal-mask').click('topLeft')
      cy.get('[role="dialog"]').should('not.exist')
      cy.get('#scale-data').should('have.value', '')
      cy.contains('.btn-dropdown-group', 'Modify scale').find('ul').should('not.be.visible')
      cy.get('#scale-data').should('be.focused')
      cy.contains('a.btn', 'Modify scale').click()
      cy.contains('ul a', 'Repeat').should('be.visible').click()
      cy.contains('button', 'Raw').click()
      cy.get('#scale-data').invoke('val').should('contain', 'repeat(')
      cy.get('#scale-data').invoke('val').should('contain', 'black')
    })
  }
})
