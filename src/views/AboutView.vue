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
    <p>
      <em>Because there are more than 12 notes</em>
    </p>
    <div class="control-group">
      <div class="control">
        <a
          class="btn"
          href="https://github.com/xenharmonic-devs/scale-workshop/wiki"
          target="_blank"
          >User guide</a
        >
        <a class="btn" href="https://github.com/xenharmonic-devs/scale-workshop"
          >GitHub</a
        >
        <a
          class="btn"
          href="https://github.com/xenharmonic-devs/scale-workshop/issues"
          >Report an issue</a
        >
      </div>
    </div>
    <hr />
    <div id="contributors">
      <h2>Contributors</h2>
      <p>
        Sevish - <i>UI/UX designer</i><br />
        Lumi Pakkanen - <i>lead developer</i><br />
        Vincenzo Sicurella - <i>developer</i><br />
        Lajos Mészáros - <i>developer</i>
      </p>
    </div>
  </div>
</template>

<style>
.about {
  height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
hr {
  width: 100%;
  margin-bottom: 1rem;
}
.about > * {
  max-width: 30rem;
}
#contributors h2 {
  border: unset;
  text-align: center;
}
</style>
