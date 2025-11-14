import { ConditionalRule, ConditionalOperator, Field } from "@/types/form";

/**
 * Evaluates a single condition against a value
 */
export function evaluateCondition(
  operator: ConditionalOperator,
  fieldValue: unknown,
  targetValue: string | number
): boolean {
  // Handle isEmpty and isNotEmpty operators
  if (operator === "isEmpty") {
    return (
      fieldValue === undefined ||
      fieldValue === null ||
      fieldValue === "" ||
      (Array.isArray(fieldValue) && fieldValue.length === 0)
    );
  }

  if (operator === "isNotEmpty") {
    return !evaluateCondition("isEmpty", fieldValue, targetValue);
  }

  // Convert values to strings for comparison
  const fieldStr = String(fieldValue ?? "");
  const targetStr = String(targetValue);

  switch (operator) {
    case "equals":
      return fieldStr === targetStr;

    case "notEquals":
      return fieldStr !== targetStr;

    case "contains":
      return fieldStr.toLowerCase().includes(targetStr.toLowerCase());

    case "greaterThan": {
      const fieldNum = Number(fieldValue);
      const targetNum = Number(targetValue);
      return !isNaN(fieldNum) && !isNaN(targetNum) && fieldNum > targetNum;
    }

    case "lessThan": {
      const fieldNum = Number(fieldValue);
      const targetNum = Number(targetValue);
      return !isNaN(fieldNum) && !isNaN(targetNum) && fieldNum < targetNum;
    }

    default:
      return false;
  }
}

/**
 * Evaluates multiple conditional rules with AND/OR logic
 */
export function evaluateConditionalRules(
  rules: ConditionalRule[],
  formValues: Record<string, unknown>
): boolean {
  if (!rules || rules.length === 0) {
    return true; // No rules means always visible
  }

  // Group rules by logic operator
  const andRules: ConditionalRule[] = [];
  const orRules: ConditionalRule[] = [];

  rules.forEach((rule) => {
    if (rule.logicOperator === "OR") {
      orRules.push(rule);
    } else {
      // Default to AND
      andRules.push(rule);
    }
  });

  // Evaluate AND rules - all must be true
  const andResult =
    andRules.length === 0 ||
    andRules.every((rule) => {
      const fieldValue = formValues[rule.sourceFieldId];
      const conditionMet = evaluateCondition(
        rule.operator,
        fieldValue,
        rule.value
      );
      return rule.action === "show" ? conditionMet : !conditionMet;
    });

  // Evaluate OR rules - at least one must be true
  const orResult =
    orRules.length === 0 ||
    orRules.some((rule) => {
      const fieldValue = formValues[rule.sourceFieldId];
      const conditionMet = evaluateCondition(
        rule.operator,
        fieldValue,
        rule.value
      );
      return rule.action === "show" ? conditionMet : !conditionMet;
    });

  // If we have both AND and OR rules, both groups must pass
  if (andRules.length > 0 && orRules.length > 0) {
    return andResult && orResult;
  }

  // Otherwise return whichever group we have
  return andResult && orResult;
}

/**
 * Returns an array of visible field IDs based on current form values
 */
export function getVisibleFields(
  fields: Field[],
  formValues: Record<string, unknown>
): string[] {
  return fields
    .filter((field) => {
      // If no conditional logic, field is always visible
      if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
        return true;
      }

      // Evaluate conditional rules
      return evaluateConditionalRules(field.conditionalLogic, formValues);
    })
    .map((field) => field.id);
}
