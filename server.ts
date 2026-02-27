import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import dns from "dns";
import path from "path";
import fs from "fs";

dotenv.config();

// FORCE IPv4 globally to fix Railway's ENETUNREACH/Timeout issue
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (err) { }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } });

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post("/api/submit-brief", upload.array("files"), async (req: any, res) => {
    console.log(">>> [LOG] API Submission Start...");

    try {
      if (!req.body || !req.body.formData) {
        return res.status(400).json({ message: "No data received." });
      }

      const formData = JSON.parse(req.body.formData);

      // AUTO-CLEAN: Remove hidden spaces/tabs from Railway env variables
      const emailUser = (process.env.EMAIL_USER || "").replace(/\s/g, "");
      const emailPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "");
      const recipient = (process.env.NOTIFICATION_EMAIL || "Transitionksa@gmail.com").replace(/\s/g, "");

      if (!emailUser || !emailPass) {
        return res.status(500).json({ message: "Server configuration error: Credentials missing." });
      }

      console.log(`>>> [LOG] Contacting Gmail for ${emailUser}...`);

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use STARTTLS (Port 587)
        auth: {
          user: emailUser,
          pass: emailPass
        },
        family: 4, // STRICT IPv4 FORCING
        logger: true,
        debug: true,
        connectionTimeout: 15000, // Trigger error faster than 2 minutes
        tls: {
          servername: 'smtp.gmail.com', // Fixes handshake timeouts
          rejectUnauthorized: false
        }
      } as any);

      // Verify connection
      await transporter.verify();
      console.log(">>> [LOG] SMTP Authenticated!");

      const labelMap: any = {
        "الاسم": "الاسم",
        "هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟": "امتلاك صفحة",
        "تعريف عن المؤسسة (بالتفصيل)؟": "وصف المؤسسة",
        "ماهو تاريخ تأسيس المؤسسة؟": "تاريخ التأسيس",
        "ما هو رقم التسجيل الضريبي للمؤسسة؟": "الرقم الضريبي",
        "هل تمتلك تعاقدات مع شركات اخري؟": "تعاقدات مع شركات",
        "المنافسين": "المنافسين",
        "دعاية المنافسين": "دعايات المنافسين",
        "المنتجات والخدمات": "الخدمات",
        "نقاط القوة": "نقاط القوة",
        "نقاط الضعف": "نقاط الضعف",
        "العروض المتاحة": "عروض",
        "هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟": "عمل مسبق",
        "الاستهداف": "الاستهداف",
        "مبلغ التمويل": "مبلغ التمويل",
        "المنصات": "المنصات",
        "مواعيد العمل": "مواعيد العمل",
        "بيان الأسعار": "بيان أسعار",
        "أرقام وعناوين المؤسسة": "بيانات التواصل",
        "ما هو حجم المحتوي الذي تفضله؟": "حجم المحتوى",
        "هل تمتلك لوجو؟ هل تريد تجديده وعمل لوجو جديد؟ هل تمتلك سورس اللوجو القديم؟": "تفاصيل اللوجو",
        "ماهي الالوان المحببة لك بحيث تكون ألوان ال Branding الرئيسية على الصفحة؟": "الألوان المحببة"
      };

      const tableRows = Object.entries(formData)
        .map(([question, answer], index) => {
          let displayedAnswer = answer || "N/A";
          if (Array.isArray(answer)) displayedAnswer = answer.join(", ");
          return `
          <tr>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:center;">${displayedAnswer}</td>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:right;font-weight:bold;color:#a22675;background:#fdf2f8;">${labelMap[question] || question}</td>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:30px;background:#a22675;color:white;">${index + 1}</td>
          </tr>`;
        }).join("");

      await transporter.sendMail({
        from: `"Transition Brief Form" <${emailUser}>`,
        to: recipient,
        subject: `New Brief - ${formData["الاسم"] || "Client"}`,
        attachments: (req.files as any[] || []).map(f => ({ filename: f.originalname, path: f.path })),
        html: `<div dir="rtl" style="font-family:sans-serif;max-width:850px;margin:auto;"><div style="background:#a22675;color:white;padding:15px;text-align:center;font-weight:bold;">Transition Brief Form</div><table style="width:100%;border-collapse:collapse;"><tbody>${tableRows}</tbody></table><div style="padding:15px;text-align:center;"><p>Drive: <a href="${req.body.driveLink || '#'}" style="color:#a22675;">Folder Link</a></p></div></div>`,
      });

      console.log(">>> [LOG] Success!");
      (req.files as any[] || []).forEach(f => fs.unlink(f.path, () => { }));
      return res.json({ success: true });

    } catch (error: any) {
      console.error(">>> [ERROR]:", error.message);
      res.status(500).json({ message: `Gmail Error: ${error.message}. Ensure your App Password is correct.` });
    }
  });

  if (process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"))) {
    app.use(express.static("dist"));
    app.get("*", (req, res) => { res.sendFile(path.resolve(process.cwd(), "dist", "index.html")); });
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 Server running on port ${PORT}`); });
}

startServer();
