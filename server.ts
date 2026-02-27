import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn("Warning: Could not create uploads directory:", err);
  }
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post("/api/submit-brief", upload.array("files"), async (req: any, res) => {
    console.log(">>> [LOG] API Submission Start...");

    try {
      if (!req.body || !req.body.formData) {
        return res.status(400).json({ message: "No data received. Please refresh and try again." });
      }

      const formData = JSON.parse(req.body.formData);
      const driveLink = req.body.driveLink || "Not Provided";
      const files = req.files || [];

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const recipient = process.env.NOTIFICATION_EMAIL || "Transitionksa@gmail.com";

      if (!emailUser || !emailPass) {
        console.error(">>> [ERROR] EMAIL_USER or EMAIL_PASS missing in environment.");
        return res.status(500).json({ message: "Server configuration error: Missing email credentials." });
      }

      console.log(`>>> [LOG] Sending email from ${emailUser} to ${recipient}...`);

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: emailUser.trim(),
          pass: emailPass.trim()
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2"
        },
        connectionTimeout: 20000, // 20 seconds
        greetingTimeout: 20000,
        socketTimeout: 20000
      });

      // Verify connection immediately
      try {
        await transporter.verify();
        console.log(">>> [LOG] SMTP Connection Verified.");
      } catch (verifyError: any) {
        console.error(">>> [ERROR] SMTP Verification failed:", verifyError.message);
        return res.status(500).json({
          message: `Gmail Login Failed: ${verifyError.message}. Please double-check your App Password.`
        });
      }

      // Map labels
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
          const label = labelMap[question] || question;
          return `
          <tr>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:center;">${displayedAnswer}</td>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:right;font-weight:bold;color:#a22675;background:#fdf2f8;">${label}</td>
            <td style="border:1px solid #e2e8f0;padding:12px;text-align:center;width:30px;background:#a22675;color:white;">${index + 1}</td>
          </tr>`;
        }).join("");

      await transporter.sendMail({
        from: `Transition Brief <${emailUser}>`,
        to: recipient,
        subject: `New Brief - ${formData["الاسم"] || "Client"}`,
        attachments: files.map((file: any) => ({ filename: file.originalname, path: file.path })),
        html: `
          <div dir="rtl" style="font-family:sans-serif;max-width:850px;margin:10px auto;border:1px solid #e2e8f0;">
            <div style="background:#a22675;color:white;padding:15px;text-align:center;font-size:18px;">
              Transition Brief Form Submission
            </div>
            <table style="width:100%;border-collapse:collapse;"><tbody>${tableRows}</tbody></table>
            <div style="padding:15px;background:#f8fafc;text-align:center;">
              <p>Drive Link: <a href="${driveLink}" style="color:#a22675;">Click here to view folder</a></p>
            </div>
          </div>`,
      });

      console.log(">>> [LOG] Email Sent Successfully!");
      files.forEach((file: any) => fs.unlink(file.path, () => { }));
      return res.json({ success: true });

    } catch (error: any) {
      console.error(">>> [FATAL ERROR]:", error.message);
      res.status(500).json({ message: error.message || "An unexpected error occurred on the server." });
    }
  });

  if (process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"))) {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
