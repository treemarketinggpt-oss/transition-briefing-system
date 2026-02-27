import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import dns from "dns";
import path from "path";
import fs from "fs";

dotenv.config();

// FORCE IPv4 globally to fix Railway's ENETUNREACH issue
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
    console.log(">>> [LOG] Starting Submission for:", req.body?.formData ? "Data Received" : "NO DATA");

    try {
      if (!req.body || !req.body.formData) {
        return res.status(400).json({ message: "Form data is empty. Please try again." });
      }

      const formData = JSON.parse(req.body.formData);
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const recipient = process.env.NOTIFICATION_EMAIL || "Transitionksa@gmail.com";

      if (!emailUser || !emailPass) {
        return res.status(500).json({ message: "Server missing Email Credentials." });
      }

      // Nodemailer "service" mode is often more robust on cloud providers
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser.trim(),
          pass: emailPass.trim()
        },
        logger: true, // Show detailed logs in Railway
        debug: true   // Show SMTP conversation
      });

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
        from: `"Transition Brief Form" <${emailUser}>`,
        to: recipient,
        subject: `New Brief Submission - ${formData["الاسم"] || "Client"}`,
        attachments: (req.files as any[] || []).map(file => ({ filename: file.originalname, path: file.path })),
        html: `
          <div dir="rtl" style="font-family:sans-serif;max-width:850px;margin:10px auto;border:1px solid #e2e8f0;">
            <div style="background:#a22675;color:white;padding:20px;text-align:center;font-size:20px;font-weight:bold;">
               Transition Brief Form
            </div>
            <table style="width:100%;border-collapse:collapse;"><tbody>${tableRows}</tbody></table>
            <div style="padding:15px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p>Google Drive: <a href="${req.body.driveLink || '#'}" style="color:#a22675;font-weight:bold;">Folder Link</a></p>
            </div>
          </div>`,
      });

      console.log(">>> [SUCCESS] Email Sent!");
      (req.files as any[] || []).forEach(file => fs.unlink(file.path, () => { }));
      return res.json({ success: true });

    } catch (error: any) {
      console.error(">>> [ERROR] Submission failed:", error.message);
      res.status(500).json({ message: error.message || "Unknown Server Error during email send." });
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
