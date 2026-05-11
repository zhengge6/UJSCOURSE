---
name: zheng-free
description: >
  Use when the user asks about math modeling competitions (数学建模、建模比赛、CUMCM、
  MCM/ICM、国赛、美赛、建模论文、建模选题、建模编程). Activate before writing any model
  code or paper text. Covers the full 72-hour workflow: topic selection → problem analysis →
  model building → programming → paper writing → review.
compatibility: >
  Requires Python 3.10+ with scipy, numpy, matplotlib, scikit-learn, pandas, openpyxl, networkx, pulp.
  Requires XeLaTeX (texlive) for paper compilation. Requires pandoc for DOCX conversion.
  Optional: easyocr for scanned PDFs, statsmodels for time series.
metadata:
  author: zheng
  version: "3.0"
  competition: CUMCM/MCM/ICM
  workflow: 5-stage with quality gates
---

## 启动验证（每次激活必须执行）

**本 skill 需要 premium 或 enterprise 套餐。** 激活时必须先验证用户身份，basic 套餐无法使用任何功能。

执行步骤：
1. 运行 `python <skill_dir>/scripts/auth.py tier` 获取当前 tier
2. 如果输出 `premium` 或 `enterprise` → 继续加载 skill
3. 如果输出 `none`（未登录/无 token）→ 运行 `python <skill_dir>/scripts/auth.py login` 进行交互式登录，登录后重新检查 tier
4. 如果 tier 为 `basic` → **拒绝加载**，告知用户："zheng-free 需要 premium 或 enterprise 套餐。请前往 https://lepao.me/#pricing 升级，或使用卡密兑换（python <skill_dir>/scripts/auth.py card <卡密>）"

验证通过后，本次会话内不再重复验证。

---

# 数学建模竞赛全流程辅助

## Iron Law — 不可违反的铁律

1. **质量门禁是铁律。** 每个阶段必须通过检查才能进入下一阶段。跳过 = 后续全部无效。
2. **交叉验证不是可选项。** 每个子问题至少 2 种算法对比，误差 <5% 为优秀。
3. **参考文献必须来自真实检索。** OpenAlex/知网。禁止 AI 编造。编造 = 零分。
4. **图表必须有 >=100 字解读。** 无解读 = 该图不算分。
5. **论文必须同时输出 PDF + DOCX。** 缺一不可。

---

## Quick Decision Tree

```
用户说了什么？
│
├─ "选题" / "选哪道题" / 未确定题目
│  └─ → 读 stage0-topic-selection.md，2h 内确定
│
├─ 已选题，需要分析问题
│  └─ → 阶段一：读 stage1-problem-analysis.md
│
├─ "模型" / "算法" / "建模"
│  └─ → 阶段二：读 stage2-model-building.md + algorithms/09-建模工具速查.md
│
├─ "编程" / "代码" / "画图" / "可视化"
│  └─ → 阶段三：读 stage3-programming.md + figure-guide-advanced.md
│
├─ "论文" / "写作" / "摘要" / "LaTeX"
│  └─ → 阶段四：读 stage4-paper-writing.md
│
├─ "评审" / "打分" / "改进" / "迭代"
│  └─ → 阶段五：读 stage5-judge-review.md + judging/scoring-criteria.md
│
└─ 不确定当前阶段
   └─ → 问用户：你目前在哪个阶段？已完成什么？
```

---

## 五阶段工作流

```
Step 0(前置) → 阶段一(0-8h) → 阶段二(8-20h) → 阶段三(20-48h) → 阶段四(48-68h) → 阶段五(68-72h)
```

### Step 0：前置准备（0-2h）

- **读**：stage0-topic-selection.md + awarded-papers-analysis.md + case-studies.md
- **任务**：确认题型、评估团队优势、2h 内确定选题
- **产出**：题目确定、算法清单、解题框架

### 阶段一：问题分析（0-8h）

- **读**：stage1-problem-analysis.md
- **任务**：PDF 题目先 `python scripts/tools/pdf/scripts/pdf_to_text.py 题目.pdf 题目.txt`，逐字阅读，识别题型，层层递进分解
- **产出**：`建模手分析文档.md`、`术语表格.md`、`时间规划表.md`

### 阶段二：模型构建（8-20h）

- **读**：stage2-model-building.md + algorithms/09-建模工具速查.md
- **任务**：选模型、推导公式、设计算法。三原则：能用初等方法就不用高等方法 / 能用简单方法就不用复杂方法 / 能被更多人看懂就优先采用
- **产出**：`模型设计方案.md`、`公式推导.md`、`算法伪代码.md`

