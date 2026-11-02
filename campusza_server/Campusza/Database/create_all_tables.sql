-- =====================================================
-- APPOINTZA DATABASE - FULL TABLE CREATION SCRIPT
-- PostgreSQL Database Schema
-- =====================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(20),
    mobilecountrycode VARCHAR(10),
    designation VARCHAR(100),
    otp VARCHAR(10),
    otpexpirationtime TIMESTAMP,
    organisationid BIGINT,
    locationid BIGINT,
    profileimage BIGINT,
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
    notes TEXT,
    push_token TEXT
);

-- 2. Organisation Table
CREATE TABLE IF NOT EXISTS organisation (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    gstnumber VARCHAR(50),
    secondarytypecode VARCHAR(50),
    secondarytype BIGINT,
    primarytype BIGINT,
    imageid BIGINT,
    organisationlogo BIGINT,
    tagline VARCHAR(255),
    primarytypecode VARCHAR(50),
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
    notes TEXT,
    booking_amount DECIMAL(10,2) DEFAULT 5.10,
    isserviceamount BOOLEAN DEFAULT false
);

-- 3. OrganisationLocation Table
CREATE TABLE IF NOT EXISTS organisationlocation (
    id BIGSERIAL PRIMARY KEY,
    organisationid BIGINT,
    name VARCHAR(255),
    addressline1 VARCHAR(255),
    addressline2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    googlelocation TEXT,
    pincode VARCHAR(20),
    customurl VARCHAR(255),
    templateid VARCHAR(100),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    images_json JSONB DEFAULT '[]'::jsonb,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    parentid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- 4. OrganisationServices Table
CREATE TABLE IF NOT EXISTS organisationservices (
    id BIGSERIAL PRIMARY KEY,
    prize BIGINT,
    timetaken BIGINT,
    servicesids_json JSONB DEFAULT '{}'::jsonb,
    iscombo BOOLEAN DEFAULT false,
    offerprize BIGINT,
    servicename VARCHAR(255),
    code VARCHAR(50),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    organisationid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- 5. Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT,
    organisationid BIGINT,
    roles_json JSONB DEFAULT '{}'::jsonb,
    image BIGINT,
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    organisationlocationid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    notes TEXT
);

-- 6. Appoinment Table
CREATE TABLE IF NOT EXISTS appoinment (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT,
    organizationid BIGINT,
    fromtime TIME,
    totime TIME,
    appoinmentdate DATE,
    status INTEGER,
    statuscode VARCHAR(50),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    organisationlocationid BIGINT,
    isfactory BOOLEAN DEFAULT false,
    isusercancel BOOLEAN DEFAULT false,
    notes TEXT,
    staffid BIGINT,
    staffname VARCHAR(255),
    ispaid BOOLEAN DEFAULT false
);

-- 7. Timeline Table
CREATE TABLE IF NOT EXISTS timeline (
    id BIGSERIAL PRIMARY KEY,
    organisationlocationid BIGINT,
    organisationid BIGINT,
    appoinmentid BIGINT,
    tasktypeid BIGINT,
    taskcode VARCHAR(50),
    tasktype VARCHAR(100),
    description TEXT,
    customerid BIGINT,
    staffid BIGINT,
    staffname VARCHAR(255),
    appoinmenstatustype VARCHAR(50),
    appoinmentstatusid BIGINT,
    apoinmentstatuscode VARCHAR(50),
    descriptionimageid BIGINT,
    paymentid BIGINT,
    paymentmodetypeid BIGINT,
    paymentmodetype VARCHAR(50),
    version INTEGER DEFAULT 1,
    createdby BIGINT,
    createdon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifiedby BIGINT,
    modifiedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    isactive BOOLEAN DEFAULT true,
    issuspended BOOLEAN DEFAULT false,
    notes TEXT
);

-- 8. Files Table
CREATE TABLE IF NOT EXISTS files (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100),
    content BYTEA,
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

-- 9. ReferenceType Table
CREATE TABLE IF NOT EXISTS referencetype (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(100),
    displaytext VARCHAR(255),
    langcode VARCHAR(10),
    organizationid INTEGER,
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

-- 10. ReferenceValue Table
CREATE TABLE IF NOT EXISTS referencevalue (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(100),
    displaytext VARCHAR(255),
    description TEXT,
    langcode VARCHAR(10),
    organizationid INTEGER,
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

-- 11. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    payment_id VARCHAR(100) DEFAULT '',
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'CREATED',
    method VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    organisation_id BIGINT NOT NULL,
    organisation_location_id BIGINT NOT NULL,
    appointment_id BIGINT NOT NULL,
    customer_name VARCHAR(255) DEFAULT '',
    customer_email VARCHAR(255) DEFAULT '',
    customer_contact VARCHAR(20) DEFAULT '',
    notes VARCHAR(1000) DEFAULT '',
    razorpay_response JSONB DEFAULT '{}'::jsonb
);

-- 12. Payment Logs Table
CREATE TABLE IF NOT EXISTS payment_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    event VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    error_message VARCHAR(1000) DEFAULT '',
    webhook_source VARCHAR(50) DEFAULT '',
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. UserSession Table (if exists)
CREATE TABLE IF NOT EXISTS usersession (
    id BIGSERIAL PRIMARY KEY,
    userid BIGINT,
    sessiontoken VARCHAR(500),
    expiresat TIMESTAMP,
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

-- 14. OrganisationServiceTiming Table (if exists)
CREATE TABLE IF NOT EXISTS organisationservicetiming (
    id BIGSERIAL PRIMARY KEY,
    organisationid BIGINT,
    organisationlocationid BIGINT,
    dayofweek INTEGER,
    starttime TIME,
    endtime TIME,
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

-- 15. LeaveDates Table (if exists)
CREATE TABLE IF NOT EXISTS leavedates (
    id BIGSERIAL PRIMARY KEY,
    organisationid BIGINT,
    organisationlocationid BIGINT,
    staffid BIGINT,
    leavedate DATE,
    reason VARCHAR(255),
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

-- 16. Template Table (if exists)
CREATE TABLE IF NOT EXISTS template (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(100),
    content TEXT,
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
-- BASIC INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_organisationid ON users(organisationid);

-- Organisation indexes
CREATE INDEX IF NOT EXISTS idx_organisation_name ON organisation(name);
CREATE INDEX IF NOT EXISTS idx_organisation_gstnumber ON organisation(gstnumber);

-- OrganisationLocation indexes
CREATE INDEX IF NOT EXISTS idx_organisationlocation_organisationid ON organisationlocation(organisationid);
CREATE INDEX IF NOT EXISTS idx_organisationlocation_city ON organisationlocation(city);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_userid ON staff(userid);
CREATE INDEX IF NOT EXISTS idx_staff_organisationid ON staff(organisationid);

-- Appoinment indexes
CREATE INDEX IF NOT EXISTS idx_appoinment_userid ON appoinment(userid);
CREATE INDEX IF NOT EXISTS idx_appoinment_organizationid ON appoinment(organizationid);
CREATE INDEX IF NOT EXISTS idx_appoinment_appoinmentdate ON appoinment(appoinmentdate);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample organisation
INSERT INTO organisation (name, gstnumber, primarytype, secondarytype, primarytypecode, secondarytypecode, createdby, modifiedby) 
VALUES ('Appointza Technology', 'GST123456789', 1, 1, 'TECH', 'SOFTWARE', 1, 1);

-- Insert sample user
INSERT INTO users (name, email, mobile, mobilecountrycode, designation, organisationid, createdby, modifiedby) 
VALUES ('Admin User', 'admin@appointza.com', '9876543210', '+91', 'Administrator', 1, 1, 1);

-- Insert sample organisation location
INSERT INTO organisationlocation (organisationid, name, addressline1, city, state, country, pincode, createdby, modifiedby) 
VALUES (1, 'Main Office', '123 Business Street', 'Chennai', 'Tamil Nadu', 'India', '600001', 1, 1);

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================

SELECT 'Database tables created successfully!' as status;
