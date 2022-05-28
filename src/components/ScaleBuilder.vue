<script setup lang="ts">
defineProps<{
  lines: string[];
}>();
</script>

<template>
  <div id="tab-build-scale" class="grid-container">
    <div class="column">
      <input id="scale-name" type="text" placeholder="Untitled scale" />
      <p v-for="(line, index) of lines" :key="index">{{ line }}</p>
      <input name="" id="" type="button" value="New scale ▼" class="" title="">
      <input name="" id="" type="button" value="Modify scale ▼" class="" title="">
      <input name="" id="" type="button" value="Save .scl" class="" title="">

      <hr />
      <label>Base frequency (note 1/1)</label>
      <input type="text" value="440" />
      <label>Base MIDI note (note 1/1)</label>
      <input type="text" value="69" />
      <a class="btn" href="#">Export tuning ▼</a>
      <a class="btn" href="#">Save .kbm</a>
      <label>Key colours</label>
      A list of key colours, ascending from 1/1. Key colours are purely cosmetic and do not affect mapping.
      <textarea>white black white white black white black white white black white black</textarea>
    </div>
    <div class="column">
      <table id="tuning-table">
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>#</th>
            <th>Freq</th>
            <th>Cents</th>
            <th>Ratio</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td>0</td>
            <td>10Hz</td>
            <td>-10000.000</td>
            <td>0.001</td>
            <td>1/1</td>
          </tr>
          <tr>
            <td></td>
            <td>1</td>
            <td>11Hz</td>
            <td>-10000.000</td>
            <td>0.001</td>
            <td>11/10</td>
          </tr>
          <tr>
            <td></td>
            <td>2</td>
            <td>12Hz</td>
            <td>-10000.000</td>
            <td>0.001</td>
            <td>6/5</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="column">
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
      <p>test</p>
    </div>
  </div>
</template>

<style scoped>
/* Content layout (grid) */
div.grid-container {
  display: grid;
  height: 100%;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1px;
  background-color: #ccc;
}
div.column {
  max-height: 100%;
  overflow-y: auto;
  padding: 1rem;
  background-color: white;
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: large;
}

textarea {
  width: 100%;
}

/* Tuning table */
#tuning-table {
  width: 100%;
  text-align: center;
  border-spacing: 0px;
}
#tuning-table th {
  font-weight: bold;
}
#tuning-table tr:nth-of-type(2) {
  background-color: rgba(128,128,128,0.2)
}
</style>
