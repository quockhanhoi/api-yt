import express from "express";
import YTDlpWrap from "yt-dlp-wrap";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// tạo yt-dlp instance (tự tải binary nếu chưa có)
const ytDlp = new YTDlpWrap();

app.get("/", async (req, res) => {
    const { type, q, url } = req.query;

    try {

        // ================= SEARCH =================
        if (type === "search") {
            if (!q) return res.status(400).json({ error: "missing q" });

            const output = await ytDlp.execPromise([
                `ytsearch10:${q}`,
                "--dump-json"
            ]);

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

        // ================= INFO =================
        if (type === "info") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const output = await ytDlp.execPromise([
                url,
                "--dump-json"
            ]);

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

        // ================= MP3 (redirect stream) =================
        if (type === "mp3") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const link = await ytDlp.execPromise([
                url,
                "-f",
                "bestaudio",
                "-g"
            ]);

            return res.redirect(link.trim());
        }

        // ================= VIDEO =================
        if (type === "video") {
            if (!url) return res.status(400).json({ error: "missing url" });

            const link = await ytDlp.execPromise([
                url,
                "-f",
                "best",
                "-g"
            ]);

            return res.redirect(link.trim());
        }

        // ================= DEFAULT =================
        return res.json({
            status: "ok",
            routes: {
                search: "/?type=search&q=xxx",
                info: "/?type=info&url=xxx",
                mp3: "/?type=mp3&url=xxx",
                video: "/?type=video&url=xxx"
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});
