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
  fs.mkdirSync(uploadDir);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API route for submitting the brief
  app.post("/api/submit-brief", upload.array("files"), async (req: any, res) => {
    console.log(">>> Received submission attempt...");

    try {
      const formData = req.body.formData ? JSON.parse(req.body.formData) : null;
      const driveLink = req.body.driveLink || "Not Provided";
      const files = req.files || [];

      if (!formData) {
        console.error("Error: No form data received");
        return res.status(400).json({ error: "Missing form data" });
      }

      console.log("Processing brief for:", formData["الاسم"] || "Unknown Client");

      const recipient = process.env.NOTIFICATION_EMAIL || "Transitionksa@gmail.com";
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      // Map specific long keys to shorter more readable labels for the table (like the screenshot)
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

      // Format the form data into an HTML table styled like the screenshot
      const tableRows = Object.entries(formData)
        .map(([question, answer], index) => {
          let displayedAnswer = answer || "N/A";
          if (Array.isArray(answer)) displayedAnswer = answer.join(", ");

          const label = labelMap[question] || question;

          return `
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 15px; text-align: center; color: #475569; font-size: 14px; background: #ffffff;">
              ${displayedAnswer}
            </td>
            <td style="border: 1px solid #e2e8f0; padding: 15px; text-align: right; font-weight: bold; color: #a22675; font-size: 14px; background: #fdf2f8; min-width: 150px;">
              ${label}
            </td>
            <td style="border: 1px solid #e2e8f0; padding: 15px; text-align: center; width: 40px; background-color: #a22675; color: white; font-weight: bold;">
              ${index + 1}
            </td>
          </tr>
        `;
        })
        .join("");

      const attachments = files.map((file: any) => ({
        filename: file.originalname,
        path: file.path,
      }));

      const mailOptions = {
        from: emailUser,
        to: recipient,
        subject: `New Brief Submission - ${formData["الاسم"] || "Client"}`,
        attachments: attachments,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 20px auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #a22675; padding: 0; display: table; width: 100%; border-collapse: collapse;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 15px; color: white; font-weight: bold; text-align: center; font-size: 18px; width: 65%;">Client Answers</div>
                <div style="display: table-cell; padding: 15px; color: white; font-weight: bold; text-align: center; font-size: 18px; border-right: 1px solid rgba(255,255,255,0.2); width: 25%;">Questions</div>
                <div style="display: table-cell; padding: 15px; color: white; font-weight: bold; text-align: center; font-size: 18px; border-right: 1px solid rgba(255,255,255,0.2); width: 10%;">
                   <img src="https://transitioneg.com/assets/logo/logo-icon.png" width="30" height="30" style="vertical-align: middle;">
                </div>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div style="padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Drive Link: <a href="${driveLink}" style="color: #a22675; font-weight: bold; text-decoration: none;">Link to Folder</a></p>
            </div>
          </div>
        `,
      };

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");

        // Cleanup files
        files.forEach((file: any) => fs.unlink(file.path, () => { }));

        return res.json({ success: true, message: "Sent successfully" });
      } else {
        return res.status(500).json({ error: "Email configuration missing" });
      }
    } catch (error: any) {
      console.error("FATAL ERROR during submission:", error.message);
      res.status(500).json({ error: "Failed to process brief", details: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
