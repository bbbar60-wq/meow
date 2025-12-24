const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// --- CONFIGURATION ---
// If 'blender' command fails, paste your full path here (use double backslashes \\)
// Example: const BLENDER_PATH = "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe";
const BLENDER_PATH = "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe";

// Middleware
app.use(cors());
app.use(express.json());
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

            const publicUrl = `http://localhost:5000/uploads/${outputFileName}`;
            res.json({ message: 'Conversion successful', url: publicUrl });
        } else {
            console.error("ERROR: Output file not found.");
            return res.status(500).json({ error: 'Output file not found after conversion.' });
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));