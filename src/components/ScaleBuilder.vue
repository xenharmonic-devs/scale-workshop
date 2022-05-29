<script setup lang="ts">
defineProps<{
  lines: string[];
}>();
</script>

<template>
  <div id="tab-build-scale" class="columns-container">
    <div class="column scale-builder">
      <input id="scale-name" type="text" placeholder="Untitled scale" />
      <div class="btn-group">
        <a class="btn" href="#">New scale ▼</a>
        <a class="btn" href="#">Modify scale ▼</a>
      </div>

      <div class="control-group">
        <p class="control-group-heading">Scale data</p>
        <p v-for="(line, index) of lines" :key="index">{{ line }}</p>
        <p>Placeholder for scale graphic</p>
      </div>

      <div class="control-group">
        <p class="control-group-heading">Keyboard mapping</p>
        <label>Base frequency (note 1/1)</label>
        <input type="number" value="440" min="0.1" max="1000000"/>
        <label>Base MIDI note (note 1/1)</label>
        <input type="number" value="69" min="0" max="127" step="1" />
      </div>

      <div class="control-group">
        <label>Key colours</label>
        <p>
          A list of key colours, ascending from 1/1. Key colours are cosmetic only; they do not affect mapping.
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
      <p class="control-group-heading">Export current settings</p>
      <a href="#" class="btn">
        <p><strong>AnaMark v1 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>AnaMark v2 tuning (.tun)</strong></p>
        <p>Tuning file for various softsynths</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Scala scale (.scl)</strong></p>
        <p>Scale file for various softsynths. Note that this contains only intervals, and most synths will assume middle C ~261Hz unless a kbm file is also exported.</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Scala keyboard mapping (.kbm)</strong></p>
        <p>Keyboard mapping to accompany a .scl file. Maps the scale to a specific frequency.</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Max/MSP coll tuning (.txt)</strong></p>
        <p>For Max/MSP coll object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>PureData text tuning (.txt)</strong></p>
        <p>For PureData text object</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Kontakt tuning script (.txt)</strong></p>
        <p>For Native Instruments Kontakt</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Soniccouture tuning file (.nka)</strong></p>
        <p>For Soniccouture sample libraries</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Harmor pitch map (.fnv)</strong></p>
        <p>For Image-Line Harmor</p>
      </a>
      <a href="#" class="btn">
        <p><strong>Sytrus pitch map (.fnv)</strong></p>
        <p>For Image-Line Sytrus</p>
      </a>
      <a href="#" class="btn">
        <p><strong>bla bla bla (.etc)</strong></p>
        <p>This list of exporters has more stuff to add</p>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Content layout (small) */
div.columns-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-border);
}
div.column {
  background-color: var(--color-background);
}
div.scale-builder {
  padding: 1rem;
}
div.tuning-table {
  padding: 0rem;
}
div.exporters {
  padding: 1rem;
}

/* Content layout (medium) */
@media screen and (min-width: 600px) {
  div.columns-container {
    column-count: 2;
    column-gap: 1px;
    overflow: hidden;
  }
  div.column {
    overflow-y: auto;
  }
  div.scale-builder {
    width: 100%;
    height: 100%;
  }
  div.tuning-table {
    width: 100%;
    height: 66%;
  }
  div.exporters {
    width: 100%;
    height: 34%;
    border-top: 1px solid var(--color-border);
  }
}

/* Content layout (large) */
@media screen and (min-width: 1100px) {
  div.columns-container {
    column-count: 3;
  }
  div.column {
    height: 100%;
  }
  div.exporters {
    border: none;
  }
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
