-- Providers table for entity configuration
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('Domain', 'Workspace', 'Formation', 'Bank', 'Cap Table', 'CRM', 'Legal', 'Tax', 'Accounting', 'DUNS', 'Lender')),
  company_name TEXT NOT NULL,
  company_logo TEXT, -- URL to logo image
  url TEXT NOT NULL, -- Company website URL
  pricing_page_url TEXT, -- Link to pricing page
  pricing TEXT, -- Pricing information
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);

-- Insert Domain providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Domain', 'Namecheap', NULL, 'https://www.namecheap.com', 'https://www.namecheap.com/domains/registration/pricing/', 'Starting at $8.88/year'),
('Domain', 'Ionos', NULL, 'https://www.ionos.com', 'https://www.ionos.com/domains/domain-prices', 'Starting at $1.00/year'),
('Domain', 'Godaddy', NULL, 'https://www.godaddy.com', 'https://www.godaddy.com/en/domains/pricing', 'Starting at $11.99/year');

-- Insert Workspace providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Workspace', 'Google Workspace', NULL, 'https://workspace.google.com', 'https://workspace.google.com/pricing.html', 'Starting at $6/user/month'),
('Workspace', 'Microsoft 365', NULL, 'https://www.microsoft.com/microsoft-365', 'https://www.microsoft.com/microsoft-365/buy/compare-all-microsoft-365-products', 'Starting at $6/user/month'),
('Workspace', 'Zoho', NULL, 'https://www.zoho.com', 'https://www.zoho.com/workplace/pricing.html', 'Starting at $1/user/month');

-- Insert Formation providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Formation', 'Legalzoom', NULL, 'https://www.legalzoom.com', 'https://www.legalzoom.com/business/business-formation/pricing', 'Starting at $79 + state fees'),
('Formation', 'Every.io', NULL, 'https://every.io', 'https://every.io/pricing', 'Starting at $99/month'),
('Formation', 'Doola', NULL, 'https://www.doola.com', 'https://www.doola.com/pricing', 'Starting at $197 + state fees'),
('Formation', 'Bizee', NULL, 'https://www.bizee.com', 'https://www.bizee.com/pricing', 'Starting at $0 + state fees'),
('Formation', 'WyomingLLCAttorney.com', NULL, 'https://www.wyomingllcattorney.com', 'https://www.wyomingllcattorney.com/pricing', 'Contact for pricing'),
('Formation', 'CompanySage.com', NULL, 'https://www.companysage.com', 'https://www.companysage.com/pricing', 'Starting at $99 + state fees');

-- Insert Bank providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Bank', 'Mercury', NULL, 'https://mercury.com', 'https://mercury.com/pricing', 'Free'),
('Bank', 'Brex', NULL, 'https://www.brex.com', 'https://www.brex.com/pricing', 'Free'),
('Bank', 'Novo', NULL, 'https://www.novo.co', 'https://www.novo.co/pricing', 'Free'),
('Bank', 'Relay', NULL, 'https://relay.com', 'https://relay.com/pricing', 'Starting at $30/month');

-- Insert Cap Table providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Cap Table', 'Carta', NULL, 'https://carta.com', 'https://carta.com/pricing', 'Contact for pricing'),
('Cap Table', 'Mantle', NULL, 'https://www.withmantle.com', 'https://www.withmantle.com/pricing', 'Starting at $99/month'),
('Cap Table', 'Cake Equity', NULL, 'https://www.cakeequity.com', 'https://www.cakeequity.com/pricing', 'Contact for pricing'),
('Cap Table', 'Pulley', NULL, 'https://pulley.com', 'https://pulley.com/pricing', 'Starting at $99/month');

-- Insert CRM providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('CRM', 'Hubspot', NULL, 'https://www.hubspot.com', 'https://www.hubspot.com/pricing', 'Free plan available, paid plans starting at $20/month'),
('CRM', 'Zoho', NULL, 'https://www.zoho.com/crm', 'https://www.zoho.com/crm/pricing.html', 'Starting at $14/user/month'),
('CRM', 'Pipedrive', NULL, 'https://www.pipedrive.com', 'https://www.pipedrive.com/en/pricing', 'Starting at $14.90/user/month'),
('CRM', 'Airtable', NULL, 'https://www.airtable.com', 'https://www.airtable.com/pricing', 'Free plan available, paid plans starting at $10/user/month');

-- Insert Legal providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Legal', 'Clerky', NULL, 'https://www.clerky.com', 'https://www.clerky.com/pricing', 'Starting at $99/month'),
('Legal', 'Termly', NULL, 'https://termly.io', 'https://termly.io/pricing', 'Starting at $10/month');

-- Insert Tax providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Tax', 'TurboTax', NULL, 'https://turbotax.intuit.com', 'https://turbotax.intuit.com/personal-taxes/online/', 'Starting at $0 for simple returns'),
('Tax', 'FreeTaxUSA', NULL, 'https://www.freetaxusa.com', 'https://www.freetaxusa.com/pricing', 'Free federal filing, $14.99 state filing');

-- Insert Accounting providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Accounting', 'QuickBooks', NULL, 'https://quickbooks.intuit.com', 'https://quickbooks.intuit.com/pricing', 'Starting at $15/month'),
('Accounting', 'Xero', NULL, 'https://www.xero.com', 'https://www.xero.com/us/pricing/', 'Starting at $13/month'),
('Accounting', 'FreshBooks', NULL, 'https://www.freshbooks.com', 'https://www.freshbooks.com/pricing', 'Starting at $15/month'),
('Accounting', 'Wave', NULL, 'https://www.waveapps.com', 'https://www.waveapps.com/pricing', 'Free');

-- Insert DUNS providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('DUNS', 'Dun & Bradstreet', NULL, 'https://www.dnb.com', 'https://www.dnb.com/duns-number/get-a-duns-number.html', 'Free for basic DUNS number');

-- Insert Lender providers
INSERT INTO providers (category, company_name, company_logo, url, pricing_page_url, pricing) VALUES
('Lender', 'Nav', NULL, 'https://www.nav.com', 'https://www.nav.com/pricing', 'Free basic plan, paid plans available'),
('Lender', 'Stripe Capital', NULL, 'https://stripe.com/capital', 'https://stripe.com/capital', 'Revenue-based financing');
