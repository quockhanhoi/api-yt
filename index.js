import express from "express";
import youtubedl from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// ROUTE CHÍNH
// =====================
app.get("/", (req, res) => {
    const { type, q, url } = req.query;

    // =====================
    // SEARCH
    // =====================
    if (type === "search") {
        if (!q) return res.status(400).json({ error: "missing q" });

        youtubedl(`ytsearch10:${q}`, { dumpSingleJson: true })
            .then(data => {
                const result = data.entries.map(v => ({
                    id: v.id,
                    title: v.title,
                    url: `https://youtube.com/watch?v=${v.id}`,
                    thumbnail: v.thumbnail,
                    duration: v.duration,
                    author: v.uploader
                }));

                res.json({ success: true, result });
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }

    // =====================
    // MP3
    // =====================
    else if (type === "mp3") {
        if (!url) return res.status(400).json({ error: "missing url" });

        youtubedl(url, { dumpSingleJson: true })
            .then(data => {
                const audio = data.formats
                    .filter(f => f.acodec !== "none" && f.url)
                    .sort((a, b) => (a.abr || 0) - (b.abr || 0))
                    .pop();

                if (!audio) throw new Error("no audio found");

                res.redirect(audio.url);
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }

    // =====================
    // VIDEO
    // =====================
    else if (type === "video") {
        if (!url) return res.status(400).json({ error: "missing url" });

        youtubedl(url, { dumpSingleJson: true })
            .then(data => {
                const video = data.formats
                    .filter(f => f.vcodec !== "none" && f.url)
                    .sort((a, b) => (a.height || 0) - (b.height || 0))
                    .pop();

                if (!video) throw new Error("no video found");

                res.redirect(video.url);
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }

    // =====================
    // INFO
    // =====================
    else if (type === "info") {
        if (!url) return res.status(400).json({ error: "missing url" });

        youtubedl(url, { dumpSingleJson: true })
            .then(data => {
                res.json({
                    id: data.id,
                    title: data.title,
                    duration: data.duration,
                    views: data.view_count,
                    author: data.uploader,
                    thumbnail: data.thumbnail,
                    description: data.description
                });
            })
            .catch(err => res.status(500).json({ error: err.message }));
    }

    // =====================
    // DEFAULT
    // =====================
    else {
        res.json({
            error: "invalid type",
            usage: {
                search: "/?type=search&q=xxx",
                mp3: "/?type=mp3&url=xxx",
                video: "/?type=video&url=xxx",
                info: "/?type=info&url=xxx"
            }
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
