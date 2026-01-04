const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();

// --- CONFIGURATION ---
// If 'blender' command fails, paste your full path here (use double backslashes \\)
// Example: const BLENDER_PATH = "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe";
const BLENDER_PATH = "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe";

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'input-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const parseTemplateRow = (row) => {
    if (!row) return null;
    const scene = JSON.parse(row.scene_json);
    return {
        id: row.id,
        name: row.name,
        modelUrl: row.model_url,
        previewUrl: row.preview_url,
        backgroundColor: row.background_color,
        images: scene.images || [],
        texts: scene.texts || [],
        materialOverrides: scene.materialOverrides || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

app.get('/templates', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM templates ORDER BY updated_at DESC').all();
        const templates = rows.map(parseTemplateRow);
        res.json(templates);
    } catch (error) {
        console.error('Failed to load templates', error);
        res.status(500).json({ error: 'Failed to load templates' });
    }
});

app.get('/templates/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Template not found' });
        res.json(parseTemplateRow(row));
    } catch (error) {
        console.error('Failed to load template', error);
        res.status(500).json({ error: 'Failed to load template' });
    }
});

app.post('/templates', (req, res) => {
    const {
        name,
        modelUrl,
        previewUrl,
        backgroundColor,
        images = [],
        texts = [],
        materialOverrides = {}
    } = req.body;

    if (!name || !modelUrl) {
        return res.status(400).json({ error: 'name and modelUrl are required' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sceneJson = JSON.stringify({ images, texts, materialOverrides });

    try {
        db.prepare(`
            INSERT INTO templates (id, name, model_url, preview_url, background_color, scene_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, modelUrl, previewUrl || null, backgroundColor || '#252525', sceneJson, now, now);

        const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
        res.status(201).json(parseTemplateRow(row));
    } catch (error) {
        console.error('Failed to create template', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

app.put('/templates/:id', (req, res) => {
    const {
        name,
        modelUrl,
        previewUrl,
        backgroundColor,
        images = [],
        texts = [],
        materialOverrides = {}
    } = req.body;

    try {
        const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Template not found' });

        const updatedAt = new Date().toISOString();
        const sceneJson = JSON.stringify({ images, texts, materialOverrides });

        db.prepare(`
            UPDATE templates
            SET name = ?, model_url = ?, preview_url = ?, background_color = ?, scene_json = ?, updated_at = ?
            WHERE id = ?
        `).run(
            name || existing.name,
            modelUrl || existing.model_url,
            previewUrl ?? existing.preview_url,
            backgroundColor || existing.background_color,
            sceneJson,
            updatedAt,
            req.params.id
        );

        const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
        res.json(parseTemplateRow(row));
    } catch (error) {
        console.error('Failed to update template', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

app.delete('/templates/:id', (req, res) => {
    try {
        const info = db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
        if (info.changes === 0) return res.status(404).json({ error: 'Template not found' });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete template', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const inputFile = path.resolve(req.file.path);
    const outputFileName = req.file.filename.replace(path.extname(req.file.filename), '.glb');
    const outputFile = path.resolve(uploadDir, outputFileName);
    const blenderScript = path.resolve(__dirname, 'blender_process.py');

    console.log(`------------------------------------------------`);
    console.log(`Processing: ${req.file.originalname}`);

    // Construct command using the robust path
    const command = `"${BLENDER_PATH}" -b -P "${blenderScript}" -- "${inputFile}" "${outputFile}"`;

    console.log(`Command: ${command}`);

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (stdout) console.log(`[Blender Output]:\n${stdout.substring(0, 500)}...`);
        if (stderr) console.error(`[Blender Error Log]:\n${stderr}`);

        try {
            fs.unlinkSync(inputFile);
        } catch (unlinkError) {
            if (unlinkError.code !== 'ENOENT') {
                console.warn(`WARN: Failed to remove uploaded file ${inputFile}: ${unlinkError.message}`);
            }
        }

        if (error) {
            console.error(`EXEC ERROR: ${error.message}`);
            return res.status(500).json({
                error: 'Model conversion failed.',
                details: 'Is Blender installed and added to PATH? Or check BLENDER_PATH in server/index.js'
            });
        }

        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`SUCCESS: GLB Created (${(stats.size / 1024).toFixed(2)} KB)`);
            if (stats.size === 0) return res.status(500).json({ error: 'Conversion resulted in empty file.' });

            const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${outputFileName}`;
            res.json({ message: 'Conversion successful', url: publicUrl });
        } else {
            console.error("ERROR: Output file not found.");
            return res.status(500).json({ error: 'Output file not found after conversion.' });
        }
    });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend running on port ${PORT}`));
