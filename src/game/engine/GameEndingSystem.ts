import type { GameState, GameEnding, GameEndingType, GameScore } from '../../store/types';

export class GameEndingSystem {
  /**
   * 检查游戏结束条件
   */
  checkEndingConditions(state: GameState): GameEnding | null {
    // 1. 检查失败条件
    const ending = this.checkFailureConditions(state);
    if (ending) return ending;

    // 2. 检查胜利条件
    const victory = this.checkVictoryConditions(state);
    if (victory) return victory;

    return null;
  }

  /**
   * 检查失败条件
   */
  private checkFailureConditions(state: GameState): GameEnding | null {
    const { populationCount, resources, currentYear } = state;

    // 1. 人口灭绝或濒临灭绝（人口 < 5）
    if (populationCount < 5) {
      return this.createEnding('extinction', currentYear, state);
    }

    // 2. 经济崩溃（连续6个月负债超过500）
    if (resources.money < -500 && state.negativeMoneyMonths >= 6) {
      return this.createEnding('economic_collapse', currentYear, state);
    }

    // 3. 社会崩溃（连续6个月严重资源短缺）
    // 判断条件：食物不足 OR 资金不足 OR 医疗不足
    const hasSevereShortage =
      resources.food <= 0 ||  // 食物耗尽
      resources.money < 0 ||   // 资金为负
      resources.medicine <= 0; // 医疗耗尽
    if (hasSevereShortage && state.lowHappinessMonths >= 6) {
      return this.createEnding('social_collapse', currentYear, state);
    }

    // 4. 老龄化危机（60岁以上人口占比超过80%且总人口 > 20）
    const elderlyCount = this.getElderlyCount(state);
    if (populationCount > 20 && elderlyCount / populationCount > 0.8) {
      return this.createEnding('aging_crisis', currentYear, state);
    }

    // 5. 资源枯竭（连续6个月食物不足）
    if (resources.food <= 0 && state.noFoodMonths >= 6) {
      return this.createEnding('resource_depletion', currentYear, state);
    }

    return null;
  }

  /**
   * 检查胜利条件
   */
  private checkVictoryConditions(state: GameState): GameEnding | null {
    const { currentYear } = state;

    // 需要达到100年
    if (currentYear < 50) return null;

    const score = this.calculateScore(state);

    // 50年 - 勉强过关
    if (currentYear >= 50 && currentYear < 100) {
      return this.createVictoryEnding('acceptable', score);
    }

    // 100年 - 根据评分决定结局
    if (currentYear >= 100) {
      if (score.totalScore >= 90) {
        return this.createVictoryEnding('perfect', score);
      } else if (score.totalScore >= 75) {
        return this.createVictoryEnding('excellent', score);
      } else if (score.totalScore >= 60) {
        return this.createVictoryEnding('good', score);
      } else {
        return this.createVictoryEnding('acceptable', score);
      }
    }

    return null;
  }

  /**
   * 计算游戏评分
   */
  calculateScore(state: GameState): GameScore {
    const { populationCount, currentYear, unlockedAchievements } = state;

    const dimensions = this.calculateScoreDimensions(state);

    // 总分
    const totalScore = dimensions.population + dimensions.economy + dimensions.happiness + dimensions.health + dimensions.education;

    // 评级
    let rank: 'S' | 'A' | 'B' | 'C' | 'D';
    if (totalScore >= 90) rank = 'S';
    else if (totalScore >= 75) rank = 'A';
    else if (totalScore >= 60) rank = 'B';
    else if (totalScore >= 40) rank = 'C';
    else rank = 'D';

    return {
      totalScore: Math.round(totalScore),
      rank,
      dimensions,
      finalPopulation: populationCount, // 添加实际人口数
      achievements: unlockedAchievements.length,
      survivalYears: currentYear,
    };
  }

  /**
   * 计算评分维度（供失败结局使用）
   */
  private calculateScoreDimensions(state: GameState): GameScore['dimensions'] {
    const { populationCount, resources, statistics } = state;

    // 1. 人口得分 (0-20)
    const populationScore = Math.min(20, (populationCount / 200) * 20);

    // 2. 经济得分 (0-20)
    const economyScore = Math.min(20, Math.max(0, (resources.money / 10000) * 20));

    // 3. 幸福度得分 (0-20) - 暂时用健康值代替
    const happinessScore = Math.min(20, (statistics.averageHealth / 100) * 20);

    // 4. 健康得分 (0-20)
    const healthScore = Math.min(20, (statistics.averageHealth / 100) * 20);

    // 5. 教育得分 (0-20)
    const educationScore = Math.min(20, (statistics.averageEducation / 10) * 20);

    return {
      population: Math.round(populationScore),
      economy: Math.round(economyScore),
      happiness: Math.round(happinessScore),
      health: Math.round(healthScore),
      education: Math.round(educationScore),
    };
  }

