/**
 * 游戏平衡性配置
 * 统一管理所有游戏数值，便于调整平衡性
 */

/**
 * 资源消耗配置
 */
export const RESOURCE_CONSUMPTION = {
  // 食物消耗
  FOOD: {
    BASE: 1.0,              // 基础消耗（成人）
    CHILD_0_6: 0.5,         // 0-6岁
    CHILD_7_12: 0.7,        // 7-12岁
    CHILD_13_18: 0.9,       // 13-18岁
    ELDERLY: 0.8,           // 60岁以上老人
    LOW_HEALTH_BONUS: 0.2,  // 健康<30时额外消耗
  },

  // 医疗消耗
  MEDICINE: {
    ELDERLY: 0.1,           // 60岁以上老人
    SICK: 0.3,              // 健康<40的病人
  },

  // 教育消耗
  EDUCATION: {
    STUDENT: 0.5,           // 6-18岁学生
  },

  // 基础设施维护
  INFRASTRUCTURE: 5,        // 每月基础设施维护费

  // 失业救济
  UNEMPLOYMENT_BENEFIT: 2,  // 失业者每月救济金

  // 老人医疗补贴
  ELDERLY_MEDICAL_COST: 1,  // 60岁以上老人每月
};

/**
 * 资源生产配置
 */
export const RESOURCE_PRODUCTION = {
  // 基础税收
  BASE_TAX: 5,              // 成年人每月基础税收

  // 职业产出
  OCCUPATION: {
    FARMER: {
      FOOD_BASE: 8,         // 基础食物产出
      FOOD_AGE_MODIFIER: {
        YOUNG_18_30: 1.2,   // 青壮年加成
        MIDDLE_51_60: 0.8,  // 中老年减成
        OLD_OTHER: 0.5,     // 其他年龄段
      },
      HEALTH_MODIFIER: {
        EXCELLENT_80: 1.2,  // 健康>80
        NORMAL_60: 1.0,     // 健康60-80
        POOR_60: 0.7,       // 健康<60
        VERY_POOR_30: 0.4,  // 健康<30
      },
      MONEY_INCOME: 3,      // 农产品销售
      SIDE_FOOD: 3,         // 副业食物产出
    },

    WORKER: {
      MONEY_INCOME: 15,     // 制造业收入
      SIDE_FOOD: 3,         // 副业食物产出
    },

    SCIENTIST: {
      MONEY_INCOME: 20,     // 科研拨款
      EDUCATION_PRODUCTION: 2,  // 教育产出
      MEDICINE_PRODUCTION: 1,   // 医疗产出
    },
  },

  // 季节性食物产出修正
  SEASONAL_MODIFIER: {
    MONTH_1: 0.6,   // 1月
    MONTH_2: 0.7,   // 2月
    MONTH_3: 0.9,   // 3月
    MONTH_4: 1.0,   // 4月
    MONTH_5: 1.2,   // 5月
    MONTH_6: 1.4,   // 6月
    MONTH_7: 1.5,   // 7月
    MONTH_8: 1.3,   // 8月
    MONTH_9: 1.1,   // 9月
    MONTH_10: 0.9,  // 10月
    MONTH_11: 0.7,  // 11月
    MONTH_12: 0.6,  // 12月
  },
};

/**
 * 健康系统配置
 */
export const HEALTH_SYSTEM = {
  // 自然恢复（按年龄段）
  NATURAL_RECOVERY: {
    YOUNG_0_29: 0.5,      // 年轻人恢复力强
    MIDDLE_30_49: 0.3,    // 中年人恢复力一般
    SENIOR_50_69: 0.1,    // 老年人恢复力弱
    ELDERLY_70_PLUS: 0,    // 70岁以上不再自然恢复
  },

  // 年龄衰减
  AGE_DECAY: {
    ELDERLY_60_PLUS: 0.1, // 60岁以上
    VERY_ELDERLY_80_PLUS: 0.3, // 80岁以上
  },

  // 资源短缺影响
  SHORTAGE: {
    FOOD_SHORTAGE: -2,     // 食物短缺
    MEDICINE_SHORTAGE: -1, // 医疗短缺（老人/病人）
    HOUSING_SHORTAGE: -0.5, // 住房短缺
  },

  // 资源充足恢复
  ABUNDANCE: {
    FOOD_PLENTIFUL: 0.3,   // 食物充足（净生产>10）
    MEDICINE_PLENTIFUL: {
      YOUNG_SICK: 0.2,     // 年轻病人
      ELDERLY_60_69: 0.3,  // 老人60-69岁
      VERY_ELDERLY_80_PLUS: 0.5, // 80岁以上老人
    },
  },
};

