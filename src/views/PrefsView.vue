<template>
  <div class="synth">
    <h1>Preferences</h1>

    <h2>File export</h2>
    <div>
      <label>Line endings format</label><br />
      <select id="input_select_newlines"
        title="If your exported tuning files didn't work right on macOS synths, try changing this option to Unix.">
        <option value="windows">Microsoft (Windows/MS-DOS)</option>
        <option value="unix">Unix (Mac/Linux)</option>
      </select>
    </div>

    <h2>Appearance</h2>
    <div><input type="checkbox" /><label>Dark mode</label></div>
  </div>
</template>

<style></style>
