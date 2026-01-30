/**
 * Intelligence Service
 * Cross-domain intelligence engine that correlates data from all integrations
 */

class IntelligenceService {
  /**
   * Generate cross-domain intelligence for a note
   */
  async generateCrossDomainIntelligence(note) {
    const intelligence = {
      correlation: {},
      alerts: [],
      insights: []
    };

    // 1. Sentiment Correlation Analysis
    if (note.social && note.social.x && note.social.x.sentiment && 
        note.news && note.news.articles && note.news.articles.length > 0) {
      const socialSentiment = note.social.x.sentiment.overall;
      const newsSentiment = this.analyzeNewsSentiment(note.news.articles);
      
      intelligence.correlation.newsSentiment = newsSentiment;
      intelligence.correlation.socialSentiment = socialSentiment;
      
      // Detect sentiment divergence
      if (socialSentiment !== newsSentiment) {
        intelligence.alerts.push({
          type: "sentiment_divergence",
          severity: "medium",
          message: `Social sentiment (${socialSentiment}) differs from news sentiment (${newsSentiment})`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }

    // 2. Predictive Market + Financial Data Correlation
    if (note.financial && note.financial.predictive && note.financial.predictive.markets &&
        note.financial && note.financial.data && note.financial.data.prices) {
      const markets = note.financial.predictive.markets;
      const avgProbability = markets.reduce((sum, market) => {
        const yesOutcome = market.outcomes.find(o => o.name.toLowerCase().includes('yes'));
        return sum + (yesOutcome?.probability || 0);
      }, 0) / markets.length;
      
      const priceChange = note.financial.data.prices[0]?.changePercent || 0;
      
      intelligence.correlation.predictiveProbability = avgProbability;
      intelligence.correlation.marketSentiment = priceChange > 0 ? "bullish" : "bearish";
      
      // Detect misalignment
      if ((avgProbability > 0.7 && priceChange < -2) || (avgProbability < 0.3 && priceChange > 2)) {
        intelligence.alerts.push({
          type: "market_misalignment",
          severity: "high",
          message: `Predictive markets (${(avgProbability * 100).toFixed(0)}%) suggest different direction than price movement (${priceChange.toFixed(2)}%)`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }

    // 3. Deadline + Market Event Correlation
    if (note.deadline && note.financial && note.financial.predictive && note.financial.predictive.markets) {
      const deadlineDate = new Date(note.deadline.date);
      const upcomingMarkets = note.financial.predictive.markets.filter(
        market => new Date(market.endDate) <= deadlineDate
      );
      
      if (upcomingMarkets.length > 0) {
        intelligence.insights.push({
          type: "deadline_market_alignment",
          description: `${upcomingMarkets.length} predictive market(s) resolve before your deadline`,
          confidence: 0.8,
          timestamp: new Date()
        });
      }
    }

    // 4. X Sentiment + Predictive Markets Correlation
    if (note.social && note.social.x && note.social.x.sentiment &&
        note.financial && note.financial.predictive && note.financial.predictive.markets) {
      const socialSentiment = note.social.x.sentiment.overall;
      const markets = note.financial.predictive.markets;
      const avgProbability = markets.reduce((sum, market) => {
        const yesOutcome = market.outcomes.find(o => o.name.toLowerCase().includes('yes'));
        return sum + (yesOutcome?.probability || 0);
      }, 0) / markets.length;
      
      const consensus = this.determineConsensus(socialSentiment, avgProbability);
      intelligence.correlation.consensus = consensus;
      
      if (consensus === "strong_bullish" || consensus === "strong_bearish") {
        intelligence.alerts.push({
          type: "strong_consensus",
          severity: "high",
          message: `Strong ${consensus.replace('strong_', '')} consensus across social and predictive markets`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }

    // 5. Nyuzi Early Signal Detection
    if (note.financial && note.financial.predictive && note.financial.predictive.nyuzi) {
      const nyuzi = note.financial.predictive.nyuzi;
      
      if (nyuzi.earlyMarketIndicator && nyuzi.earlyMarketIndicator.minutesBeforeNews > 0) {
        intelligence.insights.push({
          type: "early_market_signal",
          description: `Markets moved ${nyuzi.earlyMarketIndicator.minutesBeforeNews} minutes before news coverage`,
          confidence: 0.9,
          timestamp: new Date()
        });
      }
    }

    return intelligence;
  }

  /**
   * Analyze news sentiment
   */
  analyzeNewsSentiment(articles) {
    const Sentiment = require("sentiment");
    const sentiment = new Sentiment();
    
    const scores = articles.map(article => 
      sentiment.analyze(article.title + ' ' + article.snippet)
    );
    const avgScore = scores.reduce((sum, s) => sum + s.comparative, 0) / scores.length;
    
    if (avgScore > 0.1) return "positive";
    if (avgScore < -0.1) return "negative";
    return "neutral";
  }

  /**
   * Determine consensus
   */
  determineConsensus(socialSentiment, probability) {
    const socialScore = socialSentiment === "positive" ? 0.7 : 
                       socialSentiment === "negative" ? 0.3 : 0.5;
    const avgScore = (socialScore + probability) / 2;
    
    if (avgScore > 0.75) return "strong_bullish";
    if (avgScore > 0.6) return "bullish";
    if (avgScore < 0.25) return "strong_bearish";
    if (avgScore < 0.4) return "bearish";
    return "neutral";
  }
}

module.exports = new IntelligenceService();

