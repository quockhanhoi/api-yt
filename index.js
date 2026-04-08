import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

// helper chạy yt-dlp
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout);
        });
    });
}

// ================= MAIN =================
app.get("/", async (req, res) => {
    const { type, q, url } = req.query;

    try {

        // ================= SEARCH =================
        if (type === "search") {
            if (!q) return res.status(400).json({ error: "missing q" });

            const output = await run(`yt-dlp "ytsearch10:${q}" --dump-json`);

            const lines = output.trim().split("\n").filter(Boolean);

            const data = lines.map(v => JSON.parse(v));

            return res.json({
                success: true,
                result: data.map(v => ({
                    id: v.id,
                    title: v.title,
                    url: `https://youtube.com/watch?v=${v.id}`,
                    thumbnail: v.thumbnail,
                    duration: v.duration,
                    author: v.uploader
                }))
            });
        }

        // ================= MP3 =================
        if (type === "mp3") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const link = await run(`yt-dlp -f bestaudio -g "${url}"`);
            return res.redirect(link.trim());
        }

        // ================= VIDEO =================
        if (type === "video") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const link = await run(`yt-dlp -f best -g "${url}"`);
            return res.redirect(link.trim());
        }

        // ================= INFO =================
        if (type === "info") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const output = await run(`yt-dlp --dump-json "${url}"`);
            const data = JSON.parse(output);

            return res.json({
                id: data.id,
                title: data.title,
                duration: data.duration,
                views: data.view_count,
                author: data.uploader,
                thumbnail: data.thumbnail,
                description: data.description
            });
        }

        return res.json({
            error: "invalid type",
            usage: {
                search: "/?type=search&q=xxx",
                mp3: "/?type=mp3&url=xxx",
                video: "/?type=video&url=xxx",
                info: "/?type=info&url=xxx"
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.toString()
        });
    }
});

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});
