import axios from 'axios';
import { load } from 'cheerio';
import { log } from '../vite';
import { db, pool } from '../db';
import { websites, companyProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ScrapedContent {
  title: string;
  description: string;
  mainContent: string;
  aboutContent: string;
  productContent: string;
  contactInfo: string;
  pricingContent: string;
  faqContent: string;
}

interface WebsiteProfile {
  companyName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  services: string;
  valueProposition: string;
  pricingInfo: string;
  contactInfo: string;
  faqContent: string;
}

/**
 * Scrape website content to build AI chatbot profile
 */
export async function scrapeWebsite(url: string, websiteId: number): Promise<boolean> {
  try {
    log(`Starting website scrape for ${url}`, 'scraper');
    
    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Get website content
    const content = await scrapeContent(normalizedUrl);
    
    // Save raw content to website record - use direct SQL query to avoid ORM issues
    try {
      await pool.query(`
        UPDATE websites 
        SET scraped_content = $1, 
            last_scraped = $2, 
            scraping_status = $3,
            status = $4
        WHERE id = $5
      `, [
        JSON.stringify(content), 
        new Date(), 
        'completed',
        'active',
        websiteId
      ]);
      
      log(`Updated website ${websiteId} with scraped content (${Object.keys(content).length} fields)`, 'scraper');
    } catch (updateError) {
      log(`Error updating website with scraped content: ${updateError}`, 'error');
      return false;
    }
    
    // Generate website profile from content
    const profile = generateProfileFromContent(content);
    
    // Find website and associated user with direct SQL
    let websiteUserId: number | null = null;
    try {
      const websiteResult = await pool.query(`
        SELECT user_id FROM websites WHERE id = $1
      `, [websiteId]);
      
      if (!websiteResult || !websiteResult.rows || websiteResult.rows.length === 0) {
        log(`Website with ID ${websiteId} not found`, 'error');
        return false;
      }
      
      websiteUserId = parseInt(websiteResult.rows[0].user_id);
      
      if (!websiteUserId) {
        log(`No user associated with website ID ${websiteId}`, 'error');
        return false;
      }
      
      log(`Found user ID ${websiteUserId} for website ${websiteId}`, 'scraper');
    } catch (websiteError) {
      log(`Error finding website or user: ${websiteError}`, 'error');
      return false;
    }
    
    // Check if company profile already exists
    let existingProfile = null;
    let websiteName = 'Website';
    let websiteDomain = 'website.com';
    
    try {
      // Get website name and domain for fallbacks
      const domainResult = await pool.query(`
        SELECT name, domain FROM websites WHERE id = $1
      `, [websiteId]);
      
      websiteName = domainResult.rows[0]?.name || 'Website';
      websiteDomain = domainResult.rows[0]?.domain || 'website.com';
      
      // Check for existing profile
      const profileResult = await pool.query(`
        SELECT * FROM company_profiles WHERE user_id = $1
      `, [websiteUserId]);
      
      if (profileResult && profileResult.rows && profileResult.rows.length > 0) {
        existingProfile = profileResult.rows[0];
        log(`Found existing company profile for user ${websiteUserId}`, 'scraper');
      }
    } catch (profileError) {
      log(`Error checking for existing profile: ${profileError}`, 'error');
      // Continue anyway - we'll create a new profile if needed
    }
    
    // Update or create company profile
    try {
      if (existingProfile) {
        // Update existing profile using direct SQL
        await pool.query(`
          UPDATE company_profiles 
          SET 
            company_name = $1, 
            industry = $2, 
            target_audience = $3, 
            brand_voice = $4, 
            services = $5, 
            value_proposition = $6, 
            updated_at = $7
          WHERE user_id = $8
        `, [
          profile.companyName || existingProfile.company_name,
          profile.industry || existingProfile.industry,
          profile.targetAudience || existingProfile.target_audience,
          profile.brandVoice || existingProfile.brand_voice,
          profile.services || existingProfile.services,
          profile.valueProposition || existingProfile.value_proposition,
          new Date(),
          websiteUserId
        ]);
        
        log(`Updated company profile for user ${websiteUserId}`, 'scraper');
      } else {
        // Create new profile with direct SQL
        await pool.query(`
          INSERT INTO company_profiles (
            user_id, company_name, industry, target_audience, brand_voice, 
            services, value_proposition, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          websiteUserId,
          profile.companyName || websiteName,
          profile.industry || 'Not specified',
          profile.targetAudience || 'General audience',
          profile.brandVoice || 'Professional',
          profile.services || 'Services not specified',
          profile.valueProposition || `Information for ${websiteDomain}`,
          new Date(),
          new Date()
        ]);
        
        log(`Created new company profile for user ${websiteUserId}`, 'scraper');
      }
    } catch (profileError) {
      log(`Error updating company profile: ${profileError}`, 'error');
      // Continue anyway - website data was already saved
    }
    
    log(`Successfully scraped and processed website ${url}`, 'scraper');
    return true;
  } catch (error) {
    log(`Error scraping website ${url}: ${error}`, 'error');
    return false;
  }
}

/**
 * Scrape content from website
 */
async function scrapeContent(url: string): Promise<ScrapedContent> {
  try {
    // Initialize empty content structure
    const content: ScrapedContent = {
      title: '',
      description: '',
      mainContent: '',
      aboutContent: '',
      productContent: '',
      contactInfo: '',
      pricingContent: '',
      faqContent: ''
    };
    
    // Fetch main page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Accept': 'text/html'
      },
      timeout: 10000
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch website, status code: ${response.status}`);
    }
    
    const html = response.data;
    const $ = load(html);
    
    // Extract title and meta description
    content.title = $('title').text().trim();
    content.description = $('meta[name="description"]').attr('content') || '';
    
    // Extract main content
    content.mainContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
    
    // Attempt to find about page
    const aboutLinks = $('a').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      return text.includes('about') || href.includes('about');
    });
    
    if (aboutLinks.length > 0) {
      try {
        const aboutUrl = new URL($(aboutLinks[0]).attr('href') || '', url).toString();
        const aboutResponse = await axios.get(aboutUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000
        });
        
        if (aboutResponse.status === 200) {
          const aboutHtml = aboutResponse.data;
          const about$ = load(aboutHtml);
          content.aboutContent = about$('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
        }
      } catch (err) {
        log(`Error fetching about page: ${err}`, 'scraper');
      }
    }
    
    // Extract contact information
    const contactLinks = $('a').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      return text.includes('contact') || href.includes('contact');
    });
    
    if (contactLinks.length > 0) {
      try {
        const contactUrl = new URL($(contactLinks[0]).attr('href') || '', url).toString();
        const contactResponse = await axios.get(contactUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000
        });
        
        if (contactResponse.status === 200) {
          const contactHtml = contactResponse.data;
          const contact$ = load(contactHtml);
          content.contactInfo = contact$('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
        }
      } catch (err) {
        log(`Error fetching contact page: ${err}`, 'scraper');
      }
    }
    
    // Extract pricing information if available
    const pricingLinks = $('a').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      return text.includes('pricing') || text.includes('price') || 
             href.includes('pricing') || href.includes('price');
    });
    
    if (pricingLinks.length > 0) {
      try {
        const pricingUrl = new URL($(pricingLinks[0]).attr('href') || '', url).toString();
        const pricingResponse = await axios.get(pricingUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000
        });
        
        if (pricingResponse.status === 200) {
          const pricingHtml = pricingResponse.data;
          const pricing$ = load(pricingHtml);
          content.pricingContent = pricing$('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
        }
      } catch (err) {
        log(`Error fetching pricing page: ${err}`, 'scraper');
      }
    }
    
    // Extract FAQ information if available
    const faqLinks = $('a').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      return text.includes('faq') || text.includes('frequently asked') || 
             href.includes('faq') || href.includes('frequently-asked');
    });
    
    if (faqLinks.length > 0) {
      try {
        const faqUrl = new URL($(faqLinks[0]).attr('href') || '', url).toString();
        const faqResponse = await axios.get(faqUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'text/html'
          },
          timeout: 5000
        });
        
        if (faqResponse.status === 200) {
          const faqHtml = faqResponse.data;
          const faq$ = load(faqHtml);
          content.faqContent = faq$('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
        }
      } catch (err) {
        log(`Error fetching FAQ page: ${err}`, 'scraper');
      }
    }
    
    return content;
  } catch (error) {
    log(`Error during content scraping: ${error}`, 'error');
    // Return a basic structure even on error
    return {
      title: '',
      description: '',
      mainContent: '',
      aboutContent: '',
      productContent: '',
      contactInfo: '',
      pricingContent: '',
      faqContent: ''
    };
  }
}

