# 人口模拟器 - 系统算法文档

本文档详细说明人口模拟器游戏中各个核心系统的算法逻辑和数值平衡配置。

---

## 目录

1. [系统执行顺序](#系统执行顺序)
2. [老化系统 (AgingSystem)](#老化系统-agingsystem)
3. [死亡系统 (DeathSystem)](#死亡系统-deathsystem)
4. [生育系统 (BirthSystem)](#生育系统-birthsystem)
5. [婚姻系统 (MarriageSystem)](#婚姻系统-marriagesystem)
6. [资源系统 (ResourceSystem)](#资源系统-resourcesystem)
7. [政策系统 (PolicySystem)](#政策系统-policysystem)
8. [统计系统 (StatisticsSystem)](#统计系统-statisticssystem)
9. [成就系统 (AchievementSystem)](#成就系统-achievementsystem)

---

## 系统执行顺序

ECS 架构通过 `priority` 值控制系统执行顺序，数值越大优先级越高：

```
100 - AgingSystem (年龄增长)
 95 - DeathSystem (死亡判定)
 90 - BirthSystem (生育逻辑)
 85 - MarriageSystem (婚姻匹配)
 80 - ResourceSystem (资源管理)
 65 - PolicyEffectSystem (政策效果)
 60 - PolicySystem (政策管理)
 50 - StatisticsSystem (统计数据)
 40 - AchievementSystem (成就检查)
```

---

## 老化系统 (AgingSystem)

**优先级**: 100 (最高优先级)
**执行频率**: 每月一次

### 核心算法

#### 1. 年龄计算
```typescript
age = (currentMonth - birthMonth) / 12
```

#### 2. 健康值变化

健康值每月变化由两部分组成：

**a) 自然恢复** (随年龄增长而减弱)
```typescript
if (age < 30)  healthChange += 0.5   // 年轻人恢复力强
if (age < 50)  healthChange += 0.3   // 中年人恢复力一般
if (age < 70)  healthChange += 0.1   // 老年人恢复力弱
// 70岁以上不再自然恢复
```

**b) 年龄衰减** (老年人健康下降)
```typescript
if (age >= 80) healthChange -= 0.3   // 高龄老人快速衰减
if (age >= 60) healthChange -= 0.1   // 老年人缓慢衰减
```

**c) 最终健康值**
```typescript
newHealth = clamp(oldHealth + healthChange, 0, 100)
```

#### 3. 生育能力更新 (女性)

```typescript
if (gender === 'female') {
  if (18 ≤ age ≤ 45) {
    // 生育能力从18岁开始增长，10年内达到峰值
    fertility = min(1.0, (age - 18) / 10)
  } else {
    fertility = 0  // 育龄期外无生育能力
  }
}
```

### 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 年轻人恢复率 (0-29岁) | 0.5/月 | 青年期恢复力强 |
| 中年人恢复率 (30-49岁) | 0.3/月 | 中年期恢复力一般 |
| 老年人恢复率 (50-69岁) | 0.1/月 | 老年期恢复力弱 |
| 70岁以上恢复率 | 0 | 不再自然恢复 |
| 60岁以上衰减率 | 0.1/月 | 老年期健康衰减 |
| 80岁以上衰减率 | 0.3/月 | 高龄期健康快速衰减 |
| 育龄期 | 18-45岁 | 女性可生育年龄 |

---

## 死亡系统 (DeathSystem)

**优先级**: 95
**执行频率**: 每月一次

### 核心算法

#### 1. 死亡率计算

```typescript
function calculateDeathRate(age, health): number {
  // 基础死亡率
  let rate = 0.001  // 0.1% 月死亡率

  // 老年死亡风险平缓增长
  if (age >= 60) {
    const elderlyYears = age - 60
    rate *= (1 + elderlyYears * 0.1)  // 每增加10岁，死亡率翻倍
  }

  // 低健康死亡风险增加
  if (health < 30) {
    rate *= 2  // 健康低于30，死亡率翻倍
  } else if (health < 50) {
    rate *= 1.3  // 健康低于50，死亡率增加30%
  }

  // 政策修正
  rate += policyDeathRateModifier

  return clamp(rate, 0, 1)
}
```

#### 2. 死亡判定

```typescript
if (random() < deathRate) {
  // 判定死亡
  handleDeath(person)
}
```

#### 3. 死亡处理

1. 更新生物特征组件：
   - `isAlive = false`
   - `deathMonth = currentMonth`

2. 解除婚姻关系（双向）：
   - 清除配偶的 `partnerId`
   - 清除自己的 `partnerId`

3. 发出死亡事件：
   - 触发 `person:died` 事件
   - 统计系统记录死亡数据

### 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 基础月死亡率 | 0.1% | 所有人口的基础死亡风险 |
| 低健康阈值 | 30 | 健康值低于此值死亡率翻倍 |
| 老年年龄界限 | 60岁 | 此年龄后死亡率开始增长 |
| 老年增长率 | 10%每岁 | 年龄每增加1岁，死亡率增加10% |

---

## 生育系统 (BirthSystem)

**优先级**: 90
**执行频率**: 每月一次

### 核心算法

#### 1. 育龄女性筛选

```typescript
条件：
- 性别：女性
- 存活状态：isAlive = true
- 年龄：18 ≤ age ≤ 45
- 婚姻状态：已婚（有 partnerId）
- 子女数量：childrenIds.size < 5
```

#### 2. 生育概率计算

```typescript
// 1. 基础生育率
let birthChance = 0.05  // 5% 基础月生育率

// 2. 政策修正
birthChance += policyFertilityModifier

// 3. 年龄生育能力修正
fertilityCapacity = calculateFertility(age, 'female')
birthChance *= fertilityCapacity

// 4. 最终概率
birthChance = clamp(birthChance, 0, 1)
```

#### 3. 生育能力曲线

```typescript
function calculateFertility(age, gender): number {
  if (gender !== 'female') return 0
  if (age < 18 || age > 45) return 0

  if (25 ≤ age ≤ 30) return 1.0   // 生育峰值期
  if (20 ≤ age < 25)  return 0.8   // 高生育期
  if (31 ≤ age ≤ 35) return 0.7   // 生育后期
  if (36 ≤ age ≤ 40) return 0.4   // 生育末期
  if (41 ≤ age ≤ 45) return 0.1   // 生育尾声

  return 0
}
```

#### 4. 新生儿创建

1. **随机性别**: 50% 男性 / 50% 女性

2. **初始属性**:
   - 健康: 70-100 (随机)
   - 生育能力: 0 (未成年)
   - 教育: 0

3. **关系建立**:
   - 记录父母 ID
   - 更新父母的子女列表

4. **职业与技能**:
   - 职业: 失业 (unemployed)
   - 经验: 0
   - 技能: 空

### 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 基础生育率 | 5%/月 | 未修正的基础月生育概率 |
| 最小生育年龄 | 18岁 | 低于此年龄不可生育 |
| 最大生育年龄 | 45岁 | 高于此年龄不可生育 |
| 生育峰值年龄 | 25-30岁 | 此年龄段生育能力最强 |
| 最大子女数 | 5个 | 每个家庭最多子女数 |

---

## 婚姻系统 (MarriageSystem)

**优先级**: 85
**执行频率**: 每月一次

### 核心算法

#### 1. 适婚单身者筛选

```typescript
条件：
- 存活状态：isAlive = true
- 婚姻状态：未婚（partnerId 为空）
- 年龄：18 ≤ age ≤ 50
```

#### 2. 婚姻匹配

```typescript
// 分离单身男女
singleMales = singles.filter(gender === 'male')
singleFemales = singles.filter(gender === 'female')

// 配对数量取较小值
pairs = min(singleMales.length, singleFemales.length)

// 逐对匹配
for (i = 0; i < pairs; i++) {
  // 结婚概率判定
  if (random() < 0.02) {  // 2% 月结婚概率
    marry(male[i], female[i])
  }
}
```

#### 3. 结婚处理

1. **建立婚姻关系** (双向)：
   - 男性: `partnerId = femaleId`
   - 女性: `partnerId = maleId`

2. **发出结婚事件**:
   - 触发 `person:married` 事件
   - 记录结婚时间

### 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 月结婚概率 | 2% | 每对适婚男女的月结婚概率 |
| 最小结婚年龄 | 18岁 | 低于此年龄不能结婚 |
| 最大结婚年龄 | 50岁 | 高于此年龄不再结婚 |

---

## 资源系统 (ResourceSystem)

**优先级**: 80
**执行频率**: 每月一次

### 核心算法

#### 1. 资源生产

**食物生产**:
```typescript
// 农民食物产出
farmerFoodProduction = farmer.FOOD_BASE × ageEfficiency × healthEfficiency

// 年龄效率
if (18-30岁) ageEfficiency = 1.2   // 青壮年加成
if (51-60岁) ageEfficiency = 0.8   // 中老年减成
其他       ageEfficiency = 0.5

// 健康效率
if (健康 > 80)  healthEfficiency = 1.2  // 健康
if (健康 ≥ 60)  healthEfficiency = 1.0  // 正常
if (健康 ≥ 30)  healthEfficiency = 0.7  // 较差
if (健康 < 30)  healthEfficiency = 0.4  // 很差

// 季节性修正
seasonalModifier = [0.6, 0.7, 0.9, 1.0, 1.2, 1.4, 1.5, 1.3, 1.1, 0.9, 0.7, 0.6][月份-1]
totalFood = farmerFoodProduction × seasonalModifier
```

**资金生产**:
```typescript
// 农民销售农产品
farmerMoney = 农民数量 × 3

// 工人制造业收入
workerMoney = 工人数量 × 15

// 科学家科研拨款
scientistMoney = 科学家数量 × 20

// 基础税收
baseTax = 成年人口 × 5

totalMoney = farmerMoney + workerMoney + scientistMoney + baseTax
```

**教育与医疗生产**:
```typescript
educationProduction = 科学家数量 × 2
medicineProduction = 科学家数量 × 1
```

#### 2. 资源消耗

**食物消耗**:
```typescript
totalFoodConsumption = 0

for each person {
  consumption = BASE_CONSUMPTION

  // 年龄调整
  if (age < 7)   consumption = 0.5   // 幼儿
  if (age < 13)  consumption = 0.7   // 儿童
  if (age < 19)  consumption = 0.9   // 青少年
  if (age >= 60) consumption = 0.8   // 老人

  // 健康调整
  if (health < 30) consumption += 0.2  // 病人需要更多营养

  totalFoodConsumption += consumption
}
```

**资金消耗**:
```typescript
infrastructure = 5                      // 基础设施维护
unemploymentBenefits = 失业人口 × 2     // 失业救济
elderlyMedical = 老年人口 × 1           // 老人医疗补贴

totalMoneyConsumption = infrastructure + unemploymentBenefits + elderlyMedical
```

**医疗消耗**:
```typescript
elderlyMedicine = 60岁以上人口 × 0.1
sickMedicine = 健康<40的人口 × 0.3

totalMedicineConsumption = elderlyMedicine + sickMedicine
```

**教育消耗**:
```typescript
studentEducation = 6-18岁人口 × 0.5
```

**住房需求**:
```typescript
housingNeeds = 总人口
```

#### 3. 资源更新

```typescript
newFood = oldFood + foodProduction - foodConsumption
newMoney = oldMoney + moneyProduction - moneyConsumption
newMedicine = oldMedicine + medicineProduction - medicineConsumption
newEducation = oldEducation + educationProduction - educationConsumption
```

#### 4. 短缺效果

**食物短缺** (净生产 < 0):
```typescript
所有人健康 -= 2
```

**食物充足** (净生产 > 10):
```typescript
所有人健康 += 0.3 (上限100)
```

**医疗不足** (存量 ≤ 0 且消耗 > 生产):
```typescript
老人和病人(健康<40) 健康 -= 1
```

**医疗充足** (存量 > 20):
```typescript
老人和病人健康 += 0.2-0.5 (根据年龄)
```

**住房不足** (住房 < 需求):
```typescript
所有人健康 -= 0.5
```

### 配置参数

| 参数类型 | 参数 | 值 | 说明 |
|---------|------|-----|------|
| **食物** | 基础消耗 | 1.0/人/月 | 成人标准消耗 |
| | 幼儿消耗 | 0.5/人/月 | 0-6岁 |
| | 儿童消耗 | 0.7/人/月 | 7-12岁 |
| | 青少年消耗 | 0.9/人/月 | 13-18岁 |
| | 老人消耗 | 0.8/人/月 | 60岁以上 |
| | 农民基础产出 | 8/人/月 | 未修正前 |
| | 季节系数 | 0.6-1.5 | 1月最低，7月最高 |
| **资金** | 基础税收 | 5/人/月 | 成年人 |
| | 农民收入 | 3/人/月 | |
| | 工人收入 | 15/人/月 | |
| | 科学家收入 | 20/人/月 | |
| | 基础设施维护 | 5/月 | 固定支出 |
| | 失业救济 | 2/人/月 | |
| **医疗** | 老人消耗 | 0.1/人/月 | 60岁以上 |
| | 病人消耗 | 0.3/人/月 | 健康<40 |
| **教育** | 学生消耗 | 0.5/人/月 | 6-18岁 |

---

## 政策系统 (PolicySystem)

**优先级**: 60
**执行频率**: 每月一次

### 核心算法

#### 1. 政策持续时间

```typescript
for each activePolicy {
  // 持续时间消耗
  remainingDuration -= 1

  // 持续时间到期，自动停用
  if (remainingDuration ≤ 0) {
    deactivatePolicy(policy.id)
  }
}
```

#### 2. 政策效果

政策通过 EventBus 发出 `policy:effects` 事件，包含以下效果：

```typescript
interface PolicyEffects {
  fertilityRate: number      // 生育率修正 (-0.03 ~ +0.03)
  deathRate: number          // 死亡率修正 (-0.002 ~ +0.002)
  foodProduction: number     // 食物生产修正 (-20% ~ +20%)
  economy: number            // 经济修正 (-20% ~ +20%)
  medicineConsumption: number // 医疗消耗修正
}
```

### 政策类型

1. **人口政策**: 影响生育率和死亡率
2. **经济政策**: 影响资源生产和收入
3. **社会政策**: 影响健康和教育
4. **资源政策**: 影响资源消耗效率

---

## 统计系统 (StatisticsSystem)

**优先级**: 50
**执行频率**: 每月一次，每年记录一次

### 核心算法

#### 1. 实时统计更新

```typescript
// 平均年龄
averageAge = sum(所有人年龄) / 总人口

// 平均健康
averageHealth = sum(所有人健康) / 总人口

// 平均教育
averageEducation = sum(所有人教育) / 总人口

// 人口历史
populationHistory.push({ year, count })
```

#### 2. 年度统计记录

每年（month % 12 === 0 且 month > 0）记录一次：

```typescript
yearlyStatistics = {
  year: currentYear,
  population: populationCount,
  births: birthsThisYear,
  deaths: deathsThisYear,
  averageAge: averageAge,
  averageHealth: averageHealth,
  averageEducation: averageEducation,
}

birthsHistory.push({ year, count: birthsThisYear })
deathsHistory.push({ year, count: deathsThisYear })

// 重置年度计数器
birthsThisYear = 0
deathsThisYear = 0
```

#### 3. 事件监听

- **出生事件**: `totalBirths++`, `birthsThisYear++`
- **死亡事件**: `totalDeaths++`, `deathsThisYear++`

---

## 成就系统 (AchievementSystem)

**优先级**: 40
**执行频率**: 每年检查一次

### 成就列表

| ID | 名称 | 条件 |
|----|------|------|
| `population-100` | 人口破百 | 人口 ≥ 100 |
| `longevity` | 长寿之乡 | 平均年龄 ≥ 70岁 |
| `economic-prosperity` | 经济繁荣 | 资金 ≥ 5000 |
| `century-foundation` | 百年基业 | 游戏时长 ≥ 50年 |
| `zero-hunger` | 零饥饿 | 食物 ≥ 500 |
| `education-power` | 教育强国 | 平均教育 ≥ 6 |
| `baby-boom` | 人口大爆炸 | 单年出生 ≥ 15人 |
| `perfect-health` | 健康社会 | 平均健康 ≥ 75 |
| `survivor` | 幸存者 | 游戏时长 ≥ 20年 |

### 检查逻辑

```typescript
每年检查一次：
for each achievement {
  if (!achievement.unlocked) {
    if (achievement.condition(gameState)) {
      achievement.unlocked = true
      notifyPlayer(achievement)
    }
  }
}
```

---

## 游戏结束判定

### 失败条件

| 结局类型 | 触发条件 |
|---------|---------|
| 种族灭绝 | 人口 < 5人 |
| 经济崩溃 | 负债 ≥ 500 且持续 ≥ 6个月 |
| 社会崩溃 | 资源短缺(食物/资金/医疗任一耗尽)且持续 ≥ 6个月 |
| 老龄化危机 | 60岁以上占比 > 80% 且总人口 > 20人 |
| 资源枯竭 | 食物不足且持续 ≥ 6个月 |

### 胜利条件

| 结局类型 | 触发条件 | 评分要求 |
|---------|---------|---------|
| 勉强过关 | 存活 ≥ 50年 | 总分 ≥ 40 |
| 普通胜利 | 存活 ≥ 50年 | 总分 ≥ 60 |
| 优秀胜利 | 存活 ≥ 100年 | 总分 ≥ 75 |
| 完美结局 | 存活 ≥ 100年 | 总分 ≥ 90 |

### 评分计算

```typescript
总分 = 人口分 + 经济分 + 幸福分 + 健康分 + 教育分

人口分 = min(20, (人口 / 200) × 20)
经济分 = min(20, max(0, (资金 / 10000) × 20))
健康分 = min(20, (平均健康 / 100) × 20)
教育分 = min(20, (平均教育 / 10) × 20)
幸福分 = min(20, (平均健康 / 100) × 20)  // 暂用健康代替

评级：
90-100分 → S级
75-89分  → A级
60-74分  → B级
40-59分  → C级
0-39分   → D级
```

---

## 配置文件结构

所有游戏平衡数值集中在 `/src/constants/balance.ts`:

```typescript
balance.ts
├── RESOURCE_CONSUMPTION      // 资源消耗配置
├── RESOURCE_PRODUCTION       // 资源生产配置
├── HEALTH_SYSTEM            // 健康系统配置
├── DEATH_RATE               // 死亡率配置
├── BIRTH_RATE              // 出生率配置
├── POPULATION              // 人口配置
├── INITIAL_RESOURCES       // 初始资源配置
└── GAME_ENDING            // 游戏结束条件配置
```

---

## 调试建议

### 1. 平衡性调整

- **人口增长过快**: 降低 `BASE_FERTILITY_RATE` 或提高 `BASE_DEATH_RATE`
- **经济困难**: 提高 `BASE_TAX` 或降低 `INFRASTRUCTURE` 维护费
- **死亡率过高**: 降低 `LOW_HEALTH_MULTIPLIER` 或提高 `NATURAL_RECOVERY`

### 2. 关键指标监控

- 月出生率：建议 2-5%
- 月死亡率：建议 0.1-0.5%
- 人口增长率：建议 1-3%/月
- 食物净生产：建议 > 0
- 资金趋势：建议稳定或缓慢增长

---

## 更新日志

- 2024-12: 初始版本，完成 ECS 架构重构
- 所有数值配置化，便于平衡调整
- 移除重复逻辑，修复生育/死亡/婚姻率翻倍问题
