-- SAMPLE DATA ONLY. Do not commit production names, phone numbers, email
-- addresses, card numbers, LINE IDs, or physical addresses to this repository.

TRUNCATE TABLE "GroupLeaders";

INSERT INTO "GroupLeaders" (
  "卡號",
  "Username",
  "團主名稱",
  "暱稱",
  "電話",
  "電子信箱",
  "指定地址",
  "加油站",
  "站代號",
  "緯度",
  "經度",
  "IsGroupLeader"
)
VALUES
(
  'CARD-DEMO-001',
  'D0001-000001',
  '測試團主一',
  '測試一',
  '0000000000',
  'leader1@example.invalid',
  '測試地址一號',
  '測試一站',
  'D0001',
  25.0000,
  121.0000,
  'Yes'
),
(
  'CARD-DEMO-002',
  'D0002-000002',
  '測試團主二',
  '測試二',
  '0000000000',
  'leader2@example.invalid',
  '測試地址二號',
  '測試二站',
  'D0002',
  24.0000,
  120.0000,
  'Yes'
);