/**
 * Generate website profile from scraped content using basic rules-based extraction
 */
function generateProfileFromContent(content: ScrapedContent): WebsiteProfile {
  try {
    // Start with basic information
    const profile: WebsiteProfile = {
      companyName: extractCompanyName(content),
      industry: extractIndustry(content),
      targetAudience: extractTargetAudience(content),
      brandVoice: extractBrandVoice(content),
      services: extractServices(content),
      valueProposition: extractValueProposition(content),
      pricingInfo: content.pricingContent,
      contactInfo: content.contactInfo,
      faqContent: content.faqContent
    };
    
    return profile;
  } catch (error) {
    log(`Error generating profile from content: ${error}`, 'error');
    // Return a basic profile on error
    return {
      companyName: content.title || 'Unknown Company',
      industry: 'Not determined',
      targetAudience: 'General audience',
      brandVoice: 'Professional',
      services: 'Services not specified',
      valueProposition: 'Not determined',
      pricingInfo: '',
      contactInfo: '',
      faqContent: ''
    };
  }
}

// Helper functions for extracting specific information
function extractCompanyName(content: ScrapedContent): string {
  // First try the title
  const titleParts = content.title.split('|');
  if (titleParts.length > 1) {
    return titleParts[0].trim();
  }
  
  const titleParts2 = content.title.split('-');
  if (titleParts2.length > 1) {
    return titleParts2[0].trim();
  }
  
  // If no divider, just return the whole title
  return content.title;
}

