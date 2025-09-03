export type RuleId = string;

/**
 * Rule evaluation result for a single rule. Result is a diff of the changes made to the
 * data. Important for debugging.
 */
export interface RuleEvaluation<TData> {
  ruleId: RuleId;
  applicable: boolean;
  result: Partial<TData> | null;
}

/**
 * Evaluation result for a set of rules. Includes the results of each rule and the merged final
 * result.
 */
export type RuleEvaluationResult<TData> = {
  evals: RuleEvaluation<TData>[];
  result: Partial<TData>;
};

export type Rule<TContext, TData> = {
  id: RuleId;
  applicable(context: TContext): boolean;
  apply(context: TContext, data: Partial<TData>): Partial<TData>;
};

export class RuleSet<TContext, TData> {
  private readonly rules = new Map<RuleId, Rule<TContext, TData>>();

  constructor(rules: Rule<TContext, TData>[]) {
    for (const rule of rules) {
      if (this.rules.has(rule.id)) {
        throw new Error(
          `Duplicate rule ID detected: '${rule.id}'. Each rule must have a unique identifier.`
        );
      }
      this.rules.set(rule.id, rule);
    }
  }

  evaluate(
    ids: RuleId[],
    context: TContext,
    init: Partial<TData>
  ): RuleEvaluationResult<TData> {
    const evals: RuleEvaluation<TData>[] = [];
    let result: Partial<TData> = { ...init };
    for (const id of ids) {
      const rule = this.rules.get(id);
      if (!rule) {
        console.warn(`Rule ${id} not found`);
        continue;
      }
      if (!rule.applicable(context)) {
        evals.push({ ruleId: id, result: null, applicable: false });
        continue;
      }
      const data = rule.apply(context, result);
      evals.push({ ruleId: id, result: data, applicable: true });
      Object.assign(result, data);
    }
    return { evals, result };
  }
}
