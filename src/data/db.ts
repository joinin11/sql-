export const seedData = `
-- 运单主表
CREATE TABLE shipments (
  shipment_id TEXT PRIMARY KEY,
  parent_id TEXT,
  client_name TEXT,
  origin TEXT,
  destination TEXT,
  sku_count INTEGER,
  shipping_date DATE,
  shipment_type TEXT
);

INSERT INTO shipments VALUES ('MAWB001', NULL, 'Amazon', 'Shanghai', 'SFO', 1000, '2024-03-01', 'MAWB');
INSERT INTO shipments VALUES ('HAWB001-A', 'MAWB001', 'Amazon', 'Shanghai', 'SFO', 120, '2024-03-01', 'HAWB'); 
INSERT INTO shipments VALUES ('HAWB001-B', 'MAWB001', 'Amazon', 'Shanghai', 'SFO', 880, '2024-03-01', 'HAWB');
INSERT INTO shipments VALUES ('MAWB002', NULL, 'Walmart', 'Shenzhen', 'LAX', 450, '2024-03-02', 'MAWB');
INSERT INTO shipments VALUES ('MAWB003', NULL, 'Apple', 'Chengdu', 'SFO', 80, NULL, 'MAWB'); 
INSERT INTO shipments VALUES ('MAWB004', NULL, 'Nike', 'Guangzhou', 'AMS', 0, '2024-03-07', 'MAWB'); 
INSERT INTO shipments VALUES ('MAWB005', NULL, 'Apple', 'Zhengzhou', 'LAX', 600, '2024-03-15', 'MAWB'); 
INSERT INTO shipments VALUES ('MAWB006', NULL, 'Sony', 'Tokyo', 'SFO', 90, '2024-03-18', 'MAWB');
INSERT INTO shipments VALUES ('MAWB007', NULL, 'Amazon', 'Shanghai', 'LHR', 180, '2024-03-20', 'MAWB');
INSERT INTO shipments VALUES ('HAWB007-A', 'MAWB007', 'Amazon', 'Shanghai', 'LHR', 180, '2024-03-20', 'HAWB');
INSERT INTO shipments VALUES ('MAWB008', NULL, 'Amazon', 'Shanghai', 'SFO', 220, '2024-03-21', 'MAWB');
INSERT INTO shipments VALUES ('MAWB009', NULL, 'Apple', 'Chengdu', 'LAX', 1500, '2024-03-22', 'MAWB');
INSERT INTO shipments VALUES ('MAWB010', NULL, 'Apple', 'Chengdu', 'SFO', 300, '2024-03-23', 'MAWB');
INSERT INTO shipments VALUES ('MAWB011', NULL, 'H&M', 'Shanghai', 'AMS', 50, '2024-03-24', 'MAWB');
INSERT INTO shipments VALUES ('MAWB012', NULL, 'H&M', 'Shanghai', 'AMS', 40, '2024-03-25', 'MAWB');
INSERT INTO shipments VALUES ('MAWB013', NULL, 'TestCorp', 'Shanghai', 'SFXO', 100, '2024-03-26', 'MAWB');
INSERT INTO shipments VALUES ('MAWB014', NULL, 'NullCorp', 'Unknown', 'LAX', NULL, '2024-03-27', 'MAWB');
INSERT INTO shipments VALUES ('MAWB099', NULL, 'GhostCorp', 'Beijing', 'DXB', 99, '2024-04-01', 'MAWB');

-- 账单表
CREATE TABLE invoices (
  invoice_no TEXT PRIMARY KEY,
  shipment_id TEXT,
  amount_usd DECIMAL(10,2),
  status TEXT,
  due_date DATE
);

INSERT INTO invoices VALUES ('INV001', 'MAWB001', 12500.50, '已付', '2024-04-01');
INSERT INTO invoices VALUES ('INV002', 'HAWB001-A', 1250.00, '未付', '2024-04-01');
INSERT INTO invoices VALUES ('INV003', 'MAWB002', 4500.00, '未付', '2024-04-02');
INSERT INTO invoices VALUES ('INV004', 'MAWB004', 0.00, '未付', '2024-04-07');
INSERT INTO invoices VALUES ('INV005', 'MAWB006', 950.25, '未付', '2024-04-18');
INSERT INTO invoices VALUES ('INV006', 'MAWB003', 1800.00, '未付', '2024-04-10');
INSERT INTO invoices VALUES ('INV007', 'MAWB005', 6800.00, '已付', '2024-04-15');
INSERT INTO invoices VALUES ('INV008', 'MAWB007', 2200.00, '已付', '2024-04-20');
INSERT INTO invoices VALUES ('INV009', 'MAWB008', 3100.00, '未付', '2024-04-21');
INSERT INTO invoices VALUES ('INV010', 'MAWB009', 15000.00, '已付', '2024-04-22');
INSERT INTO invoices VALUES ('INV999', 'MISSING_S_1', 99.99, '纠纷', '2024-05-01');
`;
