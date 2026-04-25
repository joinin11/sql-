import { Lesson } from '../types';

export const lessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'L1: 基础数据提取',
    description: '学习 SELECT 与 FROM，这是所有审计工作的起点。',
    content: `### 审计的第一步：数据提取

所有对账工作都始于对原始数据的提取。

\`\`\`sql
SELECT 字段名 FROM 表名;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-1/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't1-1',
        title: '【初级】提取运单 ID',
        instructions: '从 shipments 表中查询所有运单的 shipment_id。',
        expectedSql: 'SELECT shipment_id FROM shipments;',
        hint: 'SELECT shipment_id FROM shipments;',
        structuralHint: 'SELECT [列名] FROM [表名]',
        pitfallGuide: '注意：SQL 语句必须以分号 \`;\` 结尾。'
      },
      {
        id: 't1-2',
        title: '【进阶】多列审计',
        instructions: '同时提取运单 ID (shipment_id) 和 客户名称 (client_name)。',
        expectedSql: 'SELECT shipment_id, client_name FROM shipments;',
        hint: 'SELECT shipment_id, client_name FROM shipments;',
        structuralHint: 'SELECT [列A], [列B] FROM [表]',
        pitfallGuide: '多列查询时，字段之间必须使用逗号 \`,\` 分隔。'
      },
      {
        id: 't1-3',
        title: '【挑战】取证抽样',
        instructions: '提取前 3 行所有字段进行初步数据探测。',
        expectedResult: [
          { shipment_id: 'MAWB001', parent_id: null, client_name: 'Amazon', origin: 'Shanghai', destination: 'SFO', sku_count: 1000, shipping_date: '2024-03-01', shipment_type: 'MAWB' },
          { shipment_id: 'HAWB001-A', parent_id: 'MAWB001', client_name: 'Amazon', origin: 'Shanghai', destination: 'SFO', sku_count: 120, shipping_date: '2024-03-01', shipment_type: 'HAWB' },
          { shipment_id: 'HAWB001-B', parent_id: 'MAWB001', client_name: 'Amazon', origin: 'Shanghai', destination: 'SFO', sku_count: 880, shipping_date: '2024-03-01', shipment_type: 'HAWB' }
        ],
        hint: 'SELECT * FROM shipments LIMIT 3;',
        structuralHint: 'SELECT * FROM [表] LIMIT [数字]',
        pitfallGuide: '\`LIMIT\` 关键字只能放在 SQL 语句的最末尾。'
      }
    ]
  },
  {
    id: 'lesson-2',
    title: 'L2: 模糊审计与城市群测试',
    description: '使用 LIKE 和 IN 进行高效的数据范围锁定。',
    content: `### 模糊匹配与枚举过滤

