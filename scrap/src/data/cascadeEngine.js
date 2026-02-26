// ============================================================
// Cascade Engine
// ============================================================
// Rules:
// - Chain = same leading number prefix (1a,1b,1c = chain "1", 2a,2b = chain "2")
// - ECN on step X → all steps AFTER X in same chain get ⚠️ cascade warning
// - Cascade clears when ECN step is marked as applied
// - ECN steps are blocked if any upstream ECN in same chain is unapplied (top-down enforcement)

/**
 * Extract chain prefix from step number
 * "1c" → "1", "1da" → "1", "2b" → "2", "3" → "3"
 */
export function getChainPrefix(stepNumber) {
  const m = stepNumber.match(/^(\d+)/);
  return m ? m[1] : stepNumber;
}

/**
 * Build a flat ordered list of all steps with chain prefix
 */
export function buildStepChain(tree) {
  const flat = [];
  tree.forEach((g) => {
    g.steps.forEach((s) => {
      flat.push({
        ...s,
        groupId: g.id,
        groupName: g.name,
        groupColor: g.color,
        chain: getChainPrefix(s.sn),
      });
    });
  });
  return flat;
}

/**
 * Compute cascade warnings and blocking status
 * Returns: Map<stepNumber, { isCascade, cascadeFrom[], isBlocked }>
 */
export function computeCascade(tree, changes, applied, unitSn) {
  const flat = buildStepChain(tree);
  const ecnSteps = new Set(changes.map((c) => c.step));
  const result = new Map();

  // For each unapplied ECN, mark all downstream steps in same chain
  changes.forEach((change) => {
    const changeChain = getChainPrefix(change.step);
    if (applied.has(`${unitSn}-${change.step}`)) return;

    const changeIdx = flat.findIndex((s) => s.sn === change.step);
    if (changeIdx === -1) return;

    for (let i = changeIdx + 1; i < flat.length; i++) {
      const downstream = flat[i];
      if (downstream.chain !== changeChain) continue;

      const existing = result.get(downstream.sn) || {
        isCascade: false,
        cascadeFrom: [],
        isBlocked: false,
      };
      existing.isCascade = true;
      if (!existing.cascadeFrom.includes(change.step)) {
        existing.cascadeFrom.push(change.step);
      }
      result.set(downstream.sn, existing);
    }
  });

  // Compute blocking: ECN step blocked if upstream ECN in same chain is unapplied
  changes.forEach((change) => {
    const changeChain = getChainPrefix(change.step);
    const changeIdx = flat.findIndex((s) => s.sn === change.step);

    for (let i = 0; i < changeIdx; i++) {
      const upstream = flat[i];
      if (upstream.chain !== changeChain) continue;
      if (ecnSteps.has(upstream.sn) && !applied.has(`${unitSn}-${upstream.sn}`)) {
        const existing = result.get(change.step) || {
          isCascade: false,
          cascadeFrom: [],
          isBlocked: false,
        };
        existing.isBlocked = true;
        if (!existing.cascadeFrom.includes(upstream.sn)) {
          existing.cascadeFrom.push(upstream.sn);
        }
        result.set(change.step, existing);
      }
    }
  });

  return result;
}
