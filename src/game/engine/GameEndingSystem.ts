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
    const { populationCount, resources, statistics, currentYear } = state;

    // 1. 人口灭绝
    if (populationCount === 0) {
      return this.createEnding('extinction', currentYear);
    }

    // 2. 经济崩溃（连续12个月负债超过5000）
    if (resources.money < -5000 && state.negativeMoneyMonths >= 12) {
      return this.createEnding('economic_collapse', currentYear);
    }

    // 3. 社会崩溃（连续6个月低幸福度）
    // 注意：需要先实现幸福度系统
    if (state.lowHappinessMonths >= 6) {
      return this.createEnding('social_collapse', currentYear);
    }

    // 4. 老龄化危机（60岁以上人口占比超过80%）
    const elderlyCount = this.getElderlyCount(state);
    if (populationCount > 0 && elderlyCount / populationCount > 0.8) {
      return this.createEnding('aging_crisis', currentYear);
    }

    // 5. 资源枯竭（连续3个月食物不足）
    if (resources.food <= 0 && state.noFoodMonths >= 3) {
      return this.createEnding('resource_depletion', currentYear);
    }

    return null;
  }

  /**
   * 检查胜利条件
   */
  private checkVictoryConditions(state: GameState): GameEnding | null {
    const { currentYear, populationCount, statistics } = state;

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
    const { populationCount, resources, statistics, currentYear, unlockedAchievements } = state;

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

    // 总分
    const totalScore = populationScore + economyScore + happinessScore + healthScore + educationScore;

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
      dimensions: {
        population: Math.round(populationScore),
        economy: Math.round(economyScore),
        happiness: Math.round(happinessScore),
        health: Math.round(healthScore),
        education: Math.round(educationScore),
      },
      achievements: unlockedAchievements.length,
      survivalYears: currentYear,
    };
  }

  /**
   * 创建失败结局
   */
  private createEnding(type: GameEndingType, year: number): GameEnding {
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

    return {
      type,
      title: titles[type],
      description: descriptions[type],
      score: {
        totalScore: 0,
        rank: 'D',
        dimensions: { population: 0, economy: 0, happiness: 0, health: 0, education: 0 },
        achievements: 0,
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