在物流业，由于系统拼写错误，我们常需要使用 \`LIKE\`；同时，审计特定城市群需要 \`IN\`。

\`\`\`sql
WHERE 字段 LIKE '%内容%'
WHERE 字段 IN ('值1', '值2')
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-2/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't2-1',
        title: '【初级】关键词锁定',
        instructions: '找出 client_name 中包含 "Appl" 的 shipment_id 和 client_name。',
        expectedResult: [
          { shipment_id: 'MAWB003', client_name: 'Apple' },
          { shipment_id: 'MAWB005', client_name: 'Apple' },
          { shipment_id: 'MAWB009', client_name: 'Apple' },
          { shipment_id: 'MAWB010', client_name: 'Apple' }
        ],
        hint: "SELECT shipment_id, client_name FROM shipments WHERE client_name LIKE '%Appl%';",
        structuralHint: "WHERE [列名] LIKE '%[关键词]%'",
        pitfallGuide: 'LIKE 必须配合引号使用，且 % 代表通配符。'
      },
      {
        id: 't2-2',
        title: '【进阶】城市群审计',
        instructions: '筛选出目的地 (destination) 为 "SFO" 或 "LAX" 的运单号。',
        expectedSql: "SELECT shipment_id FROM shipments WHERE destination IN ('SFO', 'LAX');",
        hint: "SELECT shipment_id FROM shipments WHERE destination IN ('SFO', 'LAX');",
        structuralHint: "WHERE [列] IN ('值1', '值2')",
        pitfallGuide: 'IN 括号内的字符串列表，每个元素都必须加单引号且用逗号分隔。'
      },
      {
        id: 't2-3',
        title: '【挑战】排除特定分单',
        instructions: '找出所有不属于 "SFO" 且不属于 "LAX" 的运单。',
        expectedResult: [
          { shipment_id: 'MAWB004' }, { shipment_id: 'MAWB007' }, { shipment_id: 'HAWB007-A' },
          { shipment_id: 'MAWB011' }, { shipment_id: 'MAWB012' }, { shipment_id: 'MAWB013' }
        ],
        hint: "SELECT shipment_id FROM shipments WHERE destination NOT IN ('SFO', 'LAX');",
        structuralHint: "WHERE [列] NOT IN (...)",
        pitfallGuide: 'NOT 操作符可以反转 IN 的逻辑。'
      },
      {
        id: 't2-4',
        title: '【挑战】精准单字符占位审计',
        instructions: "从 shipments 表中找出目的地 (destination) 符合 'S_O' 格式的所有记录（如 SFO，排除掉长度不符的字符串）。",
        expectedResult: [
          { shipment_id: 'MAWB001', destination: 'SFO' },
          { shipment_id: 'HAWB001-A', destination: 'SFO' },
          { shipment_id: 'HAWB001-B', destination: 'SFO' },
          { shipment_id: 'MAWB003', destination: 'SFO' },
          { shipment_id: 'MAWB006', destination: 'SFO' },
          { shipment_id: 'MAWB008', destination: 'SFO' },
          { shipment_id: 'MAWB010', destination: 'SFO' }
        ],
        hint: "SELECT shipment_id, destination FROM shipments WHERE destination LIKE 'S_O';",
        structuralHint: "WHERE [列] LIKE 'S_O' (使用 _ 代表单个字符)",
        pitfallGuide: "与 % 不同，_ 只能代表一个且必须是一个字符。如果是找以 S 开头 O 结尾的长字符串，应使用 S%O。"
      }
    ]
  },
  {
    id: 'lesson-3',
    title: 'L3: 时间区间审计',
    description: '使用 BETWEEN 筛选特定日期的账单。',
    content: `### 日期区间判定

审计月度报表时，我们需要锁定特定的 shipping_date 区间。

\`\`\`sql
WHERE 日期 BETWEEN '2024-03-01' AND '2024-03-10'
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-3/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't3-1',
        title: '【初级】三月上旬审计',
        instructions: '找出 shipping_date 在 2024-03-01 到 2024-03-10 之间的运单 ID。',
        expectedSql: "SELECT shipment_id FROM shipments WHERE shipping_date BETWEEN '2024-03-01' AND '2024-03-10';",
        hint: "SELECT shipment_id FROM shipments WHERE shipping_date BETWEEN '2024-03-01' AND '2024-03-10';",
        structuralHint: "WHERE [日期] BETWEEN '[始]' AND '[终]'",
        pitfallGuide: 'BETWEEN 是闭区间，包含开始和结束日期。'
      },
      {
        id: 't3-2',
        title: '【进阶】排除异常空值',
        instructions: '找出 shipping_date 不为空的运单，并提取 ID。',
        expectedResult: [
          { shipment_id: 'MAWB001' }, { shipment_id: 'HAWB001-A' }, { shipment_id: 'HAWB001-B' },
          { shipment_id: 'MAWB002' }, { shipment_id: 'MAWB004' }, { shipment_id: 'MAWB005' },
          { shipment_id: 'MAWB006' }, { shipment_id: 'MAWB007' }, { shipment_id: 'HAWB007-A' },
          { shipment_id: 'MAWB008' }, { shipment_id: 'MAWB009' }, { shipment_id: 'MAWB010' },
          { shipment_id: 'MAWB011' }, { shipment_id: 'MAWB012' }, { shipment_id: 'MAWB013' }
        ],
        hint: 'SELECT shipment_id FROM shipments WHERE shipping_date IS NOT NULL;',
        structuralHint: 'WHERE [列] IS NOT NULL',
        pitfallGuide: '切记：判断 NULL 值必须使用 IS NULL 或 IS NOT NULL，不能使用 = 或 <>。'
      },
      {
        id: 't3-3',
        title: '【挑战】多重范围过滤',
        instructions: '找出 SKU 数量在 200 到 1000 之间，且目的地为 SFO 的运单。',
        expectedResult: [
          { shipment_id: 'MAWB001' }, { shipment_id: 'HAWB001-B' }, { shipment_id: 'MAWB008' }, { shipment_id: 'MAWB010' }
        ],
        hint: "SELECT shipment_id FROM shipments WHERE sku_count BETWEEN 200 AND 1000 AND destination = 'SFO';",
        structuralHint: 'WHERE [数值] BETWEEN ... AND ... AND ...',
        pitfallGuide: 'BETWEEN 也可用于数值过滤。'
      }
    ]
  },
  {
    id: 'lesson-4',
    title: 'L4: 运单-账单 1:1 对账',
    description: '使用 INNER JOIN 找出完全匹配的记录。',
    content: `### 完美匹配审计

