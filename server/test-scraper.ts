import { scrapeWebsite } from './services/websiteScraperService';
import { pool } from './db';
import { log } from './vite';

async function main() {
  try {
    // Get all websites from the database
    const result = await pool.query(`SELECT id, domain, name FROM websites`);
    const websites = result.rows;
    
    if (websites.length === 0) {
      console.log('No websites found in database');
      process.exit(0);
    }
    
    console.log(`Found ${websites.length} websites. Starting scraper...`);
    
    for (const website of websites) {
      console.log(`Scraping website ${website.name} (${website.domain})...`);
      const success = await scrapeWebsite(website.domain, website.id);
      
      if (success) {
        console.log(`Successfully scraped website ${website.name}`);
      } else {
        console.log(`Failed to scrape website ${website.name}`);
      }
    }
    
    console.log('Done scraping all websites');
    process.exit(0);
  } catch (error) {
    console.error('Error in scraper test:', error);
    process.exit(1);
  }
}

main();