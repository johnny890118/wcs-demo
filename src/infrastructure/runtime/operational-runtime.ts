import {
  deploymentProfiles,
  equipmentSources,
  isProfileEquipmentSourceAllowed,
  operationalEnvironments,
  type DeploymentProfile,
  type EquipmentSource,
  type OperationalEnvironment,
  type OperationalRuntime,
} from "../../application/access/operational-access";

function configuredValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (value.length > 160) throw new Error(`${name} is too long.`);
  return value;
}

function legacyRuntimeFallback(): Pick<
  OperationalRuntime,
  "environment" | "deploymentProfile"
> {
  const legacy = process.env.SWP_ENVIRONMENT?.trim();
  if (legacy === "demo") {
    return { environment: "production", deploymentProfile: "private_demo" };
  }
  return {
    environment: process.env.NODE_ENV === "test" ? "test" : "development",
    deploymentProfile: "private_demo",
  };
}

export function loadOperationalRuntime(): OperationalRuntime {
  const hasLegacyDemoConfiguration =
    process.env.SWP_ENVIRONMENT?.trim() === "demo";
  const hasExplicitRuntimeConfiguration = [
    "SWP_LIFECYCLE_ENVIRONMENT",
    "SWP_DEPLOYMENT_PROFILE",
    "SWP_EQUIPMENT_SOURCE",
  ].every((name) => Boolean(process.env[name]?.trim()));

  if (
    process.env.NODE_ENV === "production" &&
    !hasLegacyDemoConfiguration &&
    !hasExplicitRuntimeConfiguration
  ) {
    throw new Error(
      "Production runtime requires explicit lifecycle environment, deployment profile, and equipment source configuration.",
    );
  }

  const fallback = legacyRuntimeFallback();
  const environment = configuredValue(
    "SWP_LIFECYCLE_ENVIRONMENT",
    fallback.environment,
  );
  const deploymentProfile = configuredValue(
    "SWP_DEPLOYMENT_PROFILE",
    fallback.deploymentProfile,
  );
  const equipmentSource = configuredValue("SWP_EQUIPMENT_SOURCE", "simulation");

  if (
    !operationalEnvironments.includes(environment as OperationalEnvironment)
  ) {
    throw new Error("SWP_LIFECYCLE_ENVIRONMENT is invalid.");
  }
  if (!deploymentProfiles.includes(deploymentProfile as DeploymentProfile)) {
    throw new Error("SWP_DEPLOYMENT_PROFILE is invalid.");
  }
  if (!equipmentSources.includes(equipmentSource as EquipmentSource)) {
    throw new Error("SWP_EQUIPMENT_SOURCE is invalid.");
  }
  if (
    !isProfileEquipmentSourceAllowed(
      deploymentProfile as DeploymentProfile,
      equipmentSource as EquipmentSource,
    )
  ) {
    throw new Error(
      `SWP deployment profile ${deploymentProfile} does not allow equipment source ${equipmentSource}.`,
    );
  }

  return {
    environment: environment as OperationalEnvironment,
    deploymentProfile: deploymentProfile as DeploymentProfile,
    equipmentSource: equipmentSource as EquipmentSource,
  };
}
