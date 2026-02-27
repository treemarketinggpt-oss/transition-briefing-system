import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

// Ensure uploads directory exists (use /tmp for serverless/containers if needed, but Railway should handle this)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Warning: Could not create uploads directory:", err);
  }
}

// Configure Multer - Using a more standard 1.x style configuration
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
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API route for submitting the brief
  app.post("/api/submit-brief", upload.array("files"), async (req: any, res) => {
    console.log(">>> [API] Received submission attempt...");

    try {
      // Check if body exists
      if (!req.body || !req.body.formData) {
        console.error(">>> [ERROR] No form data received in request body");
        return res.status(400).json({ error: "Missing form data. Ensure you are using the correct URL." });
      }

      const formData = JSON.parse(req.body.formData);
      const driveLink = req.body.driveLink || "Not Provided";
      const files = req.files || [];

      console.log(">>> [API] Processing brief for:", formData["الاسم"] || "Unknown Client");

      const recipient = process.env.NOTIFICATION_EMAIL || "Transitionksa@gmail.com";
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailUser || !emailPass) {
        throw new Error("Server Email Credentials (EMAIL_USER/EMAIL_PASS) are missing in Railway Variables.");
      }

      // Map specific long keys to shorter more readable labels for the table (like the screenshot)
      const labelMap: any = {
        "الاسم": "الاسم",
        "هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟": "امتلاك صفحة",
        "تعريف عن المؤسسة (بالتفصيل)؟": "وصف المؤسسة",
        "ماهو تاريخ تأسيس المؤسسة؟": "تاريخ التأسيس",
        "ما هو رقم التسجيل الضريبي للمؤسسة؟": "الرقم الضريبي",
        "هل تمتلك تعاقدات مع شركات اخري؟": "تعاقدات مع شركات",
        "المناافسين": "المنافسين",
        "دعاية المنافسين": "دعايات المنافسين",
        "المنتجات والخدمات": "الخدمات",
        "نقاط القوة": "نقاط القوة",
        "نقاط الضعف": "نقاط الضعف",
        "العروض المتاحة": "عروض",
        "هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟": "عمل مسبق",
        "الاستهدف": "الاستهداف",
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
            <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; color: #475569; font-size: 13px; background: #ffffff;">${displayedAnswer}</td>
            <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; font-weight: bold; color: #a22675; font-size: 13px; background: #fdf2f8; min-width: 140px;">${label}</td>
            <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; width: 30px; background-color: #a22675; color: white; font-weight: bold;">${index + 1}</td>
          </tr>`;
        }).join("");

      const attachments = files.map((file: any) => ({
        filename: file.originalname,
        path: file.path,
      }));

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use STARTTLS
        auth: { user: emailUser, pass: emailPass },
        tls: {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2"
        }
      });

      console.log(">>> [API] Attempting to send email via Gmail...");

      await transporter.sendMail({
        from: emailUser,
        to: recipient,
        subject: `New Brief Submission - ${formData["الاسم"] || "Client"}`,
        attachments: attachments,
        html: `
          <div dir="rtl" style="font-family: sans-serif; max-width: 850px; margin: 10px auto; border: 1px solid #e2e8f0;">
            <div style="background-color: #a22675; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold;">
              Transition Brief Form - Client Answers
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>${tableRows}</tbody>
            </table>
            <div style="padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p>Drive Link: <a href="${driveLink}" style="color: #a22675;">Click here to view folder</a></p>
            </div>
          </div>`,
      });

      console.log(">>> [API] SUCCESS: Email sent!");

      // Cleanup
      files.forEach((file: any) => fs.unlink(file.path, () => { }));

      return res.json({ success: true });
    } catch (error: any) {
      console.error(">>> [FATAL ERROR]:", error);
      res.status(500).json({
        error: "Server Error",
        message: error.message,
        hint: "Check if EMAIL_PASS is a valid 16-character App Password."
      });
    }
  });

  // Serve Static files for production
  if (process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"))) {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  } else {
    // Vite dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