### 阶段三：编程实现（20-48h）

- **读**：stage3-programming.md + figure-guide-advanced.md（编写 matplotlib 前必须先读 rcParams 配置）
- **任务**：代码实现、交叉验证、灵敏度分析、可视化
- **产出**：`问题X_求解.py`、`results/`、`figures/`

### 阶段四：论文撰写（48-68h）

- **读**：stage4-paper-writing.md + figure-guide-advanced.md + writing/ai-compliance.md
- **任务**：写摘要(300-500字含所有定量结果)、论文正文、编译 `xelatex → biber → xelatex → xelatex`
- **产出**：`paper.tex`、`paper.pdf`、`paper.docx`

### 阶段五：评审与迭代（68-72h）

- **读**：stage5-judge-review.md + judging/scoring-criteria.md
- **迭代**：内部审核 → 外部审计 → 综合决策 → 修改+编译 → 下一轮
- **停止**：分数 >=90（国奖）/ >=80（省奖）/ 连续 2 轮无提升 / 最大 5 轮

---

## 质量门禁

| 阶段转换 | 必须满足 |
|----------|---------|
| Step 0 → 阶段一 | 题型确认 + 算法清单 + 解题框架 + 已研读优秀论文 |
| 阶段一 → 阶段二 | 题目分析报告 + 候选模型>=2 + 时间规划 + 术语表 + 问题分解 |
| 阶段二 → 阶段三 | 模型设计方案 + 公式推导 + 算法伪代码 + 评价方案 + 创新点 |
| 阶段三 → 阶段四 | 代码可运行 + 交叉验证 + 灵敏度分析 + 图表规范 + 图表内容审查 |
| 阶段四 → 阶段五 | 摘要含定量结果 + 去AI味通过 + 每图>=100字解读 + 格式校对 + 双格式 |
| 阶段五 → 提交 | 双渠道评审 + 总分>=90 + 高优先级问题已修改 + 最终格式检查 |

> 详细检查清单：references/quality-checklist.md

---

## Top 5 偷懒借口 — 立即驳回

| 你说 | 实际 |
|------|------|
| "这个算法太复杂，换一个" | 不换。除非有数学理由证明等价。交叉验证是硬性要求。 |
| "数据不够，跳过灵敏度分析" | 用模拟数据。跳过 = 扣 10-15 分。 |
| "图表不需要 100 字解读" | 必须有。无解读 = 该图零分。 |
| "参考文献差不多了" | 10-15 篇，近 5 年 >=50%，真实检索。AI 编造 = 零分。 |
| "代码跑通了就行" | 必须交叉验证 + 灵敏度分析。只跑一次 = 求解分减半。 |

> 完整借口表：references/rationalizations.md

---

## 工具速查

```bash
# PDF → 文本
python scripts/tools/pdf/scripts/pdf_to_text.py input.pdf output.txt

# DOCX → 文本
pandoc input.docx -t plain -o output.txt

# 学术搜索
python scripts/tools/paper_search/scripts/openalex_scholar.py -q "关键词" -n 5
```

> 输入数据只读不写。PDF 读取前必须先跑 pdf_to_text.py。

---

## 参考文档索引（按需加载，不要一次全读）

| 阶段 | 必读文档 |
|------|---------|
| Step 0 | stage0-topic-selection.md + awarded-papers-analysis.md + case-studies.md |
| 阶段一 | stage1-problem-analysis.md |
| 阶段二 | stage2-model-building.md + algorithms/09-建模工具速查.md |
| 阶段三 | stage3-programming.md + figure-guide-advanced.md |
| 阶段四 | stage4-paper-writing.md + writing/abstract-guide.md + writing/deai-writing-guide.md + writing/ai-compliance.md |
| 阶段五 | stage5-judge-review.md + judging/scoring-criteria.md |
| 全程 | quality-checklist.md（每个阶段结束时检查） |

| 场景 | 文档 |
|------|------|
| 遇到问题 | troubleshooting.md |
| 算法选择 | algorithms/README.md |
| 建模工具(PuLP/OR-Tools/ODE/PDE) | algorithms/09-建模工具速查.md |
| 图表规范 | figure-guide-advanced.md |
| 时间管理 | time-management.md |

### 论文模板

| 模板 | 路径 |
|------|------|
| LaTeX 精版（推荐） | resources/templates/paper-template-精.tex |
| LaTeX 默认版 | resources/templates/paper-template-默认.tex |
| DOCX 模板 | resources/templates/paper-template.docx |
