import type {
  OperationalAccess,
  OperationalRuntime,
} from "../../src/application/access/operational-access";

export const testWarehouseId = "10000000-0000-4000-8000-000000000001";

export const testOperationalAccess: OperationalAccess = {
  principal: {
    kind: "human",
    subject: "test-operator",
    displayName: "Test Operator",
    identityProvider: "test",
    permissions: [
      "operations.view",
      "audit.view",
      "inbound.create",
      "outbound.create",
      "transport.execute",
      "alarm.acknowledge",
      "alarm.recover",
    ],
    warehouseScopes: [
      {
        warehouseId: testWarehouseId,
        code: "TEST",
        name: "Test Warehouse",
        permissions: [
          "operations.view",
          "audit.view",
          "inbound.create",
          "outbound.create",
          "transport.execute",
          "alarm.acknowledge",
          "alarm.recover",
        ],
      },
    ],
  },
  currentWarehouseId: testWarehouseId,
};

export const testOperationalRuntime: OperationalRuntime = {
  environment: "test",
  deploymentProfile: "private_demo",
  equipmentSource: "simulation",
};

export const testOperationalSession = {
  user: { name: "Test Operator" },
  access: testOperationalAccess,
  runtime: testOperationalRuntime,
};
