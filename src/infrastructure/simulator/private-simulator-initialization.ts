import { ObservationSequenceConflict } from "./observation-publishing-equipment-port";

/** Rolling private-demo startup only. Rebuild from latest persisted state,
 * never bump a stale runtime's sequence or retry commands/public owners. */
export async function initializePrivateSimulatorWithRetry<T>(
  freshInitialization: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await freshInitialization();
    } catch (error) {
      if (!(error instanceof ObservationSequenceConflict) || attempt === 2)
        throw error;
    }
  }
  throw new Error("Private simulator initialization exhausted.");
}