/**
 * 死亡率配置
 */
export const DEATH_RATE = {
  BASE: 0.001,             // 基础月死亡率 0.1%
  LOW_HEALTH_MULTIPLIER: 2, // 低健康（<30）死亡率倍数
};

/**
 * 出生率配置
 */
export const BIRTH_RATE = {
  BASE: 0.05,              // 基础生育率 5%
  MIN_AGE: 18,             // 最小生育年龄
  MAX_AGE: 45,             // 最大生育年龄
  PEAK_AGE_START: 25,      // 生育峰值开始年龄
  PEAK_AGE_END: 30,        // 生育峰值结束年龄
};

/**
 * 人口配置
 */
export const POPULATION = {
  // 生育配置
  MIN_AGE_FOR_CHILDBEARING: 18,     // 最小生育年龄
  MAX_AGE_FOR_CHILDBEARING: 45,     // 最大生育年龄
  BASE_FERTILITY_RATE: 0.05,        // 基础生育率 5%
  MAX_CHILDREN_PER_FAMILY: 5,       // 每个家庭最大子女数

  // 婚姻配置
  MIN_AGE_FOR_MARRIAGE: 18,         // 最小结婚年龄
  MAX_AGE_FOR_MARRIAGE: 50,         // 最大结婚年龄
  MARRIAGE_RATE: 0.02,              // 每月结婚概率 2%

  // 年龄定义
  ELDERLY_AGE: 60,                  // 老年人年龄界限
};

/**
 * 初始资源配置
 */
export const INITIAL_RESOURCES = {
  FOOD: 200,
  HOUSING: 100,
  MEDICINE: 100,
  EDUCATION: 100,
  MONEY: 500,
};

/**
 * 游戏结束条件配置
 */
export const GAME_ENDING = {
  // 失败条件
  EXTINCTION_POPULATION: 5,          // 种族灭绝人口阈值
  ECONOMIC_COLLAPSE_DEBT: 500,       // 经济崩溃负债阈值
  ECONOMIC_COLLAPSE_MONTHS: 6,       // 经济崩溃持续时间
  SOCIAL_COLLAPSE_SHORTAGE_MONTHS: 6, // 社会崩溃资源短缺持续时间
  AGING_CRISIS_RATIO: 0.8,           // 老龄化危机老人比例
  AGING_CRISIS_POPULATION: 20,       // 老龄化危机最小人口
  RESOURCE_DEPLETION_MONTHS: 6,      // 资源枯竭持续时间

  // 胜利条件
  MIN_VICTORY_YEARS: 50,             // 最小胜利年数
  PERFECT_SCORE: 90,                 // 完美结局评分
  EXCELLENT_SCORE: 75,               // 优秀结局评分
  GOOD_SCORE: 60,                    // 良好结局评分
};

/**
 * UI显示配置
 */
export const UI_DISPLAY = {
  // 资源说明（用于ResourcePanel显示）
  RESOURCE_DESCRIPTIONS: {
    FOOD: '成人1单位/月，儿童0.5-0.9单位，老人0.8单位。健康<30时消耗+0.2',
    MONEY: '成人税收5元/月 + 职业产出（农民3/工人15/科学家20） - 基础设施5元 - 失业救济2元 - 老人医疗1元',
    EDUCATION: '学生（6-18岁）消耗0.5单位/月，科学家产出2单位/月',
    MEDICINE: '老人（60岁以上）消耗0.1单位/月，病人（健康<40）消耗0.3单位/月。科学家产出1单位/月',
    HEALTH: '年轻人自然恢复，老年人缓慢衰减。食物充足时恢复，资源短缺时下降',
  },
};
