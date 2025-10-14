-- Seed test price history for ETH (asset_id = 2)
-- This creates 30 days of mock price data

INSERT INTO price_ticks (asset_id, source, ts, price) VALUES
(2, 'test', NOW() - INTERVAL '30 days', 3800.50),
(2, 'test', NOW() - INTERVAL '29 days', 3850.25),
(2, 'test', NOW() - INTERVAL '28 days', 3820.75),
(2, 'test', NOW() - INTERVAL '27 days', 3900.00),
(2, 'test', NOW() - INTERVAL '26 days', 3950.50),
(2, 'test', NOW() - INTERVAL '25 days', 3920.25),
(2, 'test', NOW() - INTERVAL '24 days', 3980.75),
(2, 'test', NOW() - INTERVAL '23 days', 4020.00),
(2, 'test', NOW() - INTERVAL '22 days', 4050.50),
(2, 'test', NOW() - INTERVAL '21 days', 4010.25),
(2, 'test', NOW() - INTERVAL '20 days', 4080.75),
(2, 'test', NOW() - INTERVAL '19 days', 4120.00),
(2, 'test', NOW() - INTERVAL '18 days', 4090.50),
(2, 'test', NOW() - INTERVAL '17 days', 4150.25),
(2, 'test', NOW() - INTERVAL '16 days', 4180.75),
(2, 'test', NOW() - INTERVAL '15 days', 4200.00),
(2, 'test', NOW() - INTERVAL '14 days', 4170.50),
(2, 'test', NOW() - INTERVAL '13 days', 4220.25),
(2, 'test', NOW() - INTERVAL '12 days', 4250.75),
(2, 'test', NOW() - INTERVAL '11 days', 4230.00),
(2, 'test', NOW() - INTERVAL '10 days', 4280.50),
(2, 'test', NOW() - INTERVAL '9 days', 4300.25),
(2, 'test', NOW() - INTERVAL '8 days', 4270.75),
(2, 'test', NOW() - INTERVAL '7 days', 4320.00),
(2, 'test', NOW() - INTERVAL '6 days', 4350.50),
(2, 'test', NOW() - INTERVAL '5 days', 4320.25),
(2, 'test', NOW() - INTERVAL '4 days', 4380.75),
(2, 'test', NOW() - INTERVAL '3 days', 4400.00),
(2, 'test', NOW() - INTERVAL '2 days', 4370.50),
(2, 'test', NOW() - INTERVAL '1 day', 4420.25),
(2, 'test', NOW(), 4102.89);

-- Update current price for ETH
UPDATE assets SET current_price = 4102.89, price_change_24h = -4.18, last_updated = NOW() WHERE id = 2;
