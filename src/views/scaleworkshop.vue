<template>
  <div class="about">
    <img
      alt="Scale Workshop logo"
      class="logo"
      src="@/assets/logo.svg"
      width="100"
      height="100"
    />
    <h1>Scale Workshop 2</h1>
    <p><em>Because there are more than 12 notes</em></p>
    <p>Contributors list</p>
    <hr />
    <ul>
      <li><a href="#">GitHub</a></li>
      <li><a href="#">Report issue</a></li>
    </ul>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .about hr {
    width: 20rem;
    margin: 1rem auto;
  }
}
</style>
