import { exec } from 'child_process';
import { db } from '../db';
import { log } from '../vite';

/**
 * Add missing columns to the websites table
 */
async function addScrapedContentColumns() {
  try {
    log('Starting migration to add scraped_content column to websites table', 'migration');
    
    // SQL to add the new columns if they don't exist
    const alterTableSQL = `
      ALTER TABLE websites 
      ADD COLUMN IF NOT EXISTS scraped_content TEXT,
      ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMP,
      ADD COLUMN IF NOT EXISTS scraping_status TEXT DEFAULT 'pending';
    `;
    
    // Execute the SQL directly using the db pool
    await db.execute(alterTableSQL);
    
    log('Successfully added scraped_content columns to websites table', 'migration');
    return true;
  } catch (error) {
    log(`Migration error: ${error}`, 'error');
    return false;
  }
}

// Run the migration
addScrapedContentColumns()
  .then((success) => {
    if (success) {
      log('Migration completed successfully', 'migration');
      process.exit(0);
    } else {
      log('Migration failed', 'error');
      process.exit(1);
    }
  })
  .catch((error) => {
    log(`Unexpected migration error: ${error}`, 'error');
    process.exit(1);
  });