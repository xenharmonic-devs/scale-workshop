// Component state used by RankOne, RankTwo and TemperScale

import { computedAndError, fractionToString } from "@/utils";
import { Subgroup, type TuningOptions } from "temperaments";
import { computed, ref, watch, type Ref } from "vue";

export default function makeState(method: Ref, subgroupStringDefault = "") {
  // === Component state ===
  // method: "vals"
  const valsString = ref("");
  // medhod: "commas"
  const commasString = ref("");
  // Generic
  const subgroupString = ref(subgroupStringDefault);
  // Advanced
  const weightsString = ref("");
  const tempering = ref<"TE" | "POTE" | "CTE">("CTE");
  const constraintsString = ref("");

  // === Computed state ===
  const vals = computed(() =>
    valsString.value
      .replace("|", ",")
      .replace("&", ",")
      .split(",")
      .map((val) => val.trim())
      .filter((val) => val.length)
  );

  const commas = computed(() =>
    commasString.value
      .replace("|", ",")
      .replace("&", ",")
      .split(",")
      .map((comma) => comma.trim())
      .filter((comma) => comma.length)
  );

  const subgroupDefault = new Subgroup(subgroupStringDefault || []);
  const [subgroup, subgroupError] = computedAndError(() => {
    const value = subgroupString.value.trim();

    if (!value.length) {
      if (method.value === "commas") {
        return Subgroup.inferPrimeSubgroup(commas.value);
      }
      return new Subgroup([]);
    }

    if (value.includes(".")) {
      return new Subgroup(value);
    }
    return new Subgroup(parseInt(value));
  }, subgroupDefault);

  const weights = computed(() => {
    const value = weightsString.value
      .split(",")
      .map((weight) => weight.trim())
      .filter((weight) => weight.length)
      .map((weight) => parseFloat(weight));
    if (value.length) {
      return value;
    }
    return undefined;
  });

  const constraints = computed(() =>
    constraintsString.value
      .split(",")
      .map((constraint) => constraint.trim())
      .filter((constraint) => constraint.length)
  );

  const options = computed<TuningOptions>(() => {
    if (tempering.value === "CTE") {
      return {
        temperEquaves: true,
        constraints: constraints.value,
        weights: weights.value,
      };
    } else if (tempering.value === "TE") {
      return {
        temperEquaves: true,
        weights: weights.value,
      };
    } else {
      return { weights: weights.value };
    }
  });

  // === Watchers ===
  // Enforce CTE pure equaves unless the user interferes
  watch(subgroup, (newValue, oldValue) => {
    if (
      !constraintsString.value.length ||
      (oldValue.basis.length &&
        constraintsString.value === fractionToString(oldValue.basis[0]))
    ) {
      if (!newValue.basis.length) {
        constraintsString.value = "";
      } else {
        constraintsString.value = fractionToString(newValue.basis[0]);
      }
    }
  });

  return {
    valsString,
    commasString,
    subgroupString,
    subgroupError,
    weightsString,
    tempering,
    constraintsString,
    vals,
    commas,
    subgroup,
    weights,
    options,
  };
}
