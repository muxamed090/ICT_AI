import { MarketData } from './MarketDataTypes'
import { MockMarketGenerator } from './MockMarketGenerator'

const generator = new MockMarketGenerator()

export class MarketDataService {
  private readonly generator: MockMarketGenerator

  constructor() {
    this.generator = generator
  }

  getAllSymbols(): MarketData[] {
    return this.generator.getAllData()
  }

  getSymbol(symbol: string): MarketData | undefined {
    return this.generator.getDataForSymbol(symbol)
  }

  getAvailableSymbols(): string[] {
    return this.generator.getSymbols()
  }

  tick(): void {
    this.generator.tick()
  }
}

// Singleton for use outside React context (server components, actions)
export const marketDataService = new MarketDataService()