function extractIndustry(content: ScrapedContent): string {
  const combinedText = content.aboutContent + ' ' + content.mainContent;
  const lowercasedText = combinedText.toLowerCase();
  
  // Map to match form dropdown values in CompanySetup.tsx
  const industryMapping = [
    { keywords: ['ecommerce', 'e-commerce', 'online store', 'shop', 'shopping', 'webshop'], value: 'ecommerce' },
    { keywords: ['software', 'saas', 'cloud', 'subscription', 'platform', 'application'], value: 'saas' },
    { keywords: ['healthcare', 'medical', 'hospital', 'doctor', 'clinic', 'patient', 'health'], value: 'healthcare' },
    { keywords: ['finance', 'banking', 'loan', 'credit', 'investment', 'financial'], value: 'finance' },
    { keywords: ['education', 'school', 'university', 'college', 'course', 'teaching', 'learning'], value: 'education' },
    { keywords: ['retail', 'store', 'shop', 'mall', 'outlet'], value: 'retail' },
    { keywords: ['manufacturing', 'factory', 'production', 'industry'], value: 'manufacturing' },
    { keywords: ['real estate', 'property', 'house', 'apartment', 'building', 'construction'], value: 'real_estate' },
    { keywords: ['travel', 'tourism', 'hotel', 'vacation', 'booking'], value: 'travel' },
    { keywords: ['food', 'restaurant', 'catering', 'meal', 'dine'], value: 'food' },
    { keywords: ['technology', 'tech', 'IT', 'computer', 'digital'], value: 'technology' },
    { keywords: ['media', 'news', 'entertainment', 'publishing'], value: 'media' },
    { keywords: ['professional', 'services', 'consulting', 'agency', 'consultant'], value: 'professional_services' }
  ];
  
  for (const industry of industryMapping) {
    for (const keyword of industry.keywords) {
      if (lowercasedText.includes(keyword)) {
        return industry.value;
      }
    }
  }
  
  return 'other';
}

