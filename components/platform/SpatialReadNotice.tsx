import type { SpatialReadContext } from "../../src/application/operations/spatial-read-context";
import { useLocale } from "../../src/ui/i18n/locale-provider";

export function SpatialReadNotice({
  context,
}: {
  context: SpatialReadContext;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
      <p>{t("spatialPositionBasis")}</p>
      <p>{t("spatialPhysicalUnrecorded")}</p>
      <details>
        <summary className="ui-pressable min-h-11 cursor-pointer rounded-md py-2 font-semibold">
          {t("spatialDiagramSystems")}
        </summary>
        {context.coordinateSystems.length ? (
          <ul className="list-inside list-disc break-words">
            {context.coordinateSystems.map((system) => (
              <li key={system.identifier}>
                {system.identifier} · {t("spatialDiagramOnly")}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("spatialNoSystem")}</p>
        )}
      </details>
    </div>
  );
}