INNER JOIN 只显示 A 表和 B 表中都有的交集。

\`\`\`sql
SELECT s.shipment_id, i.invoice_no FROM shipments s
INNER JOIN invoices i ON s.shipment_id = i.shipment_id;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-4/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't4-1',
        title: '【初级】基础内连接',
        instructions: '查询 shipments 和 invoices，显示匹配的运单号 and 账单号。',
        expectedSql: 'SELECT s.shipment_id, i.invoice_no FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        hint: 'SELECT s.shipment_id, i.invoice_no FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        structuralHint: 'SELECT ... FROM A JOIN B ON A.k = B.k',
        pitfallGuide: '如果不指定连接类型，默认就是 INNER JOIN。'
      },
      {
        id: 't4-2',
        title: '【进阶】关联金额统计',
        instructions: '显示每个内连接匹配运单的金额 (amount_usd)。',
        expectedSql: 'SELECT s.shipment_id, i.amount_usd FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        hint: 'SELECT s.shipment_id, i.amount_usd FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        structuralHint: 'SELECT ... FROM A JOIN B ON ...',
        pitfallGuide: '别名（如 s, i）能极大缩短语句长度。'
      },
      {
        id: 't4-3',
        title: '【挑战】多表金额核验',
        instructions: '找出已开账单运单的 sku_count 信息。',
        expectedSql: 'SELECT s.shipment_id, s.sku_count FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        hint: 'SELECT s.shipment_id, s.sku_count FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id;',
        structuralHint: 'SELECT [表1.列] ... FROM Table1 s JOIN Table2 i ON ...',
        pitfallGuide: '当两张表有同名列时，必须使用 "表名.列名" 或 "别名.列名"。"表名.列名" 或 "别名.列名"。'
      }
    ]
  },
  {
    id: 'lesson-5',
    title: 'L5: 聚合审计基础',
    description: '使用衡量函数：COUNT、SUM、AVG 审计核心业务指标。',
    content: `### 资产衡量：聚合函数
    
在财务审计中，我们很少看单条记录，更多是关注总量。

