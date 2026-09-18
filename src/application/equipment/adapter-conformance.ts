import type { EquipmentCommandEnvelope, EquipmentPort } from "./equipment-port";

export type AdapterConformanceFixture = Readonly<{
  adapterKey: string;
  equipmentId: string;
  requiredCapabilities: readonly string[];
  lifecycle: readonly EquipmentCommandEnvelope[];
  createAdapter(): EquipmentPort;
}>;

export type AdapterConformanceCheck = Readonly<{
  name: string;
  passed: boolean;
  detail: string;
}>;

export type AdapterConformanceReport = Readonly<{
  adapterKey: string;
  checks: readonly AdapterConformanceCheck[];
  passed: boolean;
}>;

export async function runAdapterConformance(
  fixture: AdapterConformanceFixture,
): Promise<AdapterConformanceReport> {
  const checks: AdapterConformanceCheck[] = [];
  const check = (name: string, passed: boolean, detail: string) => {
    checks.push({ name, passed, detail });
  };
  const adapter = fixture.createAdapter();
  const descriptor = await adapter.getDescriptor(fixture.equipmentId);
  check(
    "descriptor",
    descriptor?.adapterKey === fixture.adapterKey,
    descriptor
      ? `Reported adapter ${descriptor.adapterKey}.`
      : "Descriptor was not found.",
  );
  const capabilities = new Set(descriptor?.capabilities ?? []);
  const missing = fixture.requiredCapabilities.filter(
    (capability) => !capabilities.has(capability),
  );
  check(
    "capabilities",
    missing.length === 0,
    missing.length === 0
      ? "Required capabilities are present."
      : `Missing capabilities: ${missing.join(", ")}.`,
  );

  let lifecyclePassed = true;
  let lifecycleDetail = "Lifecycle commands were accepted in order.";
  for (const envelope of fixture.lifecycle) {
    try {
      const result = await adapter.dispatch(envelope);
      if (!result.transition.accepted || result.duplicate) {
        lifecyclePassed = false;
        lifecycleDetail = `Command ${envelope.commandId} was not accepted as a new transition.`;
        break;
      }
    } catch (error) {
      lifecyclePassed = false;
      lifecycleDetail = `Command ${envelope.commandId} failed: ${errorMessage(
        error,
      )}`;
      break;
    }
  }
  check("lifecycle", lifecyclePassed, lifecycleDetail);

  const duplicateAdapter = fixture.createAdapter();
  const firstEnvelope = fixture.lifecycle[0];
  if (!firstEnvelope) {
    check("idempotency", false, "Fixture has no lifecycle command.");
    check("command-id collision", false, "Fixture has no lifecycle command.");
  } else {
    try {
      const first = await duplicateAdapter.dispatch(firstEnvelope);
      const duplicate = await duplicateAdapter.dispatch(firstEnvelope);
      check(
        "idempotency",
        !first.duplicate &&
          duplicate.duplicate &&
          JSON.stringify(first.transition) ===
            JSON.stringify(duplicate.transition),
        "An identical command id returns the original transition.",
      );
    } catch (error) {
      check("idempotency", false, errorMessage(error));
    }

    try {
      await duplicateAdapter.dispatch({
        ...firstEnvelope,
        equipmentId: `${firstEnvelope.equipmentId}-different`,
      });
      check(
        "command-id collision",
        false,
        "A reused command id with different content was accepted.",
      );
    } catch {
      check(
        "command-id collision",
        true,
        "A reused command id with different content was rejected.",
      );
    }
  }

  return {
    adapterKey: fixture.adapterKey,
    checks,
    passed: checks.every(({ passed }) => passed),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown adapter error.";
}
