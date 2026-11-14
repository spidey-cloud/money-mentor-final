import { generateFirePlan } from './fireAgent.js'
import { analyzeHealthScore } from './healthScoreAgent.js'
import { analyzeTax } from './taxAgent.js'

function logDecision(agent, action) {
  console.log(`[AUDIT] ${agent} → ${action}`)
}

export async function orchestrate(type, payload) {
  const startTime = Date.now()
  logDecision('Orchestrator', `Received ${type} request`)

  let result
  switch (type) {
    case 'health-score':
      logDecision('Orchestrator', 'Routing to HealthScoreAgent')
      result = await analyzeHealthScore(payload.answers, payload.scores)
      logDecision('HealthScoreAgent', 'Analysis complete')
      break

    case 'tax-wizard':
      logDecision('Orchestrator', 'Routing to TaxAnalysisAgent')
      result = await analyzeTax(payload.salary, payload.deductions, payload.results)
      logDecision('TaxAnalysisAgent', 'Analysis complete')
      break

    case 'fire-planner': {
      logDecision('Orchestrator', 'Routing to FirePlanningAgent')
      const { plan, ...data } = payload
      result = await generateFirePlan(data, plan)
      logDecision('FirePlanningAgent', 'Plan generated')
      break
    }

    default:
      throw new Error(`Unknown request type: ${type}`)
  }

  const duration = Date.now() - startTime
  logDecision('Orchestrator', `Request completed in ${duration}ms`)
  return { ...result, processingTime: duration }
}
