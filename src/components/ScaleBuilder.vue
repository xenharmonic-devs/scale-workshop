<script setup lang="ts">
defineProps<{
  lines: string[];
}>();
</script>

<template>
  <div id="tab-build-scale" class="grid-container">
    <div class="column scale-builder">
      <input id="scale-name" type="text" placeholder="Untitled scale" />
      <a class="btn" href="#">New scale ▼</a>
      <a class="btn" href="#">Modify scale ▼</a>
      <a class="btn" href="#">Save .scl</a>

      <div class="control-group">
        <p class="control-group-heading">Scale data</p>
        <p v-for="(line, index) of lines" :key="index">{{ line }}</p>
      </div>

      <div class="control-group">
        <p class="control-group-heading">Base tuning</p>
        <label>Base frequency (note 1/1)</label>
        <input type="text" value="440" />
        <label>Base MIDI note (note 1/1)</label>
        <input type="text" value="69" />
      </div>

      <a class="btn" href="#">Save .kbm</a>

      <div class="control-group">
        <p class="control-group-heading">Key colours</p>
        <label>Key colours</label>
        <p>
          A list of key colours, ascending from 1/1. Key colours are purely
          cosmetic and do not affect mapping.
        </p>
        <textarea>
white black white white black white black white white black white black</textarea
        >
      </div>
    </div>
    <div class="column tuning-table">
      <table>
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
    <div class="column exporters">
      <a href="#" class="btn">
        <p><strong>Download AnaMark v1 tuning (.tun)</strong></p>
        <p>For various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download AnaMark v2 tuning (.tun)</strong></p>
        <p>For various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download Max/MSP coll tuning (.txt)</strong></p>
        <p>For Max/MSP coll object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download PureData text tuning (.txt)</strong></p>
        <p>For PureData text object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download Kontakt tuning script (.txt)</strong></p>
        <p>For Native Instruments Kontakt</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download Harmor pitch map (.fnv)</strong></p>
        <p>For Image-Line Harmor</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download Sytrus pitch map (.fnv)</strong></p>
        <p>For Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Download bla bla bla (.etc)</strong></p>
        <p>This list of exporters has more stuff to add</p>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Content layout */
div.grid-container {
  display: grid;
  height: 100%;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1px;
  background-color: var(--color-border);
}
div.column {
  max-height: 100%;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--color-background);
}
div.tuning-table {
  padding: 0rem;
}

/* UI elements */
#scale-name {
  width: 100%;
  font-size: 1.4em;
  margin-bottom: 1rem;
  padding: 0.3rem;
}
div.exporters .btn {
  width: 100%;
  display: block;
  margin-bottom: 1rem;
  margin-left: 0;
}

/* Tuning table */
.tuning-table table {
  width: 100%;
  text-align: center;
  border-spacing: 0px;
}
.tuning-table table th {
  font-weight: bold;
  border-bottom: 1px solid var(--color-border);
}
.tuning-table table tr:nth-of-type(2n) {
  background-color: var(--color-background-soft);
}
</style>
