-- =====================================================
-- PAYMENT TABLES - CREATE QUERIES
-- Adapted to match Appointza project conventions
-- =====================================================

-- 1. Payment Table
CREATE TABLE IF NOT EXISTS payment (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255),
    mode INTEGER,
    amount NUMERIC(10,2),
    status INTEGER,
    typecode INTEGER DEFAULT 1,
    groupid BIGINT,
    orderid BIGINT,
    appoinmentid BIGINT,
    paymentmodetype VARCHAR(50),
    paymentmodecode VARCHAR(100),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    parentid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- 2. PaymentGroup Table
CREATE TABLE IF NOT EXISTS paymentgroup (
    id BIGSERIAL PRIMARY KEY,
    status INTEGER,
    amount NUMERIC(10,2),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    parentid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- 3. PaymentGatewayLogs Table
CREATE TABLE IF NOT EXISTS paymentgatewaylogs (
    id BIGSERIAL PRIMARY KEY,
    vendor VARCHAR(100),
    paymentid BIGINT,
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    parentid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Payment table indexes
CREATE INDEX IF NOT EXISTS idx_payment_groupid ON payment(groupid);
CREATE INDEX IF NOT EXISTS idx_payment_orderid ON payment(orderid);
CREATE INDEX IF NOT EXISTS idx_payment_appoinmentid ON payment(appoinmentid);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_mode ON payment(mode);
CREATE INDEX IF NOT EXISTS idx_payment_key ON payment(key);
CREATE INDEX IF NOT EXISTS idx_payment_isactive ON payment(isactive);
CREATE INDEX IF NOT EXISTS idx_payment_createdon ON payment(createdon);

-- PaymentGroup table indexes
CREATE INDEX IF NOT EXISTS idx_paymentgroup_status ON paymentgroup(status);
CREATE INDEX IF NOT EXISTS idx_paymentgroup_isactive ON paymentgroup(isactive);
CREATE INDEX IF NOT EXISTS idx_paymentgroup_createdon ON paymentgroup(createdon);

-- PaymentGatewayLogs table indexes
CREATE INDEX IF NOT EXISTS idx_paymentgatewaylogs_paymentid ON paymentgatewaylogs(paymentid);
CREATE INDEX IF NOT EXISTS idx_paymentgatewaylogs_vendor ON paymentgatewaylogs(vendor);
CREATE INDEX IF NOT EXISTS idx_paymentgatewaylogs_createdon ON paymentgatewaylogs(createdon);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS (Optional - uncomment if needed)
-- =====================================================

-- ALTER TABLE payment ADD CONSTRAINT fk_payment_groupid 
--     FOREIGN KEY (groupid) REFERENCES paymentgroup(id) ON DELETE SET NULL;
-- 
-- ALTER TABLE paymentgatewaylogs ADD CONSTRAINT fk_paymentgatewaylogs_paymentid 
--     FOREIGN KEY (paymentid) REFERENCES payment(id) ON DELETE CASCADE;

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================

SELECT 'Payment tables created successfully!' as status;

