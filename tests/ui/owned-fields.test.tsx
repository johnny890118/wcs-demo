// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FieldLabel, Input, Select } from "../../components/ui/field";
afterEach(cleanup);
it("preserves semantic field styling, supplied layout and native required/disabled contracts", () => {
  render(
    <>
      <FieldLabel className="flex items-center">
        <Input type="checkbox" disabled />
        Confirm
      </FieldLabel>
      <FieldLabel htmlFor="reference" className="text-sm">
        Reference
      </FieldLabel>
      <Input id="reference" name="externalReference" required maxLength={200} />
      <FieldLabel>
        Destination
        <Select required name="destination">
          <option value="one">One</option>
        </Select>
      </FieldLabel>
    </>,
  );
  expect(screen.getByLabelText("Confirm").hasAttribute("disabled")).toBe(true);
  const label = screen.getByLabelText("Confirm").closest("label");
  expect(label?.className).toContain("swp-field-label");
  expect(label?.className).toContain("flex items-center");
  expect(screen.getByLabelText("Reference").getAttribute("name")).toBe(
    "externalReference",
  );
  expect(screen.getByLabelText("Reference").hasAttribute("required")).toBe(
    true,
  );
  expect(screen.getByLabelText("Destination").hasAttribute("required")).toBe(
    true,
  );
});