  /**
   * 创建失败结局
   */
  private createEnding(type: GameEndingType, year: number, finalState?: GameState): GameEnding {
    const titles: Record<GameEndingType, string> = {
      extinction: '💀 种族灭绝',
      economic_collapse: '💸 经济崩溃',
      social_collapse: '😡 社会崩溃',
      aging_crisis: '👴 老龄化危机',
      resource_depletion: '🏜️ 资源枯竭',
      perfect: '',
      excellent: '',
      good: '',
      acceptable: '',
    };

    const descriptions: Record<GameEndingType, string> = {
      extinction: `第${year}年，最后一名人类死亡。您的文明消失了在历史长河中。`,
      economic_collapse: `第${year}年，经济彻底崩溃，社会秩序瓦解。`,
      social_collapse: `第${year}年，民众起义推翻了政府，社会陷入混乱。`,
      aging_crisis: `第${year}年，人口老龄化导致社会无法维持运转，文明衰落。`,
      resource_depletion: `第${year}年，资源耗尽，人口大批死亡，文明崩溃。`,
      perfect: '',
      excellent: '',
      good: '',
      acceptable: '',
    };

    // 失败原因详细说明
    const failureReasons: Record<GameEndingType, string[]> = {
      extinction: [
        '🔴 失败条件：人口 < 5人',
        '人口已降至无法维持文明延续的水平',
      ],
      economic_collapse: [
        '🔴 失败条件：连续6个月负债超过500元',
        '国家财政破产，无法维持基本公共服务',
      ],
      social_collapse: [
        '🔴 失败条件：连续6个月严重资源短缺',
        '食物耗尽或资金为负或医疗耗尽，导致民众起义',
      ],
      aging_crisis: [
        '🔴 失败条件：60岁以上人口占比>80%且总人口>20人',
        '劳动力严重不足，社会无法正常运转',
      ],
      resource_depletion: [
        '🔴 失败条件：连续6个月食物不足',
        '粮食储备耗尽，人口大批死亡',
      ],
      perfect: [],
      excellent: [],
      good: [],
      acceptable: [],
    };

    // 如果有最终状态，计算实际维度得分
    let dimensions = { population: 0, economy: 0, happiness: 0, health: 0, education: 0 };
    let finalPopulation = 0;
    if (finalState) {
      dimensions = this.calculateScoreDimensions(finalState);
      finalPopulation = finalState.populationCount;
    }

    // 组合描述：基本信息 + 失败原因
    const description = descriptions[type] + '\n\n' + failureReasons[type].join('\n');

    return {
      type,
      title: titles[type],
      description,
      score: {
        totalScore: 0,
        rank: 'D',
        dimensions,
        finalPopulation, // 添加实际人口数
        achievements: finalState?.unlockedAchievements?.length || 0,
        survivalYears: year,
      },
    };
  }

  /**
   * 创建胜利结局
   */
  private createVictoryEnding(type: GameEndingType, score: GameScore): GameEnding {
    const titles: Record<GameEndingType, string> = {
      perfect: '🌟 完美结局',
      excellent: '👏 优秀结局',
      good: '👍 普通胜利',
      acceptable: '😅 勉强过关',
      extinction: '',
      economic_collapse: '',
      social_collapse: '',
      aging_crisis: '',
      resource_depletion: '',
    };

    const descriptions: Record<GameEndingType, string> = {
      perfect: `恭喜！您建立了一个繁荣的文明，持续了${score.survivalYears}年！各项指标均达到优秀水平，这是人类历史上的黄金时代！`,
      excellent: `很好！您的文明持续了${score.survivalYears}年，大部分指标表现良好。虽然仍有改进空间，但已经是一个成功的文明了！`,
      good: `您的文明持续了${score.survivalYears}年，基本稳定。虽然遇到一些挑战，但您成功让人类延续了下来！`,
      acceptable: `您的文明持续了${score.survivalYears}年，虽然过程艰难，但至少没有过早灭亡。下次可以做得更好！`,
      extinction: '',
      economic_collapse: '',
      social_collapse: '',
      aging_crisis: '',
      resource_depletion: '',
    };

    return {
      type,
      title: titles[type],
      description: descriptions[type],
      score,
    };
  }

  /**
   * 获取老年人口数量（60岁以上）
   */
  private getElderlyCount(state: GameState): number {
    let count = 0;
    for (const person of state.people.values()) {
      if (person.isAlive && person.age >= 60) {
        count++;
      }
    }
    return count;
  }
}
