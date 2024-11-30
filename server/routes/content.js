import express from 'express';
import { getDatabase } from '../database/init.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all content blocks
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const contentBlocks = db.prepare('SELECT * FROM content_blocks WHERE is_active = true ORDER BY section, order_index').all();
    res.json(contentBlocks);
  } catch (error) {
    console.error('Error fetching content blocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content blocks by section
router.get('/section/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const db = getDatabase();
    const contentBlocks = db.prepare(
      'SELECT * FROM content_blocks WHERE section = ? AND is_active = true ORDER BY order_index'
    ).all(section);
    res.json(contentBlocks);
  } catch (error) {
    console.error('Error fetching content blocks by section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single content block by identifier
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const db = getDatabase();
    const contentBlock = db.prepare('SELECT * FROM content_blocks WHERE identifier = ?').get(identifier);
    
    if (!contentBlock) {
      return res.status(404).json({ error: 'Content block not found' });
    }
    
    res.json(contentBlock);
  } catch (error) {
    console.error('Error fetching content block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update content block (admin only)
router.put('/:identifier', requireAdmin, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { title, content, image_url, is_active } = req.body;
    
    const db = getDatabase();
    const existingBlock = db.prepare('SELECT id FROM content_blocks WHERE identifier = ?').get(identifier);
    
    if (!existingBlock) {
      return res.status(404).json({ error: 'Content block not found' });
    }
    
    db.prepare(`
      UPDATE content_blocks 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          image_url = COALESCE(?, image_url),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP 
      WHERE identifier = ?
    `).run(title, content, image_url, is_active, identifier);
    
    const updatedBlock = db.prepare('SELECT * FROM content_blocks WHERE identifier = ?').get(identifier);
    res.json(updatedBlock);
  } catch (error) {
    console.error('Error updating content block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new content block (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { identifier, title, content, image_url, section, order_index } = req.body;
    
    if (!identifier || !section) {
      return res.status(400).json({ error: 'Identifier and section are required' });
    }
    
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM content_blocks WHERE identifier = ?').get(identifier);
    
    if (existing) {
      return res.status(409).json({ error: 'Content block with this identifier already exists' });
    }
    
    const result = db.prepare(`
      INSERT INTO content_blocks (identifier, title, content, image_url, section, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(identifier, title, content, image_url, section, order_index || 0);
    
    const newBlock = db.prepare('SELECT * FROM content_blocks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Error creating content block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete content block (admin only)
router.delete('/:identifier', requireAdmin, async (req, res) => {
  try {
    const { identifier } = req.params;
    const db = getDatabase();
    
    const existing = db.prepare('SELECT id FROM content_blocks WHERE identifier = ?').get(identifier);
    if (!existing) {
      return res.status(404).json({ error: 'Content block not found' });
    }
    
    db.prepare('DELETE FROM content_blocks WHERE identifier = ?').run(identifier);
    res.json({ success: true, message: 'Content block deleted successfully' });
  } catch (error) {
    console.error('Error deleting content block:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