\`\`\`sql
SELECT SUM(字段) FROM 表; -- 基础用法
SELECT SUM(字段) AS total FROM 表; -- 推荐用法（带别名）
\`\`\`

**提示：** 现在的审计系统非常智能，只要你的计算结果正确，即使没有使用 \`AS\` 别名也能顺利通关！
    `,
    imageUrl: 'https://picsum.photos/seed/audit-5/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't5-1',
        title: '【初级】运单总量盘点',
        instructions: '统计 shipments 表中目前的运单总条数，并将该列命名为 **total_cnt**。',
        expectedSql: 'SELECT COUNT(*) AS total_cnt FROM shipments;',
        hint: 'SELECT COUNT(*) AS total_cnt FROM shipments;',
        structuralHint: 'SELECT COUNT(*) AS [别名] FROM [表]',
        pitfallGuide: 'COUNT(*) 会统计全行数，性能极佳。'
      },
      {
        id: 't5-2',
        title: '【进阶】总仓储量审计',
        instructions: '汇总 shipments 表中所有货物的总 SKU 数量 (sku_count)，并将该列命名为 **total_sku**。',
        expectedSql: 'SELECT SUM(sku_count) AS total_sku FROM shipments;',
        hint: 'SELECT SUM(sku_count) AS total_sku FROM shipments;',
        structuralHint: 'SELECT SUM([数值列]) AS [别名] FROM [表]',
        pitfallGuide: 'SUM 遇到 NULL 值会直接跳过。'
      },
      {
        id: 't5-3',
        title: '【挑战】平均运费核算',
        instructions: '从 invoices 表中计算所有已出账单的平均美元金额 (amount_usd)，并将该列命名为 **avg_price**。',
        expectedSql: 'SELECT AVG(amount_usd) AS avg_price FROM invoices;',
        hint: 'SELECT AVG(amount_usd) AS avg_price FROM invoices;',
        structuralHint: 'SELECT AVG([数值列]) AS [别名] FROM [表]',
        pitfallGuide: 'AVG 只对数值有效。'
      }
    ]
  },
  {
    id: 'lesson-6',
    title: 'L6: 分组报表汇总',
    description: '通过 GROUP BY 将散乱的单据转化为专业的财务分类摘要。',
    content: `### 报表的核心：GROUP BY
    
GROUP BY 是将数据按某一列“归类”并执行统计。

\`\`\`sql
SELECT 维度, SUM(量) FROM 表
GROUP BY 维度;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-6/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't6-1',
        title: '【初级】客户分布审计',
        instructions: '按客户 (client_name) 分组，统计每个客户的运单总数，并将该列命名为 **cnt**。',
        expectedSql: 'SELECT client_name, COUNT(*) AS cnt FROM shipments GROUP BY client_name;',
        hint: 'SELECT client_name, COUNT(*) AS cnt FROM shipments GROUP BY client_name;',
        structuralHint: 'SELECT [维度], COUNT(*) AS [别名] FROM ... GROUP BY [维度]',
        pitfallGuide: 'SELECT 中的非聚合列，必须出现在 GROUP BY 后面。'
      },
      {
        id: 't6-2',
        title: '【进阶】目的地货量排行',
        instructions: '按目的地 (destination) 分组，求每个目的地的 SKU 总和，并将该列命名为 **total_sku**。',
        expectedSql: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination;',
        hint: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination;',
        structuralHint: 'SELECT [列], SUM(...) AS [别名] FROM [表] GROUP BY [列]',
        pitfallGuide: 'NULL 值会被作为一个独立的分组出现。'
      }
    ]
  },
  {
    id: 'lesson-7',
    title: 'L7: 分组 vs 阈值',
    description: '深度理解 GROUP BY 与 HAVING 的审计差异。',
    content: `### 汇总过滤：HAVING 的特殊地位

WHERE 是在分组前过滤原始行；HAVING 是在聚合完成后过滤统计结果。

\`\`\`sql
SELECT 客户, SUM(货量) FROM shipments
GROUP BY 客户
HAVING SUM(货量) > 500;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-7/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't7-1',
        title: '【初级】按目的地汇总',
        instructions: '统计每个目的地的总 SKU 货量，并将该列命名为 **total_sku**。',
        expectedSql: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination;',
        hint: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination;',
        structuralHint: 'SELECT [列], SUM([聚合]) AS [别名] FROM [表] GROUP BY [列]',
        pitfallGuide: 'GROUP BY 后的字段必须出现在 SELECT 中（除非是聚合函数）。'
      },
      {
        id: 't7-2',
        title: '【进阶】排除小额货量目的地',
        instructions: '找出 SKU 总和大于 1000 的所有目的地，并将该列命名为 **total_sku**。',
        expectedSql: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination HAVING SUM(sku_count) > 1000;',
        hint: 'SELECT destination, SUM(sku_count) AS total_sku FROM shipments GROUP BY destination HAVING SUM(sku_count) > 1000;',
        structuralHint: '... GROUP BY ... HAVING [聚合条件]',
        pitfallGuide: '切记：HAVING 后面不能跟没有被聚合的原始字段。'
      },
      {
        id: 't7-3',
        title: '【挑战】客户单量双重过滤',
        instructions: '找出运单数量超过 1 票的客户名称及其运单数，并将该列命名为 **cnt**。',
        expectedSql: 'SELECT client_name, COUNT(*) AS cnt FROM shipments GROUP BY client_name HAVING COUNT(*) > 1;',
        hint: 'SELECT client_name, COUNT(*) AS cnt FROM shipments GROUP BY client_name HAVING COUNT(*) > 1;',
        structuralHint: '... GROUP BY ... HAVING COUNT(*) > ...',
        pitfallGuide: 'COUNT(*) 用于统计行数，常用于找出重复记录或评估活跃度。'
      }
    ]
  },
  {
    id: 'lesson-8',
    title: 'L8: 异常单据排查 (OUTER JOIN)',
    description: '使用 LEFT/RIGHT JOIN 探测那些“漏网之鱼”——坏账或缺失单据。',
    content: `### 坏账排查：Outer Join
    
LEFT JOIN 会保留左表所有记录，即使右表没有匹配。这是查找“漏开账单”的核心逻辑。

\`\`\`sql
SELECT * FROM TableA LEFT JOIN TableB
ON A.id = B.id WHERE B.id IS NULL;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-8/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't8-1',
        title: '【实战】找出漏开账单运单',
        instructions: '找出所有在 shipments 中存在但在 invoices 中找不到记录的 shipment_id。',
        expectedSql: 'SELECT s.shipment_id FROM shipments s LEFT JOIN invoices i ON s.shipment_id = i.shipment_id WHERE i.invoice_no IS NULL;',
        hint: 'SELECT s.shipment_id FROM shipments s LEFT JOIN invoices i ON s.shipment_id = i.shipment_id WHERE i.invoice_no IS NULL;',
        structuralHint: 'FROM s LEFT JOIN i ON ... WHERE i.xxx IS NULL',
        pitfallGuide: '右表关联不上的字段在结果中全是 NULL。'
      },
      {
        id: 't8-2',
        title: '【实战】排查“幽灵账单”',
        instructions: '找出所有在 invoices 中存在但 shipments 表里查无此单的账单号 (invoice_no)。',
        expectedSql: 'SELECT i.invoice_no FROM invoices i LEFT JOIN shipments s ON i.shipment_id = s.shipment_id WHERE s.shipment_id IS NULL;',
        hint: 'SELECT i.invoice_no FROM invoices i LEFT JOIN shipments s ON i.shipment_id = s.shipment_id WHERE s.shipment_id IS NULL;',
        structuralHint: 'LEFT JOIN 后检查左表存在的 ID 在右表是否为 NULL',
        pitfallGuide: '如果财务开出了没有物流底单的账单，这可能预示着合规性风险。'
      }
    ]
  },
  {
    id: 'lesson-9',
    title: 'L9: 复杂多条件过滤',
    description: '结合 AND, OR 和括号，处理多维度的复杂审计判定。',
    content: `### 逻辑组合拳
    
当审计条件变多时，逻辑优先级极其重要。

\`\`\`sql
WHERE (条件A AND 条件B) OR 条件C;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-9/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't9-1',
        title: '【高级】复合条件取证',
        instructions: '找出目的地为 "SFO" 且货量 > 1000 的，或者客户是 "Walmart" 的运单。',
        expectedSql: "SELECT shipment_id FROM shipments WHERE (destination = 'SFO' AND sku_count > 1000) OR client_name = 'Walmart';",
        hint: "SELECT shipment_id FROM shipments WHERE (destination = 'SFO' AND sku_count > 1000) OR client_name = 'Walmart';",
        structuralHint: 'WHERE (cond1 AND cond2) OR cond3',
        pitfallGuide: '如果不加括号，AND 的优先级高于 OR，可能会导致筛选逻辑混乱。'
      }
    ]
  },
  {
    id: 'lesson-10',
    title: 'L10: 业务标签自动打标',
    description: '使用 CASE WHEN 根据货量对运单进行等级分类。',
    content: `### 业务翻译器：CASE WHEN

CASE WHEN 可以将数据库的死代码翻译成业务语言（如：海量单、普通单、微型单）。

\`\`\`sql
CASE WHEN SKU > 1000 THEN '海量单'
WHEN SKU > 100 THEN '普通单'
ELSE '微型单' END AS 等级
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-10/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't10-1',
        title: '【初级】SKU 等级分类',
        instructions: "显示 shipment_id 及其分类（sku_count > 1000 为 '大项'，否则为 '普通'），并将分类列命名为 **label**。",
        expectedSql: "SELECT shipment_id, CASE WHEN sku_count > 1000 THEN '大项' ELSE '普通' END AS label FROM shipments;",
        hint: "SELECT shipment_id, CASE WHEN sku_count > 1000 THEN '大项' ELSE '普通' END AS label FROM shipments;",
        structuralHint: 'SELECT ID, CASE WHEN ... THEN ... ELSE ... END AS [别名] FROM ...',
        pitfallGuide: 'CASE 语句必须以 END 结束，如果不写 ELSE，不满足条件的会返回 NULL。'
      },
      {
        id: 't10-2',
        title: '【进阶】三段式分类',
        instructions: "根据 sku_count 将运单分为三类：>1000 为 '大货', 500-1000 为 '中货', <500 为 '小货'，并将该列命名为 **rank**。",
        expectedSql: "SELECT shipment_id, CASE WHEN sku_count > 1000 THEN '大货' WHEN sku_count >= 500 THEN '中货' ELSE '小货' END AS rank FROM shipments;",
        hint: "SELECT shipment_id, CASE WHEN sku_count > 1000 THEN '大货' WHEN sku_count >= 500 THEN '中货' ELSE '小货' END AS rank FROM shipments;",
        structuralHint: 'CASE WHEN ... WHEN ... ELSE ... END AS [别名]',
        pitfallGuide: 'SQL 在评估 CASE 时是从上到下的，一旦命中第一个真值条件即停止评估。'
      },
      {
        id: 't10-3',
        title: '【挑战】账单金额报警',
        instructions: "在 invoices 表中对金额打标：金额 > 5000 为 '高值'，0-5000 为 '标准'，0 为 '免费单'，并将该列命名为 **alert**。",
        expectedSql: "SELECT invoice_no, CASE WHEN amount_usd > 5000 THEN '高值' WHEN amount_usd > 0 THEN '标准' ELSE '免费单' END AS alert FROM invoices;",
        hint: "SELECT invoice_no, CASE WHEN amount_usd > 5000 THEN '高值' WHEN amount_usd > 0 THEN '标准' ELSE '免费单' END AS alert FROM invoices;",
        structuralHint: 'SELECT ..., CASE ... END AS [别名] FROM ...',
        pitfallGuide: '注意 0 的处理，如果没有 ELSE 或第二个 WHEN，它可能被错误归类。'
      }
    ]
  },
  {
    id: 'lesson-11',
    title: 'L11: 报表美化与去重',
    description: '使用 DISTINCT 获取名单，并用 AS 构建漂亮的表头。',
    content: `### 完美报表呈现：AS 与 DISTINCT

DISTINCT 用于剔除重复记录；AS 用于定义输出列的名称，让审计报告更专业。

\`\`\`sql
SELECT DISTINCT 客户 AS [客户大名单] FROM 表;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-11/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't11-1',
        title: '【初级】无重复客户名单',
        instructions: '获取所有唯一的 client_name 列表。',
        expectedSql: 'SELECT DISTINCT client_name FROM shipments;',
        hint: 'SELECT DISTINCT client_name FROM shipments;',
        structuralHint: 'SELECT DISTINCT [列] FROM [表]',
        pitfallGuide: 'DISTINCT 会对 SELECT 后面所有列的组合进行去重。'
      },
      {
        id: 't11-2',
        title: '【进阶】构建财务报表头',
        instructions: '获取所有唯一的目的地，并将结果列命名为 **审计目标城市**。',
        expectedSql: 'SELECT DISTINCT destination AS "审计目标城市" FROM shipments;',
        hint: 'SELECT DISTINCT destination AS 审计目标城市 FROM shipments;',
        structuralHint: 'SELECT DISTINCT [列] AS [新名] FROM [表]',
        requireStrictKeys: true,
        pitfallGuide: 'AS 后面如果包含空格或特殊字符，通常需要使用方括号 `[]` 或双引号 `""`。'
      },
      {
        id: 't11-3',
        title: '【挑战】多列去重审计',
        instructions: '获取所有唯一的 "始发地-目的地" 组合。',
        expectedSql: 'SELECT DISTINCT origin, destination FROM shipments;',
        hint: 'SELECT DISTINCT origin, destination FROM shipments;',
        structuralHint: 'SELECT DISTINCT [列1], [列2] FROM ...',
        pitfallGuide: '当多列去重时，只要其中一列不同，该行就会被保留。'
      }
    ]
  },
  {
    id: 'lesson-12',
    title: 'L12: 子查询深度排雷',
    description: '使用子查询找出那些价格高于平均值的“异常运单”。',
    content: `### 嵌套的力量：子查询

子查询是指嵌套在另一个 SQL 语句中的查询。

\`\`\`sql
SELECT * FROM invoices
WHERE 金额 > (SELECT AVG(金额) FROM invoices);
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-12/800/400',
    tableToQuery: 'invoices',
    tasks: [
      {
        id: 't12-1',
        title: '【初级】高于平均价账单',
        instructions: '找出所有比平均账单金额 (amount_usd) 高的记录。',
        expectedSql: 'SELECT * FROM invoices WHERE amount_usd > (SELECT AVG(amount_usd) FROM invoices);',
        hint: 'SELECT * FROM invoices WHERE amount_usd > (SELECT AVG(amount_usd) FROM invoices);',
        structuralHint: 'WHERE [列] > (SELECT AVG(...) FROM ...)',
        pitfallGuide: '子查询必须放在小括号 `()` 内且能产生单一值（在标量子查询中）。'
      },
      {
        id: 't12-2',
        title: '【进阶】查找特定客户的运单',
        instructions: '在 shipments 表中，只查询对应在 invoices 表中存在的记录。',
        expectedSql: 'SELECT shipment_id FROM shipments WHERE shipment_id IN (SELECT shipment_id FROM invoices);',
        hint: 'SELECT shipment_id FROM shipments WHERE shipment_id IN (SELECT shipment_id FROM invoices);',
        structuralHint: 'WHERE ID IN (SELECT ID FROM ...)',
        pitfallGuide: 'IN 子查询非常强大，但如果数据量巨大，性能可能不如 JOIN。'
      },
      {
        id: 't12-3',
        title: '【挑战】最大货量单据审计',
        instructions: '找出 shipments 中 sku_count 等于全表最大值的记录。',
        expectedSql: 'SELECT shipment_id, sku_count FROM shipments WHERE sku_count = (SELECT MAX(sku_count) FROM shipments);',
        hint: 'SELECT shipment_id, sku_count FROM shipments WHERE sku_count = (SELECT MAX(sku_count) FROM shipments);',
        structuralHint: 'WHERE [列] = (SELECT MAX(...) FROM ...)',
        pitfallGuide: '子查询通常先于外部查询执行。'
      }
    ]
  },
  {
    id: 'lesson-13',
    title: 'L13: 窗口函数排序排重',
    description: '使用 ROW_NUMBER() 分配时间顺序编号，识别第一单。',
    content: `### 时间线与排位：ROW_NUMBER()

在财务系统中，我们需要找出某个客户“最近的一单”或“第一单”。

\`\`\`sql
ROW_NUMBER() OVER(
  PARTITION BY 客户
  ORDER BY 日期
) AS 编号
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/audit-13/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't13-1',
        title: '【初级】全表流水号',
        instructions: '给所有运单生成一个按 shipping_date 排序的流水号，并将该列命名为 **num**。',
        expectedSql: 'SELECT shipment_id, ROW_NUMBER() OVER(ORDER BY shipping_date) AS num FROM shipments;',
        hint: 'SELECT shipment_id, ROW_NUMBER() OVER(ORDER BY shipping_date) AS num FROM shipments;',
        structuralHint: 'ROW_NUMBER() OVER(ORDER BY ...)',
        requireStrictKeys: true,
        pitfallGuide: 'ROW_NUMBER 不需要参数，括号始终为空。'
      },
      {
        id: 't13-2',
        title: '【进阶】客户分组编号',
        instructions: '按客户(client_name)分组，并按日期排序，给每个客户的运单分配独立序号，并将该列命名为 **seq**。',
        expectedSql: 'SELECT client_name, shipment_id, ROW_NUMBER() OVER(PARTITION BY client_name ORDER BY shipping_date) AS seq FROM shipments;',
        hint: 'SELECT client_name, shipment_id, ROW_NUMBER() OVER(PARTITION BY client_name ORDER BY shipping_date) AS seq FROM shipments;',
        structuralHint: 'ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...)',
        requireStrictKeys: true,
        pitfallGuide: 'PARTITION BY 负责划定独立的编号区间（类似于文件夹归类）。'
      },
      {
        id: 't13-3',
        title: '【挑战】标记最近一单',
        instructions: '找出每个客户最后（最新）一票运单的 ID。请在子查询中将 ROW_NUMBER() 生成的列命名为 **rn**，并在外层查询中根据 **rn = 1** 进行过滤。',
        expectedSql: 'SELECT client_name, shipment_id FROM (SELECT client_name, shipment_id, ROW_NUMBER() OVER(PARTITION BY client_name ORDER BY shipping_date DESC) as rn FROM shipments) WHERE rn = 1;',
        hint: 'SELECT client_name, shipment_id FROM (SELECT client_name, shipment_id, ROW_NUMBER() OVER(PARTITION BY client_name ORDER BY shipping_date DESC) as rn FROM shipments) WHERE rn = 1;',
        structuralHint: 'SELECT ... FROM (SELECT ... ROW_NUMBER() ... ) WHERE rn = 1',
        pitfallGuide: '窗口函数不能直接用在 WHERE 子句中，必须通过子查询来引用它生成的列。'
      }
    ]
  },
  {
    id: 'lesson-14',
    title: 'L14: 终极综合审计节',
    description: '整合所有技能，完成一次全链路财务对账审计。',
    content: `### 终极实战：从单据到合规

恭喜！你已掌握了物流财务审计的核心 SQL 武器。现在请利用联表、聚合、筛选、CASE 判定完成最后的审计报告。

\`\`\`sql
SELECT 综合数据 FROM 全链条关联
WHERE 逻辑漏洞判定;
\`\`\`
    `,
    imageUrl: 'https://picsum.photos/seed/final-audit/800/400',
    tableToQuery: 'shipments',
    tasks: [
      {
        id: 't14-1',
        title: '【综合】财务状态大盘',
        instructions: '统计目前所有已生成账单的总额和运单总量，并将该两列分别命名为 **total_revenue** 和 **bill_count**。',
        expectedSql: 'SELECT SUM(amount_usd) AS total_revenue, COUNT(*) AS bill_count FROM invoices;',
        hint: 'SELECT SUM(amount_usd) AS total_revenue, COUNT(*) AS bill_count FROM invoices;',
        structuralHint: 'SELECT SUM(...) AS [别名1], COUNT(*) AS [别名2] FROM ...',
        pitfallGuide: '汇总所有数值时，注意不同币种或单位在真实业务场景中是否一致。'
      },
      {
        id: 't14-2',
        title: '【综合】异常未付件识别',
        instructions: '查找所有 "未付" 状态，且 SKU 货量大于 200 的运单及对应金额。',
        expectedSql: "SELECT s.shipment_id, i.amount_usd FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id WHERE i.status = '未付' AND s.sku_count > 200;",
        hint: "SELECT s.shipment_id, i.amount_usd FROM shipments s JOIN invoices i ON s.shipment_id = i.shipment_id WHERE i.status = '未付' AND s.sku_count > 200;",
        structuralHint: 'SELECT ... JOIN ... WHERE [复合条件]',
        pitfallGuide: '多条件过滤时，请确认 AND 逻辑是否符合业务排查预期。'
      },
      {
        id: 't14-3',
        title: '【综合】全链路对账报告',
        instructions: "生成由 Amazon 承运的所有单据，显示单号及其财务标记：金额 > 10000 为 '核心大单'，否则为 '测试单'，并将标记列命名为 **tag**。",
        expectedSql: "SELECT s.shipment_id, CASE WHEN i.amount_usd > 10000 THEN '核心大单' ELSE '测试单' END AS tag FROM shipments s LEFT JOIN invoices i ON s.shipment_id = i.shipment_id WHERE s.client_name = 'Amazon';",
        hint: "SELECT s.shipment_id, CASE WHEN i.amount_usd > 10000 THEN '核心大单' ELSE '测试单' END AS tag FROM shipments s LEFT JOIN invoices i ON s.shipment_id = i.shipment_id WHERE s.client_name = 'Amazon';",
        structuralHint: 'SELECT ..., CASE ... END AS tag FROM ...',
        pitfallGuide: '使用 LEFT JOIN 确保未产生账单的运单也不会在审计报告中“被消失”。'
      }
    ]
  }
];