function extractTargetAudience(content: ScrapedContent): string {
  const combinedText = content.aboutContent + ' ' + content.mainContent;
  
  // Look for audience-related keywords
  const audienceKeywords = [
    { term: 'small business', audience: 'Small businesses' },
    { term: 'enterprise', audience: 'Enterprise companies' },
    { term: 'startup', audience: 'Startups' },
    { term: 'consumer', audience: 'Consumers' },
    { term: 'b2b', audience: 'B2B companies' },
    { term: 'b2c', audience: 'B2C companies' },
    { term: 'professional', audience: 'Professionals' },
    { term: 'student', audience: 'Students' },
    { term: 'parent', audience: 'Parents' },
    { term: 'senior', audience: 'Seniors' },
    { term: 'millennials', audience: 'Millennials' },
    { term: 'gen z', audience: 'Gen Z' }
  ];
  
  for (const { term, audience } of audienceKeywords) {
    if (combinedText.toLowerCase().includes(term)) {
      return audience;
    }
  }
  
  return 'General audience';
}

function extractBrandVoice(content: ScrapedContent): string {
  const combinedText = content.mainContent.toLowerCase();
  
  // Determine tone based on content
  if (combinedText.includes('innovative') || combinedText.includes('cutting-edge') || 
      combinedText.includes('breakthrough') || combinedText.includes('revolutionary')) {
    return 'Innovative and Forward-thinking';
  }
  
  if (combinedText.includes('friendly') || combinedText.includes('welcoming') || 
      combinedText.includes('warm') || combinedText.includes('supportive')) {
    return 'Friendly and Supportive';
  }
  
  if (combinedText.includes('luxury') || combinedText.includes('premium') || 
      combinedText.includes('exclusive') || combinedText.includes('sophisticated')) {
    return 'Premium and Sophisticated';
  }
  
  if (combinedText.includes('expert') || combinedText.includes('authority') || 
      combinedText.includes('trusted') || combinedText.includes('leading')) {
    return 'Authoritative and Expert';
  }
  
  return 'Professional';
}

function extractServices(content: ScrapedContent): string {
  // Look for services in the content
  const servicePatterns = [
    /our (services|products) include/i,
    /we (offer|provide|specialize in)/i,
    /our (core|main|primary) (services|products|offerings)/i
  ];
  
  const combinedText = content.mainContent + ' ' + content.aboutContent;
  
  for (const pattern of servicePatterns) {
    const match = combinedText.match(pattern);
    if (match && match.index !== undefined) {
      // Extract the text after the match, up to the next period or 150 characters
      const startIndex = match.index + match[0].length;
      const endIndex = combinedText.indexOf('.', startIndex);
      if (endIndex !== -1 && endIndex - startIndex < 150) {
        return combinedText.substring(startIndex, endIndex).trim();
      } else {
        return combinedText.substring(startIndex, startIndex + 150).trim();
      }
    }
  }
  
  return 'Services not clearly specified';
}

function extractValueProposition(content: ScrapedContent): string {
  // Look for value proposition statements
  const vpPatterns = [
    /we help/i,
    /our mission is/i,
    /dedicated to/i,
    /committed to/i,
    /our goal is/i
  ];
  
  const combinedText = content.mainContent + ' ' + content.aboutContent;
  
  for (const pattern of vpPatterns) {
    const match = combinedText.match(pattern);
    if (match && match.index !== undefined) {
      // Extract the text after the match, up to the next period or 150 characters
      const startIndex = match.index;
      const endIndex = combinedText.indexOf('.', startIndex);
      if (endIndex !== -1 && endIndex - startIndex < 200) {
        return combinedText.substring(startIndex, endIndex).trim();
      } else {
        return combinedText.substring(startIndex, startIndex + 150).trim();
      }
    }
  }
  
  return 'Value proposition not clearly specified';
}